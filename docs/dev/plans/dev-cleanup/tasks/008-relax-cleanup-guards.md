---
id: "008"
title: "後始末を妨げる hooks のガードを緩和する"
status: done
priority: 1
dependencies: []
estimated_complexity: medium
---

# Task: 後始末を妨げる hooks のガードを緩和する

## Goal

`dev-cleanup` の汎用経路が `guard-bash.mjs` にブロックされて完走できない。ガードの**本来の意図に判定を近づける**形で3点を緩和し、「yes で自動完了」を成立させる。

## Interfaces

### 現状の問題（実測）🔵

| コマンド | 現在の挙動 | 原因 |
|---|---|---|
| `git push origin --delete <branch>` | **deny** | `tokens()` が `-` 始まりを捨てるため `--delete` が消え、単なる push として `worktreeViolation` にかかる。後始末は本体チェックアウトの `main` 上で行うので `inWorktree === false` → 違反 |
| `git worktree remove <path>` | **ask**（確認プロンプト） | `emitDecision("ask", ...)` |
| `git branch -d <branch>` | **ask**（確認プロンプト） | 同上 |

**経路によって挙動が違うことが最大の問題。** `./scripts/sync-after-merge.sh` に委譲する場合、hook が見るのはスクリプトのパスだけなので全て素通りする。enso（委譲経路）では動き、他プロジェクト（汎用経路）では止まる、という非対称が生じている。

### 緩和1: ブランチ削除の push を許可する 🔵

```js
/** `git push --delete <branch>` / `git push origin :<branch>` はブランチ削除であって内容の変更ではない。 */
function isBranchDeletePush(segment) {
  if (!matchesGitCommand(segment, ["push"])) return false;
  return /\s(--delete|-d)\b/.test(segment) || /\s:\S+/.test(segment);
}
```

worktree ガードの適用対象から外す。**ただし保護ブランチの削除は引き続き拒否する**（`enforce.protectedBranches` に載る名前が削除対象なら通さない）。

根拠: worktree ガードの目的はコード内容の変更を worktree 内に閉じ込めること。ref の削除は内容を変更しない。

### 緩和2 / 3: マージ済みなら確認を省く 🔵

```js
/** 対象ブランチが baseBranch にマージ済みか。判定できなければ false（＝従来どおり確認する）。 */
function isMergedIntoBase(cwd, branch, baseBranch) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", branch, baseBranch], {
      cwd, stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}
```

`git worktree remove` / `git branch -d` の destructive 判定で、対象がマージ済みと確認できたときだけ `ask` を出さない。

根拠: 現在の確認メッセージ自体が「**未マージの差分が無いか確認してください**」と言っている。マージ済みと確認できれば確認は不要。**緩和ではなく、ガードの本来の意図に判定を近づける変更。**

squash マージでは祖先にならず `false` を返すため、**従来どおり `ask` にフォールバックする**。安全側に倒れる。

## Test Strategy

- [ ] `git push origin --delete worktree-x` が worktree 外・`main` 上で **deny されない**
- [ ] `git push origin --delete main` は**引き続き拒否される**（保護ブランチの削除）
- [ ] `git push origin worktree-x`（通常の push）は worktree 外で**引き続き deny される**（緩和が広がりすぎていない）
- [ ] `git commit` が worktree 外で**引き続き deny される**
- [ ] マージ済みブランチに対する `git worktree remove <path>` で **ask が出ない**
- [ ] 未マージブランチに対する `git worktree remove <path>` で **ask が出る**
- [ ] マージ済みブランチに対する `git branch -d <branch>` で ask が出ない / 未マージなら出る
- [ ] `merge-base` が失敗する状況（存在しないブランチ名など）で `false` を返し、**ask にフォールバックする**
- [ ] 異常系: `execFileSync` が例外を投げても hook が **exit 0 で終わる**（`runHook()` が握り潰すことの確認）
- [ ] エッジケース: `enforce.enabled` が `false` のプロジェクトで hook が**無出力で終了する**（既存の保証を壊していない）
- [ ] `pnpm check` が通る（`hooks/*.mjs` は Biome の対象）

## Implementation Notes

- 参照すべき既存コード:
  - `hooks/guard-bash.mjs` の `segments()` / `tokens()` / `matchesGitCommand()` と、worktree ガード・destructive 判定の2ブロック
  - `hooks/lib/policy.mjs` の `worktreeViolation()`（240行付近）と `gitState()`（77行付近）。`execFileSync` は既に import 済み
- **`tokens()` を変更しない。** `-` 始まりを捨てる仕様は他の判定が依存している。`--delete` の検出は生の `segment` に対する正規表現で行う
- **必ず exit 0 で終える。** `merge-base` の呼び出しは try/catch で囲み、失敗時は「判定できなかった」＝ ask にフォールバックする
- **`jq` に依存しない。** Node で完結させる
- 判定の基準は `gitState().topLevel`。設定ファイルの位置ではない
- ブランチ削除の push で「削除対象のブランチ名」を取り出す必要がある。`--delete <branch>` 形式と `origin :<branch>` 形式の両方に対応する
- `baseBranch` は `enforce.baseBranch`（既定 `main`）を使う

## Files

- 変更: `hooks/guard-bash.mjs`
- 変更: `hooks/lib/policy.mjs`（ヘルパを置く場合。`guard-bash.mjs` 内に閉じてもよい）
