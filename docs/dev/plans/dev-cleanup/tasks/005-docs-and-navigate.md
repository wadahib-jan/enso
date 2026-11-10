---
id: "005"
title: "dev-navigate / README / MANUAL に dev-cleanup を追加する"
status: done
priority: 3
dependencies: ["002", "003"]
estimated_complexity: low
---

# Task: dev-navigate / README / MANUAL に dev-cleanup を追加する

## Goal

利用者向けドキュメントとナビゲーションから `dev-cleanup` を辿れるようにする。

## Interfaces

`skills/dev-navigate/SKILL.md`: 🔵

- 「対象スキル一覧」表に1行追加

```
| `dev-cleanup` | PR をマージし、main の更新と worktree・ブランチの削除まで後始末する |
```

- Q1 の「エラーやバグを修正したい」等と並ぶ選択肢として、後始末の入口を追加する

```
| PR をマージして片付けたい | dev-loop が終わった PR をマージし、worktree やブランチを掃除したい |
```

`README.md` の Dev Skills 表: 🔵

```
| `dev-cleanup` | PR のマージと後始末（main 更新・worktree/ブランチ削除） |
```

`MANUAL.md`: 🔵

- Dev Skills のワークフロー図に `dev-cleanup` を追加
- 「### N. dev-cleanup」セクションを新設（`dev-loop` の直後）。用途・実行方法・yes/no ゲート・後始末の2経路・`mergeMethod`・注意事項

## Test Strategy

- [ ] `dev-navigate` の「対象スキル一覧」に `dev-cleanup` の行がある
- [ ] `dev-navigate` の Q1 に後始末の選択肢が追加され、`dev-cleanup` を提案する分岐がある
- [ ] 提案メッセージが既存の「## Nav 結果 → 推奨スキル → 説明 → 推奨フロー」形式になっている
- [ ] 既存の Q1 選択肢と Q2 / Q2b / Q2c の分岐がすべて残っている
- [ ] `README.md` の Dev Skills 表に `dev-cleanup` の行がある
- [ ] `MANUAL.md` のワークフロー図に `dev-cleanup` が入り、`dev-loop` の次に来ることが読み取れる
- [ ] `MANUAL.md` に `dev-cleanup` の詳細セクションがあり、既存セクションと同じ体裁（`### N. skill-name`・実行例のコードブロック・表）になっている
- [ ] `MANUAL.md` の注意事項に「**再起動は自動化できない**」ことが書かれている
- [ ] 既存の MANUAL のセクション番号を壊していない（`dev-loop` の後に挿入するため以降の項番がずれる場合は全て振り直す）

## Implementation Notes

- 参照すべき既存コード:
  - `skills/dev-navigate/SKILL.md` の Step 1（Q1）と Step 2 の分岐群
  - `README.md` の「### Dev Skills（統合開発ワークフロー）」表
  - `MANUAL.md` の「## Dev Skills」ワークフロー図と「### 5. dev-loop」
- **MANUAL の項番の振り直しに注意。** `dev-loop`（現在 5番）の直後に挿入すると、`dev-impl` 以降がすべて1つずれる。ずれる全セクションの番号を更新すること
- Biome は Markdown を対象にしないため、整形は手動で既存の体裁に合わせる

## Files

- 変更: `skills/dev-navigate/SKILL.md`
- 変更: `README.md`
- 変更: `MANUAL.md`
