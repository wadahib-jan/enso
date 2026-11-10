---
id: "001"
title: "pnpm-workspace.yaml を追跡下に置き allowBuilds を明示する"
status: done
priority: 1
dependencies: []
estimated_complexity: low
---

# Task: pnpm-workspace.yaml を追跡下に置き allowBuilds を明示する

## Goal

`ERR_PNPM_IGNORED_BUILDS` によって `pnpm <script>` が exit 1 で落ちる状態を解消し、あわせて未追跡の `pnpm-workspace.yaml` が毎回生成される副作用を消す。

## Interfaces

```yaml
# pnpm-workspace.yaml（新規・リポジトリに追跡させる）
allowBuilds:
  simple-git-hooks: true
```

> 🔵 `allowBuilds` のキー名と値は、pnpm 11.21.0 が自動生成したプレースホルダー（`simple-git-hooks: set this to true or false`）の形式に一致させたもの。本 worktree で `true` を置いて `pnpm check` が exit 0 になることを実測済み。

## Test Strategy

- [ ] worktree 内で `pnpm check` が exit 0 で終わり、`biome check .` の結果が出力される
- [ ] worktree 内で `pnpm secretlint` が exit 0 で終わり、検査結果が出力される
- [ ] 実行後に `git status --porcelain` が未追跡の `pnpm-workspace.yaml` を報告しない（追跡下に入っているため）
- [ ] 出力に `[ERR_PNPM_IGNORED_BUILDS]` が現れない
- [ ] メインのチェックアウト（`/workspace/enso`）でも `pnpm check` / `pnpm secretlint` が exit 0 で終わる（worktree 専用の回避策になっていないこと）
- [ ] エッジケース: `node_modules` を消した状態から `pnpm install` しても exit 0 で完了する

## Implementation Notes

- 参照すべき既存コード: `package.json`（`simple-git-hooks` の設定と `devDependencies`）
- 実装のヒント: ファイルはリポジトリルートに置く。`.gitignore` に `pnpm-workspace.yaml` が入っていないことを確認してから `git add` する
- 注意事項: このファイルは pnpm にとってワークスペース定義も兼ねる。`packages:` を書かないこと（enso は単一パッケージであり、ワークスペース化は Issue のスコープ外）
- 注意事項: `allowBuilds` は build script の実行を許可する設定なので、`simple-git-hooks` 以外のパッケージを足さない

## Files

- 新規: `pnpm-workspace.yaml`
- 変更: なし
- テスト: なし（品質ゲート `pnpm secretlint && pnpm check` の実行そのものが確認手段）
