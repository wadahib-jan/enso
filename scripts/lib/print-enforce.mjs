/**
 * .claude/enso.json の enforce 設定を、シェルから読める行として出力する。
 *
 *   node scripts/lib/print-enforce.mjs <設定の探索起点>
 *
 *   base-branch<TAB>main
 *   protected<TAB>main
 *   protected<TAB>master
 *   protected<TAB>develop
 *
 * 設定の解釈そのものは hooks/lib/policy.mjs の resolveEnforce に委ねる。
 * ここは「値を1箇所から取り出して行に落とす」だけの薄い層であり、
 * 既定値を持たない（＝二重管理を作らない）。
 *
 * bash 側で JSON を解釈しないための形式。ブランチ名には TAB も改行も
 * 含められないので、行指向で曖昧さなく渡せる。
 */

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const policyPath = join(here, "..", "..", "hooks", "lib", "policy.mjs");
const { resolveEnforce } = await import(pathToFileURL(policyPath).href);

const { enforce } = resolveEnforce(process.argv[2]);

/**
 * ブランチ名として妥当な文字列だけを通す。
 *
 * 出力は最終的に `git switch <値>` などの引数になるため、`-` で始まる値を
 * そのまま流すとオプションとして解釈されうる（引数インジェクション）。
 * 設定ファイルは利用者自身が書くものだが、書き間違いでも同じことが起きる。
 * ここで弾いた値は行に出さず、呼び出し側は既定値にフォールバックする。
 */
const isSafeBranchName = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  !value.startsWith("-") &&
  /^[A-Za-z0-9._/-]+$/.test(value);

const lines = [];
if (isSafeBranchName(enforce.baseBranch)) {
  lines.push(`base-branch\t${enforce.baseBranch}`);
}
for (const branch of enforce.protectedBranches ?? []) {
  if (isSafeBranchName(branch)) lines.push(`protected\t${branch}`);
}

process.stdout.write(lines.length > 0 ? `${lines.join("\n")}\n` : "");
