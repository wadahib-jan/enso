---
id: "005"
title: "品質ゲートとマニフェスト検証を通す"
status: done
priority: 4
dependencies: ["001", "002", "003", "004"]
estimated_complexity: low
---

# Task: 品質ゲートとマニフェスト検証を通す

## Goal

追加・変更した全ファイルがリポジトリの品質ゲートを通過し、プラグインとして正しく読み込めることを確認する。

## Interfaces

実行するコマンド: 🔵

```bash
pnpm secretlint                        # 機密情報の検査
pnpm check                             # Biome（JSON / JS・TS が対象。.md は対象外）
claude plugin validate .               # マニフェスト検証
./scripts/install-local.sh --dry-run   # 投入差分の確認（書き込みなし）
```

## Test Strategy

- [ ] `pnpm secretlint` が成功する（新規 Markdown に機密情報が含まれていない）
- [ ] `pnpm check` が成功する
- [ ] `claude plugin validate .` が成功する
- [ ] `./scripts/install-local.sh --dry-run` の差分に `skills/enso-issue-report/` と `skills/enso-issue-fix/` が現れる
- [ ] 新規スキルが `skills/` 直下1階層に置かれている（ネストしていない）
- [ ] エッジケース: `.claude-plugin/plugin.json` を変更していない（ディレクトリ単位の指定のためスキル追加では不要）

## Implementation Notes

- このリポジトリに単体テストは存在しない。`pnpm secretlint && pnpm check` が実質のテスト
- `install-local.sh` は `rsync --delete` なので `--dry-run` で差分だけ確認する。**このタスクで実際の投入は行わない**（投入は全プロジェクトに即座に効くため、PR マージ後に `sync-after-merge.sh` で行う）
- Issue #10 のとおり、worktree 内で `pnpm secretlint` / `pnpm check` が `prepare`（simple-git-hooks）の失敗で落ちる既知の問題がある。落ちた場合はメインのチェックアウト側で実行するか回避を試み、結果をレポートに残す

## Files

- 変更: なし（検証のみ）
- 出力: `docs/dev/plans/issue-skills/reports/` に検証結果
