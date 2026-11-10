/**
 * pre-commit フック（simple-git-hooks）を設置する。package.json の prepare から呼ばれる。
 *
 * worktree の中では何もしない。worktree の .git はディレクトリではなく gitdir への
 * ポインタファイルなので、simple-git-hooks が <worktree>/.git/hooks を作ろうとして
 * ENOTDIR を吐く。git の hooks は common dir で共有される（git rev-parse --git-path
 * hooks が常にメインの .git/hooks を指す）ため、worktree で設置し直す必要は無く、
 * skip してもフックは効いたままになる。
 *
 * 何が起きても exit 0 で終える。ここで落とすと pnpm install 全体が落ち、
 * Issue #10 と同じ症状を別経路で再発させる。
 */

import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

/** git を同期実行して stdout を返す。失敗したら null。 */
function runGit(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function main() {
  const out = runGit(["rev-parse", "--git-dir", "--git-common-dir"]);
  if (!out) {
    process.stdout.write(
      "setup-git-hooks: git リポジトリではないため skip します\n",
    );
    return;
  }

  // worktree の中かどうか。.git がファイルかディレクトリかを直接見るのではなく git に聞く。
  // worktree では --git-dir が .git/worktrees/<name> を指し、--git-common-dir と食い違う。
  // 相対パスで返ることがあるので resolve してから比較する。
  const [gitDir, commonDir] = out.split("\n");
  if (commonDir && resolve(gitDir) !== resolve(commonDir)) {
    process.stdout.write(
      "setup-git-hooks: worktree のため skip します（hooks は共有されており設置は不要です）\n",
    );
    return;
  }

  try {
    execFileSync("simple-git-hooks", [], { stdio: "inherit" });
  } catch (error) {
    process.stdout.write(
      `setup-git-hooks: フックを設置できませんでした (${error.message})\n`,
    );
  }
}

try {
  main();
} catch (error) {
  process.stdout.write(`setup-git-hooks: 続行します (${error.message})\n`);
}

process.exit(0);
