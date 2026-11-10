---
id: "002"
title: "dev-cleanup と dev-plan の関連記述をゲート1本化に整合させる"
status: done
priority: 2
dependencies: ["001"]
estimated_complexity: low
---

# Task: dev-cleanup と dev-plan の関連記述をゲート1本化に整合させる

## Goal

`dev-cleanup` のフロー図と入口の説明を「`dev-loop` から質問なしで引き継がれる」形に更新し、`dev-plan` の「承認ゲートの1つ目 / 2つ目」の記述を新しい数え方（実装承認 → マージ確認の2箇所）に合わせる。

## Interfaces

記述の契約:

```
skills/dev-cleanup/SKILL.md
  フロー図        : dev-loop → 【yes/no】→ dev-cleanup  ではなく
                    dev-loop →（引き継ぎ）→ dev-cleanup 【yes/no】       # 🔵
  Step 3          : 「唯一のゲート」の位置づけを維持（AskUserQuestion 必須） # 🔵 変更しない
  関連スキル表    : dev-loop の欄から「後始末の確認を出して起動する」を削除  # 🔵

skills/dev-plan/SKILL.md
  Phase 5e 末尾   : 「2つ目は dev-loop の完了後」→「2つ目は dev-cleanup のマージ確認」 # 🔵
```

## Test Strategy

- [ ] `skills/dev-cleanup/SKILL.md` のフロー図で、`dev-loop` と `dev-cleanup` の間に `【yes/no】` が無く、ゲートが `dev-cleanup` 側にあると読める
- [ ] `skills/dev-cleanup/SKILL.md` の「関連スキル」表の `dev-loop` 欄が「後始末の確認を出して起動する」ではなく「確認なしで引き継ぐ」旨になっている
- [ ] `skills/dev-cleanup/SKILL.md` の Step 3 が AskUserQuestion 必須の唯一のゲートとして残っている（`grep -c "唯一のゲート"` が 1 以上）
- [ ] `skills/dev-plan/SKILL.md` Phase 5e の「承認ゲートの1つ目」の記述が、2つ目として `dev-cleanup` のマージ確認を指しており、`dev-loop` の完了後を指していない
- [ ] エッジケース: `skills/dev-navigate/SKILL.md` の `dev-cleanup` 説明（「確認は yes/no ひとつだけ」）が新しい挙動と矛盾しないことを確認し、矛盾する場合のみ修正する
- [ ] エッジケース: `skills/dev-plan/SKILL.md` の「開発サイクル全体で人間が判断するのはこの2回だけ」という記述が、変更後も正しい（2回のまま）

## Implementation Notes

- 参照すべき既存コード: `skills/dev-cleanup/SKILL.md`（フロー図 14-22 行付近、Step 3 は 103-125 行付近、関連スキル表は末尾）、`skills/dev-plan/SKILL.md` 341 行付近
- 実装のヒント: 001 で確定した dev-loop 側の文言と用語を揃える（「引き継ぐ」で統一する）
- 注意事項: `dev-cleanup` は単独起動もできるため、「`dev-loop` から起動される場合のみ」の条件分岐を Step 3 に持ち込まない

## Files

- 変更: `skills/dev-cleanup/SKILL.md`, `skills/dev-plan/SKILL.md`
- 変更（条件付き）: `skills/dev-navigate/SKILL.md`
- テスト: なし（Test Strategy のチェックリストで検証）
