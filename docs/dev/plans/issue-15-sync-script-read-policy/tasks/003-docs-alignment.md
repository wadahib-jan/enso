---
id: "003"
title: "二重管理を前提とした記述を更新する"
status: done
priority: 3
dependencies: ["002"]
estimated_complexity: low
---

# Task: 二重管理を前提とした記述を更新する

## Goal

「`enso.json` を変えたらスクリプト側も手で合わせる」という前提で書かれた記述を、設定が単一の出所になった実態に合わせて更新する。

## Interfaces

なし（ドキュメントのみ）。

## Test Strategy

- [ ] `scripts/sync-after-merge.sh` のヘッダコメントに、保護ブランチ／ベースブランチを `.claude/enso.json` から読み、無ければ既定値にフォールバックする旨が書かれている
- [ ] `PROTECTED_BRANCHES` の定義に残っていた「`.claude/enso.json` の `enforce.protectedBranches` と揃える」（＝手動同期を促す）記述が、「フォールバックの既定値」を説明する記述に置き換わっている
- [ ] `CLAUDE.md` の「PR をマージしたあと」節に、スクリプトが `enso.json` の `baseBranch` / `protectedBranches` を参照することが1〜2行で記載されている
- [ ] `skills/enso-policy/SKILL.md` の設定表で、`protectedBranches` / `baseBranch` の説明に `sync-after-merge.sh` も参照する旨が追記されている
- [ ] リポジトリ全体を `grep -rn "手で合わせ\|揃える" --include="*.md" --include="*.sh"` で確認し、手動同期を指示する記述が残っていない（`docs/dev/plans/` 配下の過去の計画・レポートは履歴なので対象外）
- [ ] `pnpm secretlint && pnpm check` が通る（`.md` は Biome 対象外だが、ゲートは必ず通す）

## Implementation Notes

- 参照すべき既存コード: `scripts/sync-after-merge.sh`（1-14 行のヘッダ、30-33 行のコメント）、`CLAUDE.md` の「PR をマージしたあと」節（100-112 行付近）、`skills/enso-policy/SKILL.md` の設定表（45 行付近）、`MANUAL.md` の設定表（88 行付近）
- **Issue に書かれた範囲に留める。** 設定項目の新設や、他スクリプトの説明の書き換えは行わない
- `MANUAL.md` は設定項目そのものの説明表なので、hooks 以外の参照者ができたことが誤解を生む場合のみ最小限に触れる
- `skills/enso-policy/SKILL.md` は 500 行以内の規約を維持する（追記は数行）
- Issue #15 の「現状の回避策」（手で合わせる）は本 PR で不要になる。PR 本文でその旨に触れる

## Files

- 変更: `scripts/sync-after-merge.sh`（コメントのみ）、`CLAUDE.md`、`skills/enso-policy/SKILL.md`、必要に応じて `MANUAL.md`
- テスト: なし
