---
id: "004"
title: "README / MANUAL / CLAUDE.md / context.md をスキルのみの構成に更新する"
status: done
priority: 2
dependencies: ["002"]
estimated_complexity: medium
---

# Task: README / MANUAL / CLAUDE.md / context.md をスキルのみの構成に更新する

## Goal

利用者向け（README.md / MANUAL.md）と開発者向け（CLAUDE.md / docs/dev/context.md）のドキュメントから、削除したコマンドと `commands/` ディレクトリ前提の記述を取り除き、enso がスキルのみで構成されることを正しく説明する。

## Interfaces

| ファイル:行 | 変更内容 |
|---|---|
| `README.md:37` | 同期対象の説明から `commands/` を除去 |
| `README.md:105` | performance-analysis の注記「テスト速度は `timeout-fix`」→ `dev-debug` |
| `README.md:129-137` | ユーティリティコマンドの表（orchestrate / refine-plan / refine-execute / auto-debug / build-fix / env-fix / flaky-fix / timeout-fix）を削除。表全体が空になる場合は見出しごと削除する |
| `MANUAL.md:563` | 「小規模修正なら `refine-plan` で十分」→ `dev-plan`(Lightweight) |
| `MANUAL.md:565` | 「テストが遅いなら `timeout-fix`」→ `dev-debug` |
| `MANUAL.md:760` | 「`timeout-fix` / `flaky-fix` / `test-optimization-patterns` が担当」→ `dev-debug` とその references |
| `MANUAL.md:1021-1114` | 「## ユーティリティコマンド」章（help / orchestrate / refine-* / auto-debug 系 / その他）を丸ごと削除 |
| `MANUAL.md:1245,1253` | ディレクトリ構造の `docs/adr/`（adr-rubber-duck 出力）と `docs/dev/refine/`（refine-* 出力）を除去 |
| `CLAUDE.md:13` | プロジェクト構造から `commands/` の行を削除 |
| `CLAUDE.md:31` | 「`commands/` はサブディレクトリで名前空間を作れる」の制約説明を、skills のネスト不可のみに整理 |
| `docs/dev/context.md:37,63,70,100,112` | 構造図の `commands/`、名前空間の説明、コマンドのファイル形式、マニフェスト説明、「コマンド一覧 = `commands/help.md`」の行を除去・修正 |

## Test Strategy

- [ ] `grep -rn "auto-debug\|build-fix\|env-fix\|flaky-fix\|timeout-fix\|test-optimization-patterns\|refine-plan\|refine-execute\|orchestrate\|task-exec\|adr-rubber-duck\|enso:help" README.md MANUAL.md CLAUDE.md docs/dev/context.md` が 0 件（`skills/dev-debug/references/test-optimization-patterns.md` へのパス参照は許容）
- [ ] `grep -n "commands/" README.md MANUAL.md CLAUDE.md docs/dev/context.md` が 0 件
- [ ] `MANUAL.md` の目次・章構成に「ユーティリティコマンド」が存在しない
- [ ] `MANUAL.md` の残る章から、削除した章への内部リンク・相互参照が無い
- [ ] `CLAUDE.md` の「読み込みの仕組み」が、`.claude-plugin/plugin.json` が `skills` のみを指す現状と一致している
- [ ] `docs/dev/context.md` の「Key Entry Points」表に実在しないファイル（`commands/help.md`）が無く、`skills/rev-docs/SKILL.md` などの現行構成と矛盾しない
- [ ] `README.md` のスキル一覧に、`rev-docs` を含む現行スキルが漏れなく載っている
- [ ] `pnpm secretlint` が通過する

## Implementation Notes

- 参照すべき既存コード: `docs/dev/plans/rev-docs/` の同種タスク — 前回のドキュメント更新の書きぶり
- 実装のヒント:
  - `MANUAL.md` は 1021-1114 の一括削除が主。行番号は前の編集でずれるので、見出し（`## ユーティリティコマンド` から次の `## 汎用スキル` の直前まで）を基準に消す
  - `docs/dev/context.md` はスキルが読む共通基盤なので、**削除だけでなく「スキルのみのプラグインである」と読める記述に直す**。`dev-context` を再実行して丸ごと再生成する手もあるが、手作業の方が差分が小さい
  - `CLAUDE.md:31` の制約は「skills/ は直下1階層のみ」という現在も有効な情報を残すこと
- 注意事項:
  - `docs/dev/plans/` 配下の過去計画は履歴なので変更しない
  - `claude_docker/` と `book/` に該当参照があれば同様に扱う（grep で確認する）

## Files

- 変更: `README.md`, `MANUAL.md`, `CLAUDE.md`, `docs/dev/context.md`
- テスト: なし（受け入れ条件の grep と `pnpm secretlint` で検証する）
