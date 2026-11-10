#!/usr/bin/env node
/**
 * UserPromptSubmit: enso 強制モードのプロジェクトで、毎ターン「今どの段階にいるか」と
 * 「どのスキルを経由すべきか」をコンテキストに注入する。
 *
 * スキルはモデルが自律的に選ぶものなので、注入が無いと明示的に呼ばれない限り経由されない。
 * PreToolUse のガードで止まる前に状況を伝えることで、deny と再試行の往復も減らせる。
 */

import {
  emitContext,
  findLoopStates,
  gitState,
  hasLiveWorktree,
  loadPolicy,
  readHookInput,
  runHook,
} from "./lib/policy.mjs";

const SKILL_ROLES = {
  "dev-context":
    "プロジェクトの技術スタックを docs/dev/context.md にまとめる（未作成なら最初に実行）",
  "dev-plan":
    "要件をタスクに分解し、worktree・ブランチ・Draft PR・loop-state.yaml を用意する",
  "dev-loop":
    "承認済みの計画を実装 → 検証 → PR を ready にするところまで進める",
  "dev-run": "計画内のタスクを一括実装する",
  "dev-verify": "Plan 単位で完了状態とテスト・ビルド・Lint を検証する",
  "ipa-security-check": "PR を ready にする前に脆弱性を静的検査する",
};

function describeSkills(skills) {
  return skills.map(
    (skill) =>
      `- ${skill}: ${SKILL_ROLES[skill] ?? "（このプロジェクトで必須のスキル）"}`,
  );
}

/** マージ・後始末まで済んだ計画。NEXT_ACTIONS の shipped 判定の裏返し。 */
const isFinished = (state) =>
  state.status === "shipped" && !hasLiveWorktree(state);

function describeState(projectRoot, git) {
  const lines = [];
  if (git) {
    lines.push(
      `- 現在のブランチ: ${git.branch ?? "detached HEAD"}（worktree の${git.inWorktree ? "中" : "外"}）`,
    );
  }
  const states = findLoopStates(projectRoot);
  // 完了済みの計画は件数だけにする。全件を並べると計画が増えるたびに注入が膨らむ。
  // failed は放置の害があるので、worktree が無くても一覧に残す。
  const active = states.filter((state) => !isFinished(state));
  const finishedCount = states.length - active.length;
  if (active.length === 0) {
    lines.push("- 進行中の計画: なし");
  } else {
    lines.push("- 進行中の計画:");
    for (const state of active) {
      const pr = state.pr_url ? ` / ${state.pr_url}` : "";
      lines.push(
        `  - ${state.plan_name}: status=${state.status ?? "unknown"}${pr}`,
      );
    }
  }
  if (finishedCount > 0) {
    lines.push(`- 完了済みの計画: ${finishedCount} 件（一覧は省略）`);
  }
  // NEXT_ACTIONS には全件を渡す（完了判定を二重に持たないため）。
  return { lines, states };
}

/**
 * 「次にすべきこと」の候補。上から順に提示する。
 *
 * shipped / failed には worktree の実在（hasLiveWorktree）を条件に加える。
 * マージ済みの計画も loop-state.yaml は shipped のまま残り続けるため、
 * status だけで判定すると過去の全計画を毎ターン並べることになる。
 * describeState の完了判定（isFinished）も同じ条件。
 */
const NEXT_ACTIONS = [
  {
    match: (state) => state.status === "awaiting-approval",
    describe: (names) =>
      `承認待ちの計画（${names}）があります。ユーザーが承認を伝えたら dev-loop を実行してください。`,
  },
  {
    match: (state) => state.status === "running",
    describe: (names) =>
      `実行中で中断された可能性のある計画（${names}）があります。再開してよいかユーザーに確認してください。`,
  },
  {
    // 問題を抱えたまま止まっている方が放置の害が大きいので shipped より先に出す。
    match: (state) => state.status === "failed" && hasLiveWorktree(state),
    describe: (names) =>
      `中断した計画（${names}）が残っています。残存問題をユーザーに確認してから次に進んでください。`,
  },
  {
    match: (state) => state.status === "shipped" && hasLiveWorktree(state),
    describe: (names) =>
      `レビュー依頼済みで後始末が済んでいない計画（${names}）があります。dev-cleanup を実行してマージ確認のゲートを出してください。`,
  },
];

/**
 * 該当するものを**すべて**返す。
 *
 * 最初の1件で打ち切ると、「A は後始末待ち・B は承認待ち」のときに A の誘導が消える。
 * 誘導が隠れること自体がこの関数の過去の不具合だったため、隠れる経路を作らない。
 */
function nextActions(states, git, enforce) {
  const actions = [];
  for (const { match, describe } of NEXT_ACTIONS) {
    const hits = states.filter(match);
    if (hits.length === 0) continue;
    const names = hits.map((state) => state.plan_name).join(", ");
    actions.push(describe(names));
  }
  if (actions.length > 0) return actions;

  if (enforce.worktree === true && git && !git.inWorktree) {
    return [
      "実装・修正の依頼であれば、まず dev-plan を実行して worktree と Draft PR を用意してください。現在の場所でファイルを変更しようとしてもブロックされます。",
    ];
  }
  return [
    "実装・修正の依頼であれば、dev-plan → （ユーザーの承認）→ dev-loop の順で進めてください。",
  ];
}

/** 1件なら1行、複数なら見出し + 箇条書き。1件のときの見え方を変えないため。 */
function describeNextActions(actions) {
  if (actions.length === 1) return [`次にすべきこと: ${actions[0]}`];
  return ["次にすべきこと:", ...actions.map((action) => `- ${action}`)];
}

runHook(async () => {
  const input = await readHookInput();
  if (!input) return;

  const cwd = input.cwd ?? process.cwd();
  const policy = loadPolicy(cwd);
  if (policy?.enforce.flow !== true) return;
  const { enforce } = policy;

  const git = gitState(cwd);
  const { lines: stateLines, states } = describeState(
    git?.topLevel ?? policy.projectRoot,
    git,
  );

  const sections = [
    "<enso-enforcement>",
    "このプロジェクトは enso の強制モードが有効です（.claude/enso.json）。",
    "読み取りや質問への回答だけなら通常どおり進めて構いませんが、**コードを変更する依頼**では次に従ってください。",
    "",
    "必ず経由するスキル:",
    ...describeSkills(enforce.skills ?? []),
    "",
    "現在の状態:",
    ...stateLines,
    "",
    ...describeNextActions(nextActions(states, git, enforce)),
  ];

  if (enforce.worktree === true) {
    sections.push(
      "",
      `制約: コードの変更・コミット・push・PR 作成は worktree の中でのみ許可されます（保護ブランチ: ${(enforce.protectedBranches ?? []).join(", ")}）。違反する操作は PreToolUse フックでブロックされます。`,
    );
  }
  if (enforce.security === true) {
    sections.push(
      "制約: PR を ready にする前に ipa-security-check を通し、レポートを docs/dev/plans/<plan-name>/reports/ に出力する必要があります。",
    );
  }
  sections.push("</enso-enforcement>");

  emitContext(sections.join("\n"));
});
