/**
 * enso 強制モードの共有ロジック。
 *
 * すべての hook はここを経由して <project>/.claude/enso.json を読む。
 * 設定が無い / 無効なプロジェクトでは null を返し、hook 側は無出力で終了する。
 * これが「設定していないプロジェクトには一切影響しない」ことの保証になる。
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const CONFIG_RELATIVE_PATH = join(".claude", "enso.json");

const DEFAULT_ENFORCE = {
  enabled: false,
  mode: "deny",
  worktree: true,
  flow: true,
  security: true,
  skills: ["dev-plan", "dev-loop", "ipa-security-check"],
  baseBranch: "main",
  // dev-cleanup が gh pr merge に渡す方式。hook はこの値を参照しない。
  mergeMethod: "merge",
  protectedBranches: ["main", "master", "develop"],
  exclude: ["docs/**", "*.md", ".claude/**", ".gitignore"],
};

/** ガードより優先して常に許可するパス。設定変更と計画作成を自分でブロックしないため。 */
const ALWAYS_ALLOWED = [".claude/enso.json", "docs/dev/**"];

/** stdin の JSON を読む。壊れていれば null。 */
export async function readHookInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * cwd から上方向に .claude/enso.json を探し、DEFAULT_ENFORCE とマージした値を返す。
 * enabled の値は見ないので、**強制モードが無効でも設定値が取れる**。
 *
 * 設定が無い / JSON が壊れている場合も既定値を返し、configPath を null にする。
 * hooks 以外の利用者（scripts/sync-after-merge.sh）がここを通ることで、
 * 設定の解釈が enso 全体で1箇所に留まる。
 */
export function resolveEnforce(cwd) {
  const fallback = {
    enforce: { ...DEFAULT_ENFORCE },
    configPath: null,
    projectRoot: cwd ? resolve(cwd) : null,
  };
  if (!cwd) return fallback;
  let dir = resolve(cwd);
  for (;;) {
    const configPath = join(dir, CONFIG_RELATIVE_PATH);
    if (existsSync(configPath)) {
      let parsed;
      try {
        parsed = JSON.parse(readFileSync(configPath, "utf8"));
      } catch (error) {
        process.stderr.write(
          `enso: ${configPath} の JSON を読めません (${error.message})\n`,
        );
        return fallback;
      }
      return {
        enforce: { ...DEFAULT_ENFORCE, ...(parsed?.enforce ?? {}) },
        configPath,
        projectRoot: dir,
      };
    }
    const parent = dirname(dir);
    if (parent === dir) return fallback;
    dir = parent;
  }
}

/**
 * cwd から上方向に .claude/enso.json を探す。
 * 見つからない・壊れている・enabled でない場合は null。
 */
export function loadPolicy(cwd) {
  const { enforce, configPath, projectRoot } = resolveEnforce(cwd);
  if (!configPath) return null;
  if (enforce.enabled !== true) return null;
  return { enforce, configPath, projectRoot };
}

/**
 * git の状態をまとめて取得する。git 管理外なら null。
 * `topLevel` は worktree 内では worktree のルートを指すので、
 * 設定ファイルの置き場所（projectRoot）ではなく常にこちらを内容の基準にする。
 */
export function gitState(cwd) {
  let out;
  try {
    out = execFileSync(
      "git",
      [
        "rev-parse",
        "--git-dir",
        "--git-common-dir",
        "--show-toplevel",
        "--abbrev-ref",
        "HEAD",
      ],
      { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
  } catch {
    return null;
  }
  const [gitDir, gitCommonDir, topLevel, branch] = out.trim().split("\n");
  if (!topLevel) return null;
  return {
    topLevel,
    branch: branch === "HEAD" ? null : branch,
    // worktree の中では --git-dir が .git/worktrees/<name> を指し、共通ディレクトリと食い違う。
    inWorktree: resolve(cwd, gitDir) !== resolve(cwd, gitCommonDir),
  };
}

function globToRegExp(pattern) {
  let source = "";
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === "*") {
      if (pattern[i + 1] === "*") {
        source += ".*";
        i++;
      } else {
        source += "[^/]*";
      }
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`);
}

/** スラッシュを含まないパターンはベース名にも当てる（`*.md` が全階層に効くように）。 */
function matchesGlob(relativePath, pattern) {
  const normalized = relativePath.split(sep).join("/");
  const regex = globToRegExp(pattern);
  if (regex.test(normalized)) return true;
  if (!pattern.includes("/")) {
    const base = normalized.split("/").pop();
    return regex.test(base);
  }
  return false;
}

/** ガード対象外か（exclude 設定 + 常に許可するパス）。 */
export function isExcluded(relativePath, patterns) {
  const all = [...ALWAYS_ALLOWED, ...(patterns ?? [])];
  return all.some((pattern) => matchesGlob(relativePath, pattern));
}

/** projectRoot からの相対パス。外に出るなら null。 */
export function relativeToRoot(projectRoot, filePath) {
  if (!filePath) return null;
  const absolute = isAbsolute(filePath)
    ? filePath
    : resolve(projectRoot, filePath);
  const rel = relative(projectRoot, absolute);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) return null;
  return rel;
}

const LOOP_STATE_FIELDS = [
  "plan_name",
  "status",
  "branch",
  "worktree",
  "pr_number",
  "pr_url",
  // 承認ゲートを通った事実。承認時に初めて書かれるので、
  // 計画作成直後の loop-state.yaml には存在しない（= まだ承認されていない）。
  "impl_approved_at",
  "merge_approved_at",
];

/** 承認記録の既定の有効期間（時間）。これより古い承認は使い回しとみなす。 */
export const APPROVAL_MAX_AGE_HOURS = 24;

/**
 * loop-state の値は <enso-enforcement> ブロックや deny の理由文にそのまま埋め込まれる（Issue #33）。
 * 完全一致の正規表現で `<` `>`・空白・改行を排除し、長さの上限もかける。
 * `u` フラグを付けないので `\w` は ASCII の英数字と `_` だけにマッチする。
 */
const SAFE_TOKEN = /^[\w.-]{1,64}$/;
const PR_URL =
  /^https:\/\/github\.com\/[\w.-]{1,100}\/[\w.-]{1,100}\/pull\/\d{1,10}$/;

/** 書式を満たさない値はプロパティごと付けない。利用側の `??` フォールバックを効かせるため。 */
const LOOP_STATE_FORMATS = {
  plan_name: SAFE_TOKEN,
  status: SAFE_TOKEN,
  pr_url: PR_URL,
};

/** ディレクトリ名が書式を満たさず、plan_name も無効なときに表示へ使う固定名。 */
const INVALID_PLAN_NAME = "invalid-plan-name";

/**
 * @typedef {{
 *   plan_dir: string,
 *   path: string,
 *   plan_name: string,
 *   status?: string,
 *   branch?: string,
 *   worktree?: string,
 *   pr_number?: string,
 *   pr_url?: string,
 *   impl_approved_at?: string,
 *   merge_approved_at?: string,
 * }} LoopState
 */

/**
 * docs/dev/plans/<plan>/loop-state.yaml を軽量に読む。
 * フラットなスカラーだけを見るので YAML パーサは不要。
 *
 * plan_name / status / pr_url は書式を検証する（LOOP_STATE_FORMATS）。
 * plan_dir は readdirSync の実名のまま返す（パスの組み立てに使うため）。表示には使わない。
 * plan_name は必ず埋める（表示名）: 有効な plan_name → 書式を満たすディレクトリ名 → 固定名の順。
 * status は列挙値に限定しない。未知の status でも計画の列挙自体は続けたいため。
 *
 * @param {string} projectRoot
 * @returns {LoopState[]}
 */
export function findLoopStates(projectRoot) {
  const plansDir = join(projectRoot, "docs", "dev", "plans");
  let entries;
  try {
    entries = readdirSync(plansDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const states = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const statePath = join(plansDir, entry.name, "loop-state.yaml");
    let text;
    try {
      text = readFileSync(statePath, "utf8");
    } catch {
      continue;
    }
    const state = { plan_dir: entry.name, path: statePath };
    for (const field of LOOP_STATE_FIELDS) {
      const match = text.match(new RegExp(`^${field}:\\s*(.+?)\\s*$`, "m"));
      if (!match) continue;
      // 引用符を外してから検証する。外す前だと `"plan"` が不一致になる。
      const value = match[1].replace(/^["']|["']$/g, "");
      const format = LOOP_STATE_FORMATS[field];
      if (format && !format.test(value)) continue;
      state[field] = value;
    }
    // 表示名はここで確定させ、利用側は plan_name だけを見る。
    // ディレクトリ名が不適合なら固定名で埋める。計画ごと外すとマージゲートが
    // 「計画なし」の ask になり、deny が弱まるため一覧には残す。
    state.plan_name ??= SAFE_TOKEN.test(entry.name)
      ? entry.name
      : INVALID_PLAN_NAME;
    states.push(state);
  }
  return states;
}

/**
 * loop-state が指す worktree がまだ実在するか。
 *
 * 後始末（dev-cleanup / scripts/sync-after-merge.sh）が済むと worktree は削除されるため、
 * 「status は shipped だが、まだ片付いていない」計画をこれで見分ける。
 *
 * merge_approved_at は判別に使えない。マージ承認ゲートの導入より前に作られた計画は
 * マージ済みでもこのフィールドを持たないため、「記録が無い＝未マージ」とは読めない。
 *
 * worktree は dev-plan Phase 5d が絶対パスで記録するので、相対パス解決は行わない。
 * 基準ディレクトリを推測すると worktree の中と外で判定がずれる。
 */
export function hasLiveWorktree(state) {
  const path = state?.worktree;
  // 値が無い / 空 / 文字列でない loop-state.yaml でも例外を投げずに false を返す。
  // hook が落ちて誘導文が丸ごと消える方が、判定を1件取りこぼすより害が大きい。
  if (typeof path !== "string" || path === "") return false;
  return existsSync(path);
}

/**
 * PR 番号 / ブランチ名に対応する loop-state を1件返す。見つからなければ null。
 *
 * pr_number の一致を優先し、無ければ branch の一致で探す。
 * pr_number は正規表現で読むため文字列で入る。数値で渡されても比較できるよう String に揃える。
 */
export function findLoopStateForPr(projectRoot, { prNumber, branch } = {}) {
  if (!projectRoot) return null;
  const states = findLoopStates(projectRoot);
  if (prNumber != null && prNumber !== "") {
    const wanted = String(prNumber);
    const hit = states.find(
      (state) => String(state.pr_number ?? "") === wanted,
    );
    if (hit) return hit;
  }
  if (branch) {
    const hit = states.find((state) => state.branch === branch);
    if (hit) return hit;
  }
  return null;
}

/**
 * 承認記録の有効性を判定する。
 *
 * 未来の日時は "ok" として扱う。時計ずれで正当な承認を弾く方が害が大きいため。
 *
 * @returns {"ok"|"missing"|"stale"|"invalid"}
 */
export function approvalStatus(isoString, options = {}) {
  const { maxAgeHours = APPROVAL_MAX_AGE_HOURS, now = Date.now() } = options;
  if (isoString == null) return "missing";
  const text = String(isoString).trim();
  if (!text || text === "null" || text === "~") return "missing";
  const at = Date.parse(text);
  if (Number.isNaN(at)) return "invalid";
  if (now - at > maxAgeHours * 3600 * 1000) return "stale";
  return "ok";
}

/** PreToolUse の判定を stdout に書く。mode が warn のときは警告だけ出して通す。 */
export function emitDecision(mode, reason) {
  if (mode === "warn") {
    process.stdout.write(JSON.stringify({ systemMessage: `enso: ${reason}` }));
    return;
  }
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: mode === "ask" ? "ask" : "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
}

export function emitContext(additionalContext) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext,
      },
    }),
  );
}

/**
 * hook 本体を包む。何が起きても exit 0 で終える。
 * hook のバグでセッションが止まるのが最悪のシナリオなので、失敗は握り潰して通す。
 */
export async function runHook(main) {
  try {
    await main();
  } catch (error) {
    process.stderr.write(`enso hook error: ${error?.message ?? error}\n`);
  }
  process.exit(0);
}

/**
 * worktree ガードの違反判定。違反していれば是正手順を含む理由、していなければ null。
 * `action` は「main 上での編集」など、何を止めたのかを示す短い語。
 */
export function worktreeViolation(enforce, git, action) {
  if (enforce.worktree !== true || !git) return null;
  const onProtected =
    git.branch && (enforce.protectedBranches ?? []).includes(git.branch);
  if (git.inWorktree && !onProtected) return null;

  const cause = git.inWorktree
    ? `保護ブランチ ${git.branch} 上での${action}`
    : `worktree の外（${git.branch ?? "detached HEAD"}）での${action}`;
  return [
    `enso 強制モード: ${cause}はできません。`,
    "",
    "次のいずれかで作業環境を用意してから、やり直してください。",
    '1. 機能追加・修正の依頼なら `/enso:dev-plan <plan-name> "<要件>"` を実行する',
    "   （worktree・ブランチ・Draft PR・loop-state.yaml がまとめて用意されます）",
    "2. 承認済みの計画があるなら `/enso:dev-loop` を実行する（worktree に移動して実装が進みます）",
    "3. 計画を挟むほどでもない単発の修正なら `EnterWorktree` で worktree に入ってから編集する",
    "",
    "この制約はこのプロジェクトの .claude/enso.json（enforce.worktree）によるものです。",
  ].join("\n");
}
