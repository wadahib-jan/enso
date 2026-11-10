---
id: "001"
title: "flaky/timeout/最適化のノウハウを dev-debug の references へ退避する"
status: done
priority: 1
dependencies: []
estimated_complexity: medium
---

# Task: flaky/timeout/最適化のノウハウを dev-debug の references へ退避する

## Goal

削除予定の `flaky-fix` / `timeout-fix` / `test-optimization-patterns` が持つ、dev-debug に存在しないノウハウ（flaky 原因6分類と安定化手順、タイムアウト原因6分類と分離手順、テスト高速化パターン集）を `skills/dev-debug/references/` に移し、SKILL.md から参照できるようにする。

## Interfaces

新規の references ファイル構成（🔵 `skills/rev-docs/references/` と `skills/task-breakdown/references/` の既存慣行に準拠）:

```
skills/dev-debug/references/
├── flaky-tests.md                  # 🔵 flaky-fix.md:28-115 が出典
├── test-timeouts.md                # 🔵 timeout-fix.md:28-133 が出典
└── test-optimization-patterns.md   # 🔵 test-optimization-patterns.md:5-743 が出典
```

SKILL.md のカテゴリ表に追加する2行（🟡 既存表の書式に合わせる）:

```markdown
| **不安定テスト（flaky）** | 実行ごとに成否が変わる、たまに落ちる | 原因6分類での切り分け（`references/flaky-tests.md`） | 待機・状態初期化・モック導入 |
| **テストタイムアウト** | 実行が制限時間を超える | 原因6分類での切り分け（`references/test-timeouts.md`） | 処理・データ量の削減、最終手段としてテスト分離 |
```

## Test Strategy

- [ ] `skills/dev-debug/references/flaky-tests.md` が存在し、flaky 原因6分類（タイミング依存 / 共有状態 / 外部サービス依存 / ランダム性 / 順序依存 / リソース制限）すべてと、各分類に対応する修正方針が記載されている
- [ ] `flaky-tests.md` に安定性確認の基準（最低3回連続成功）と NEVER ルール（テストの削除・スキップ・assertion 弱化による「安定化」の禁止）が残っている
- [ ] `skills/dev-debug/references/test-timeouts.md` が存在し、タイムアウト原因6分類（非効率処理 / 外部APIハング / デッドロック・無限ループ / 大量テストデータ / セットアップ過重 / リソースリーク）と各修正方針が記載されている
- [ ] `test-timeouts.md` にテスト分離の手順（Jest の専用設定 / Playwright の `@slow` タグ / pytest の `@pytest.mark.slow`）と「分離は可・削除は不可」「個別実行方法を必ず報告」のルールが残っている
- [ ] `skills/dev-debug/references/test-optimization-patterns.md` が存在し、元コマンドのパターン一覧表（8パターンと効果・難易度・リスク）が欠落していない
- [ ] 3ファイルとも frontmatter を持たない（references は SKILL.md ではないため `description` 等は不要）
- [ ] `skills/dev-debug/SKILL.md` のカテゴリ表に flaky とタイムアウトの2行が追加されている
- [ ] `skills/dev-debug/SKILL.md` の「分類判定」に flaky・タイムアウトのパターン語（`flaky`, `timeout`, `Exceeded timeout`, `間欠的` 等）が追加されている
- [ ] `skills/dev-debug/SKILL.md` の `## 追加リソース` に3つの references へのリンクがある（節が無ければ新設する）
- [ ] `skills/dev-debug/SKILL.md` が500行以内（スキル定義の規約）

## Implementation Notes

- 参照すべき既存コード:
  - `commands/flaky-fix.md` — step0（プロジェクトコンテキスト確認）は dev-debug が `docs/dev/context.md` で担うため**退避しない**。step1〜4 と `# rule` を移す
  - `commands/timeout-fix.md` — 同様に step0 を除き、step1〜5 と `# rule` を移す
  - `commands/test-optimization-patterns.md` — frontmatter（1-4行目）だけ落として本文をそのまま移す
  - `skills/rev-docs/references/` — references の文体・見出しレベルの参考
- 実装のヒント:
  - `{{test_command}}` `{{test_file}}` などのコマンド時代のテンプレート変数は、dev-debug の文脈（context.md からテストコマンドを取得済み）に合わせた自然な日本語に置き換える
  - 「結果レポート」テンプレートは dev-debug の Step 4 報告フォーマットと重複するため、reference 側では原因分類と修正内容の記録項目のみに絞ってよい
  - `/enso:build-fix` のような削除済みコマンドへの委譲指示が本文に紛れ込まないこと
- 注意事項: 本タスクでは `commands/` 側のファイルは**まだ削除しない**（削除は 002）

## Files

- 新規: `skills/dev-debug/references/flaky-tests.md`, `skills/dev-debug/references/test-timeouts.md`, `skills/dev-debug/references/test-optimization-patterns.md`
- 変更: `skills/dev-debug/SKILL.md`
- テスト: なし（本リポジトリの品質ゲートは `pnpm secretlint && pnpm check`。Markdown は Biome 対象外のため受け入れ条件の目視確認で代替する）
