---
id: "003"
title: "MANUAL.md の承認ゲート一覧とフロー図を2ゲートに更新"
status: done
priority: 2
dependencies: ["001"]
estimated_complexity: low
---

# Task: MANUAL.md の承認ゲート一覧とフロー図を2ゲートに更新

## Goal

MANUAL.md の「承認ゲート一覧」を3行から2行に減らし、フロー図・`dev-loop` 節・`dev-cleanup` 節の記述を「マージ確認は `dev-cleanup` の1回だけ」に揃える。README.md に矛盾が無いことも確認する。

## Interfaces

ドキュメントの契約:

```
MANUAL.md 「承認ゲート一覧」               # 🔵
| # | ゲート     | スキル / 箇所        | 質問                        | 質問しない条件 |
| 1 | 実装承認   | dev-plan Phase 5e    | 実装を開始しますか？        | なし           |
| 2 | マージ確認 | dev-cleanup Step 3   | マージして後始末しますか？  | なし           |

前文: 「人間が判断するのは次の2箇所だけ」
補足: dev-loop の完了後は質問せず dev-cleanup に引き継ぎ、
      status: failed / pr_number: null では引き継がず終了する          # 🔵
```

## Test Strategy

- [ ] 「承認ゲート一覧」の表がゲート2行（実装承認 / マージ確認）になっており、`dev-loop` Step 10 の行が無い
- [ ] 前文の「次の3箇所だけです」が「次の2箇所だけです」に更新されている
- [ ] 「ゲート 2 と 3 は連続します」の段落が削除され、代わりに `dev-loop` が質問せず引き継ぐこと・引き継がないスキップ条件（`status: failed` / `pr_number: null`）が書かれている
- [ ] フロー図（120-140 行付近）の `dev-loop` → `dev-cleanup` 間から `【yes/no】` が消え、`dev-cleanup` 側に `【yes/no】` が付いている
- [ ] `### 5. dev-loop` 節の「**完了後**」の記述が、yes/no 確認ではなく `dev-cleanup` への引き継ぎとスキップ条件を説明している
- [ ] `### 6. dev-cleanup` 節の「`dev-loop` の完了後に出る yes/no で「はい」を選ぶと自動で起動します」が、質問なしで自動起動する説明に更新されている
- [ ] エッジケース: `grep -n "マージして後始末しますか" MANUAL.md` の結果が承認ゲート一覧と `dev-cleanup` 節（Step 3 の説明）のみを指し、`dev-loop` 節を含まない
- [ ] エッジケース: README.md にゲート回数の記述が無いこと、または新しい数え方と矛盾しないことを確認する
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: `MANUAL.md`（フロー図 120-142 行、承認ゲート一覧 143-155 行、dev-loop 節 248-280 行、dev-cleanup 節 282-310 行）、`README.md` 60-85 行
- 実装のヒント: 表の列構成（# / ゲート / スキル / 質問 / 「はい」 / 「いいえ」 / 質問しない条件）は維持し、行を削って番号を振り直すだけにする
- 注意事項: Biome は Markdown を対象外にするため整形は手動。ただし `pnpm check` は JSON/JS の回帰確認として実行する

## Files

- 変更: `MANUAL.md`
- 変更（条件付き）: `README.md`
- テスト: なし（Test Strategy のチェックリストと品質ゲートで検証）
