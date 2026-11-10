---
id: "001"
title: "dev-loop Step 10 のゲートを廃止して dev-cleanup への引き継ぎに変更"
status: done
priority: 1
dependencies: []
estimated_complexity: medium
---

# Task: dev-loop Step 10 のゲートを廃止して dev-cleanup への引き継ぎに変更

## Goal

`skills/dev-loop/SKILL.md` の Step 10 から AskUserQuestion による「マージして後始末しますか？」を取り除き、スキップ条件に該当しない限り無条件で `dev-cleanup` を起動する引き継ぎステップにする。マージの是非は `dev-cleanup` Step 3 で1回だけ問われる状態にする。

## Interfaces

ステップの契約（Markdown の記述として定義する）:

```
Step 10: 後始末への引き継ぎ

入力: loop-state.yaml の status / pr_number
分岐:
  status == "failed"      → dev-cleanup を起動しない。PR の URL を提示して終了   # 🔵 既存のスキップ条件をそのまま維持
  pr_number == null       → dev-cleanup を起動しない。PR の URL を提示して終了   # 🔵 既存のスキップ条件をそのまま維持
  それ以外                 → 質問せず dev-cleanup を起動する                      # 🔵 今回の変更（ユーザー選択済みの方針）
制約:
  dev-cleanup をサブエージェント経由で起動しない                                  # 🔵 既存制約を維持
```

## Test Strategy

- [ ] Step 10 に AskUserQuestion / 「マージして後始末しますか？」の選択肢表が残っていない（`grep -n "マージして後始末しますか" skills/dev-loop/SKILL.md` が 0 件）
- [ ] Step 10 が「`status: failed` なら起動しない」「`pr_number: null` なら起動しない」の2条件を引き続き明記しており、その場合は PR の URL を提示して終了すると書かれている
- [ ] Step 10 が上記2条件に該当しない場合「質問せず `dev-cleanup` を起動する」と明記している
- [ ] 「`dev-cleanup` をサブエージェント経由で起動しない」の制約が Step 10 に残っている
- [ ] 冒頭のフロー図から dev-loop → dev-cleanup 間の `【yes/no】` が消え、`dev-cleanup` 側にゲートがあることが読み取れる
- [ ] 「ルール・制約」節の Step 10 に関する項目が、廃止したゲートではなく引き継ぎ動作を記述している
- [ ] エッジケース: Step 9（完了報告・`shipped` への更新と push）は変更されておらず、「この時点では worktree を削除しない」の記述が残っている
- [ ] エッジケース: 「エスカレーション条件」節に Step 10 のゲート廃止と矛盾する記述が無い

## Implementation Notes

- 参照すべき既存コード: `skills/dev-loop/SKILL.md`（Step 10 は 150-175 行付近、フロー図は 12-20 行付近、ルール・制約は 185-195 行付近）
- 実装のヒント: 既存の「どちらかに該当する場合は質問せず終了する」という2条件の記述構造はそのまま活かし、「どちらにも該当しない場合」の帰結だけを AskUserQuestion から `dev-cleanup` の起動に置き換える
- 注意事項: `issue-18-approval-gate-ask-question` で入れた「地の文で確認して応答を終えてはならない」という規約は、`dev-loop` からは削除するが `dev-cleanup` 側には残す（002 で確認する）

## Files

- 変更: `skills/dev-loop/SKILL.md`
- テスト: なし（Markdown の記述検証は Test Strategy のチェックリストで行う）
