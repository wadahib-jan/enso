---
id: "003"
title: "dev-navigate に2スキルを統合する"
status: done
priority: 3
dependencies: ["001", "002"]
estimated_complexity: low
---

# Task: dev-navigate に2スキルを統合する

## Goal

`dev-navigate` の対象スキル一覧と分岐に `enso-issue-report` / `enso-issue-fix` を追加し、「enso 自体の問題」「Issue から着手したい」という入り口からナビゲートできるようにする。

## Interfaces

`skills/dev-navigate/SKILL.md` への追加内容: 🔵

- 「対象スキル一覧」表に2行追加

```
| `enso-issue-report` | enso 自体の問題を Issue として起票する |
| `enso-issue-fix` | Issue を1件取り込み、分析→計画→実装で修正 PR まで進める |
```

- Step 1 の Q1 に選択肢を1つ追加する

```
| enso 自体の問題を報告・修正したい | enso のスキルや hooks の不具合・改善要望を Issue にする、または既存 Issue を修正する |
```

- 追加選択肢に対する Q2 相当の分岐（新規に報告する / 既存の Issue に着手する）と、それぞれの提案メッセージ

## Test Strategy

- [ ] 「対象スキル一覧」表に `enso-issue-report` と `enso-issue-fix` の行が追加されている
- [ ] Q1 の選択肢に「enso 自体の問題を報告・修正したい」が追加されている
- [ ] 追加選択肢の分岐で `enso-issue-report`（新規報告）と `enso-issue-fix <番号>`（既存 Issue）に振り分けられる
- [ ] 提案メッセージが既存の分岐と同じ「## Nav 結果 → 推奨スキル → 説明 → 推奨フロー」形式になっている
- [ ] 既存の選択肢と分岐が壊れていない（Q1 の他の選択肢が全て残っている）

## Implementation Notes

- 参照すべき既存コード: `skills/dev-navigate/SKILL.md` の Step 1（Q1）と Step 2 の分岐群
- 既存の提案メッセージの体裁（コードブロック内に `## Nav 結果` を書く形式）をそのまま踏襲する
- Q1 の選択肢は現在6つ。7つ目として追加する

## Files

- 変更: `skills/dev-navigate/SKILL.md`
