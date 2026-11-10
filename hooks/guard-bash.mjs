#!/usr/bin/env node
/**
 * PreToolUse (Bash): git commit / push と PR 操作をガードする。
 *
 * - commit / push / gh pr create: worktree の外・保護ブランチ上なら止める
 * - gh pr ready: セキュリティチェック未実施なら止める
 * - gh pr merge: マージ承認の記録が無ければ止める
 * - worktree / ブランチの削除: 取り返しがつかないので確認に落とす
 */

import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  APPROVAL_MAX_AGE_HOURS,
  approvalStatus,
  emitDecision,
  findLoopStateForPr,
  gitState,
  loadPolicy,
  readHookInput,
  runHook,
  worktreeViolation,
} from "./lib/policy.mjs";

/** `echo "git push"` のような偽陽性を避けるため、コマンドを区切ってから先頭トークンを見る。 */
function segments(command) {
  return command
    .split(/&&|\|\||[;|\n]/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function tokens(segment) {
  return segment.split(/\s+/).filter((token) => !token.startsWith("-"));
}

/** `git -C <path> commit` のようにオプションが挟まっても拾えるようにする。 */
function matchesGitCommand(segment, verbs) {
  const parts = tokens(segment);
  if (parts[0] !== "git") return false;
  return parts
    .slice(1)
    .some((part, index) => verbs.includes(part) && index <= 2);
}

function matchesGhCommand(segment, sub) {
  const parts = tokens(segment);
  return parts[0] === "gh" && parts[1] === "pr" && parts[2] === sub;
}

const REF_PREFIX = /^refs\/heads\//;

/**
 * `git push --delete <branch>...` / `git push origin :<branch>` はブランチ削除。
 * ref を消すだけで内容を変更しないので、worktree ガードの対象から外す。
 *
 * **削除対象は必ず全件返す。** 1件だけ見ると
 * `git push origin --delete feature main` のように、許可される名前を先頭に置いて
 * 保護ブランチを道連れに消す抜け道ができる。
 *
 * `tokens()` は `-` 始まりを捨てるため、判定は生の segment に対して行う。
 */
function branchDeletePushTargets(segment) {
  if (!matchesGitCommand(segment, ["push"])) return [];
  const words = segment.split(/\s+/).slice(1);
  const targets = [];

  // コロン形式（`:branch` は削除。`src:dst` は削除ではない）
  for (const word of words) {
    if (word.startsWith(":") && word.length > 1) targets.push(word.slice(1));
  }

  if (/(^|\s)(--delete|-d)(\s|$)/.test(segment)) {
    // --delete 以降の非オプション語のうち、先頭のリモート名を除いた残りが対象。
    const after = words.slice(
      words.findIndex((w) => w === "--delete" || w === "-d") + 1,
    );
    const operands = after.filter((w) => !w.startsWith("-"));
    // `git push --delete origin a b` / `git push origin --delete a b` の両形に対応する。
    // リモート名がどちらに来るか判別できないため、**全operandを対象とみなす**（安全側）。
    targets.push(...operands);
  }

  return targets.map((t) => t.replace(REF_PREFIX, ""));
}

/**
 * `git branch -d/-D <branch>...` の削除対象を全件返す。
 * 1件だけ見ると `git branch -D merged unmerged` で確認を回避できてしまう。
 */
function destructiveTargets(segment) {
  if (!/(^|\s)-[dD](\s|$)/.test(segment)) return [];
  const words = segment.split(/\s+/);
  const at = words.indexOf("branch");
  if (at < 0) return [];
  return words
    .slice(at + 1)
    .filter((w) => !w.startsWith("-"))
    .map((w) => w.replace(REF_PREFIX, ""));
}

/**
 * 対象が baseBranch にマージ済みか。
 * 判定できなければ false を返し、呼び出し側は従来どおり確認を出す（安全側）。
 */
function isMergedIntoBase(cwd, ref, baseBranch) {
  if (!ref || !baseBranch) return false;
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ref, baseBranch], {
      cwd,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * `git worktree remove <path>` の対象にチェックアウトされているブランチ名を得る。
 * パスは解決して**完全一致**で突き合わせる。部分一致にすると
 * `remove cleanup` が `.../dev-cleanup` に当たるなど、別 worktree の
 * マージ状態で判定してしまう。
 */
function branchOfWorktree(cwd, segment) {
  const words = segment.split(/\s+/);
  const at = words.indexOf("remove");
  if (at < 0) return null;
  const operand = words.slice(at + 1).find((w) => !w.startsWith("-"));
  if (!operand) return null;
  const wanted = resolve(cwd, operand);
  try {
    const out = execFileSync("git", ["worktree", "list", "--porcelain"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    let path = null;
    for (const line of out.split("\n")) {
      if (line.startsWith("worktree ")) path = resolve(line.slice(9));
      else if (line.startsWith("branch ") && path === wanted) {
        return line.slice(7).replace(REF_PREFIX, "");
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * `gh pr <sub> [<number>|<url>|<branch>] [flags]`（sub は merge / ready）の対象を取り出す。
 * gh pr <sub> でなければ null。
 *
 * 対象が省略された場合は現在のブランチが対象になるため、
 * prNumber も branch も null で返し、呼び出し側が gitState().branch で補う。
 */
function prTarget(segment, sub) {
  if (!matchesGhCommand(segment, sub)) return null;
  const operand = tokens(segment)[3];
  if (!operand) return { prNumber: null, branch: null };
  // URL 指定（.../pull/27）でも末尾の番号を拾う。
  const asNumber = operand.match(/^(?:.*\/pull\/)?(\d+)$/);
  if (asNumber) return { prNumber: asNumber[1], branch: null };
  return { prNumber: null, branch: operand };
}

/** 承認記録が無い / 使えないときの deny 理由。 */
function approvalViolation(kind, planName) {
  const cause =
    kind === "stale"
      ? `マージ承認の記録が古すぎます（${APPROVAL_MAX_AGE_HOURS} 時間以内の承認が必要です）。`
      : kind === "invalid"
        ? "マージ承認の記録を日時として解釈できません。"
        : "マージ承認の記録がありません。";
  const lines = [
    `enso 強制モード: ${cause}`,
    "",
    "`/enso:dev-cleanup` を実行し、Step 3 のマージ確認で承認してから `gh pr merge` してください。",
    "承認すると loop-state.yaml に merge_approved_at が記録され、このガードを通過できます。",
  ];
  if (planName) lines.push("", `対象の計画: ${planName}`);
  lines.push(
    "",
    "この制約は .claude/enso.json（enforce.flow）によるものです。",
  );
  return lines.join("\n");
}

/**
 * ipa-security-check のレポートが**対象 PR の計画の** reports/ に出ているか。
 * 他の計画のレポートは見ない。過去の計画を削除しても判定が変わらないようにするため。
 */
function hasSecurityReport(projectRoot, state) {
  const dir = join(
    projectRoot,
    "docs",
    "dev",
    "plans",
    state.plan_dir,
    "reports",
  );
  try {
    return readdirSync(dir).some((name) => /security/i.test(name));
  } catch {
    return false;
  }
}

runHook(async () => {
  const input = await readHookInput();
  if (!input) return;

  const command = input.tool_input?.command;
  if (typeof command !== "string" || !command.trim()) return;

  const cwd = input.cwd ?? process.cwd();
  const policy = loadPolicy(cwd);
  if (!policy) return;
  const { enforce } = policy;

  const parts = segments(command);
  // 以下のルールはすべて先頭トークンが git / gh のセグメントにしか反応しない。
  // 無関係なコマンドで git を起動しないよう、全ルールの必要条件を先に評価する。
  if (!parts.some((segment) => ["git", "gh"].includes(tokens(segment)[0]))) {
    return;
  }
  const git = gitState(cwd);
  const root = git?.topLevel ?? policy.projectRoot;

  if (enforce.worktree === true && git) {
    const protectedBranches = enforce.protectedBranches ?? [];
    const writes = parts.find((segment) => {
      // ブランチ削除の push は内容を変更しないので通す。
      // ただし1つでも保護ブランチが混じっていれば拒否する。
      const deleted = branchDeletePushTargets(segment);
      if (deleted.length > 0) {
        return deleted.some((branch) => protectedBranches.includes(branch));
      }
      return (
        matchesGitCommand(segment, ["commit", "push"]) ||
        matchesGhCommand(segment, "create")
      );
    });
    if (writes) {
      const reason = worktreeViolation(enforce, git, "コミット・push・PR 作成");
      if (reason) {
        emitDecision(enforce.mode, reason);
        return;
      }
    }
  }

  const readyTargets =
    enforce.security === true
      ? parts.map((segment) => prTarget(segment, "ready")).filter(Boolean)
      : [];
  // `gh pr ready 12 && gh pr ready 34` のように複数あれば全件を検査する。
  // レポート欠落（enforce.mode）を、計画が見つからない（ask）より優先して出す。
  // 計画が解決できない ready の ask は、ここで return せず後続ゲートまで保留する。
  // 先に return すると `gh pr ready 99999 && gh pr merge` でマージゲートの deny を飛ばせるため。
  const asks = [];
  // deny は単独で出す。ask / warn は保留中の ask と連結し、1回の ask にまとめる。
  const decide = (mode, reason) => {
    if (asks.length === 0) return emitDecision(mode, reason);
    if (mode === "ask" || mode === "warn") {
      return emitDecision("ask", [...asks, reason].join("\n\n"));
    }
    return emitDecision(mode, reason);
  };
  let unresolved = false;
  for (const target of readyTargets) {
    // 番号・URL を明示したときは現在のブランチで補わない。
    // 補うと、別 PR が今いる計画のレポートで通過してしまうため。
    const state = findLoopStateForPr(root, {
      prNumber: target.prNumber,
      branch: target.prNumber ? null : (target.branch ?? git?.branch ?? null),
    });
    if (!state) {
      unresolved = true;
      continue;
    }
    if (!hasSecurityReport(root, state)) {
      emitDecision(
        enforce.mode,
        [
          `enso 強制モード: この PR（計画: ${state.plan_name}）のセキュリティチェックのレポートがありません。`,
          "",
          "`/enso:ipa-security-check` を実行し、レポートを",
          "docs/dev/plans/<plan-name>/reports/ に出力してから `gh pr ready` してください。",
          "",
          "この制約は .claude/enso.json（enforce.security）によるものです。",
        ].join("\n"),
      );
      return;
    }
  }
  if (unresolved) {
    // マージゲートと同じく、enso の計画と結びつかない PR は締め出さない。
    asks.push(
      [
        "enso 強制モード: この PR に対応する loop-state.yaml が見つからず、セキュリティチェックのレポートを確認できません。",
        "",
        "enso の計画による PR であれば `/enso:ipa-security-check` を実行し、レポートを",
        "docs/dev/plans/<plan-name>/reports/ に出力してから `gh pr ready` してください。",
      ].join("\n"),
    );
  }

  if (enforce.flow === true) {
    const target = parts
      .map((segment) => prTarget(segment, "merge"))
      .find(Boolean);
    if (target) {
      const state = findLoopStateForPr(root, {
        prNumber: target.prNumber,
        branch: target.branch ?? git?.branch ?? null,
      });
      if (!state) {
        // enso の計画と結びつかない PR。手動マージの正当な経路があるので締め出さない。
        decide(
          "ask",
          [
            "enso 強制モード: この PR に対応する loop-state.yaml が見つからず、マージ承認を確認できません。",
            "",
            "enso の計画による PR であれば `/enso:dev-cleanup` から進めてください。",
            "そうでなければ、このままマージして問題ありません。",
          ].join("\n"),
        );
        return;
      }
      const approval = approvalStatus(state.merge_approved_at);
      if (approval !== "ok") {
        decide(enforce.mode, approvalViolation(approval, state.plan_name));
        return;
      }
    }
  }

  if (enforce.mode !== "warn" && enforce.worktree === true) {
    const base = enforce.baseBranch ?? "main";
    const destructive = parts.find((segment) => {
      const isWorktreeRemove =
        matchesGitCommand(segment, ["worktree"]) && /\bremove\b/.test(segment);
      const isBranchDelete =
        matchesGitCommand(segment, ["branch"]) && /\s-[dD]\b/.test(segment);
      if (!isWorktreeRemove && !isBranchDelete) return false;

      // 確認の趣旨は「未マージの差分を失わないか」。
      // **全ての削除対象がマージ済みと確認できたときだけ**確認を省く。
      const refs = isWorktreeRemove
        ? [branchOfWorktree(cwd, segment)]
        : destructiveTargets(segment);
      if (refs.length === 0) return true;
      return !refs.every((ref) => isMergedIntoBase(cwd, ref, base));
    });
    if (destructive) {
      decide(
        "ask",
        "enso 強制モード: worktree / ブランチの削除は作業内容を失う可能性があります。未マージの差分が無いか確認してください。",
      );
      return;
    }
  }

  // どのゲートも判定を出さなかった場合に限り、保留した ready の ask を出す。
  if (asks.length > 0) emitDecision("ask", asks.join("\n\n"));
});
