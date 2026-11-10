#!/usr/bin/env node
/**
 * PreToolUse (Edit|Write|NotebookEdit): worktree の外・保護ブランチ上でのファイル変更を止める。
 * .claude/enso.json が無い / enforce.enabled でないプロジェクトでは何も出力しない。
 */

import {
  emitDecision,
  gitState,
  isExcluded,
  loadPolicy,
  readHookInput,
  relativeToRoot,
  runHook,
  worktreeViolation,
} from "./lib/policy.mjs";

runHook(async () => {
  const input = await readHookInput();
  if (!input) return;

  const cwd = input.cwd ?? process.cwd();
  const policy = loadPolicy(cwd);
  if (policy?.enforce.worktree !== true) return;

  const git = gitState(cwd);
  if (!git) return;

  const filePath =
    input.tool_input?.file_path ?? input.tool_input?.notebook_path;
  // worktree の中では git の topLevel が worktree ルートになる。設定ファイルの位置ではなく
  // こちらを基準にしないと、exclude が worktree のパス接頭辞に引きずられて誤判定する。
  const relativePath = relativeToRoot(git.topLevel, filePath);
  // 作業ツリー外のファイル（スクラッチパッド等）は対象外。
  if (!relativePath) return;
  if (isExcluded(relativePath, policy.enforce.exclude)) return;

  const reason = worktreeViolation(
    policy.enforce,
    git,
    `${relativePath} の変更`,
  );
  if (reason) emitDecision(policy.enforce.mode, reason);
});
