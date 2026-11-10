---
id: "002"
title: "prepare を worktree で skip するガードを追加する"
status: done
priority: 2
dependencies: ["001"]
estimated_complexity: medium
---

# Task: prepare を worktree で skip するガードを追加する

## Goal

worktree 内での `pnpm install` / `pnpm <script>` 実行時に、simple-git-hooks が `ENOTDIR` エラーログを出さないようにする。hooks は common dir で共有されるため、worktree での設置は不要である。

## Interfaces

```
scripts/setup-git-hooks.mjs（新規）

  1. `git rev-parse --git-dir` と `git rev-parse --git-common-dir` を取得する
  2. 両者が同じディレクトリを指す  → simple-git-hooks を実行する
  3. 異なる（= worktree の中）      → 理由を1行出して何もしない
  4. git が使えない / 取得に失敗    → 何もしない
  5. いずれの経路でも exit 0 で終える
```

```json
// package.json
"scripts": {
  "prepare": "node scripts/setup-git-hooks.mjs"
}
```

> 🔵 判定方法（`--git-dir` と `--git-common-dir` の比較）は本 worktree で実測確認済み。worktree では `/workspace/enso/.git/worktrees/<name>` と `/workspace/enso/.git` に分かれる。
> 🔵 hooks が common dir 共有であること（`git rev-parse --git-path hooks` → `/workspace/enso/.git/hooks`）も実測確認済み。
> 🟡 `simple-git-hooks` の呼び出し方（CLI を子プロセスで起動するか、パッケージを import するか）は実装時に決めてよい。CLI の起動が既存の挙動に最も近い。

## Test Strategy

- [ ] worktree 内で `pnpm install` を実行すると、`prepare` の出力に skip した旨の1行が出て、`ENOTDIR` を含む `[ERROR]` 行が `prepare` から出ない
- [ ] worktree 内で `pnpm check` が exit 0 で終わる（001 の結果を壊していない）
- [ ] メインのチェックアウトで `pnpm prepare` を実行すると simple-git-hooks が走り、`.git/hooks/pre-commit` が更新される
- [ ] メインのチェックアウトで `git commit` すると pre-commit フック（`pnpm secretlint && pnpm check`）が実行される
- [ ] worktree 内で `git commit` しても、共有された `.git/hooks/pre-commit` が実行される（skip によってフックが無効化されていないこと）
- [ ] エッジケース: git リポジトリでないディレクトリで `node scripts/setup-git-hooks.mjs` を実行しても exit 0 で終わる
- [ ] `pnpm check`（Biome）が `scripts/setup-git-hooks.mjs` を対象に含み、指摘なしで通る

## Implementation Notes

- 参照すべき既存コード: `hooks/lib/policy.mjs`（git の状態を子プロセスで取得するパターン）、`package.json`
- 実装のヒント: `--git-dir` / `--git-common-dir` は相対パスで返ることがあるため、比較前に `path.resolve()` で正規化する
- **`jq` に依存しない。** 判定は Node から git を呼んで行う（enso の hooks と同じ原則）
- **必ず exit 0 で終える。** ここで失敗すると `pnpm install` 全体が落ち、Issue #10 と同じ症状を別経路で再発させる。try/catch で全経路を握り潰す
- **基準は git に聞く。** `.git` がファイルかディレクトリかを直接見るのではなく、`git rev-parse` の結果で判定する
- 注意事項: 001 で `allowBuilds: simple-git-hooks: true` を入れるため、simple-git-hooks 自身の postinstall も走る。そちらのログは本タスクでは消えない（消すのは `prepare` 経由の重複分）。Test Strategy の1項目目は「`prepare` から出ないこと」を見る

## Files

- 新規: `scripts/setup-git-hooks.mjs`
- 変更: `package.json`（`scripts.prepare`）
- テスト: なし（品質ゲートと上記の手動確認項目）
