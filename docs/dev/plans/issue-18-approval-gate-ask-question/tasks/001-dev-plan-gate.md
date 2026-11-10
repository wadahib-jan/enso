---
id: "001"
title: "dev-plan Phase 5e の承認ゲートを命令形＋ゲート仕様表にする"
status: pending
priority: 1
dependencies: []
estimated_complexity: low
---

# Task: dev-plan Phase 5e の承認ゲートを命令形＋ゲート仕様表にする

## Goal

`skills/dev-plan/SKILL.md` の「5e. 承認の確認」を、平叙形（「AskUserQuestion で確認する」）から
禁止形を併記した命令形に改め、ゲート仕様（質問文・選択肢ラベル・動作）を表として定義する。
地の文で確認して終了する逸脱を、定義を読んだ時点で防ぐ。

## Interfaces

このリポジトリはスキル定義（Markdown）が成果物のため、型定義ではなく**記述の契約**を示す。

```markdown
#### 5e. 承認の確認

**このゲートは AskUserQuestion で出さなければならない。**            <!-- 🔵 dev-cleanup Step 3 の既存表現に準拠 -->
**地の文で「実装を開始しますか？」と書いて応答を終えてはならない。** <!-- 🔵 Issue が名指しした逸脱そのもの -->

| 項目 | 内容 |
|---|---|
| question | 実装を開始しますか？                     <!-- 🟡 文言は新規。既存の選択肢表現から起こす -->
| header   | 実装承認                                  <!-- 🟡 12文字以内の制約に合わせた新規の値 -->
| 選択肢1  | はい — 実装を開始する → `dev-loop` を起動する      <!-- 🔵 既存の表をそのまま移送 -->
| 選択肢2  | いいえ — あとで確認する → PR の URL を提示して終了 <!-- 🔵 既存の表をそのまま移送 -->
```

## Test Strategy

- [ ] `skills/dev-plan/SKILL.md` の 5e に「AskUserQuestion で出さなければならない」旨の**命令形**が含まれる
- [ ] 同じ箇所に「地の文で確認して終了してはならない」旨の**禁止形**が含まれる
- [ ] ゲート仕様表に question / header / 選択肢2件 とその動作がすべて記載されている
- [ ] 既存の分岐（はい→`dev-loop` 起動 / いいえ→URL 提示して終了）が変更されていない
- [ ] 「いいえ」でも `loop-state.yaml` が `awaiting-approval` のままである旨の既存記述が残っている
- [ ] `pr_number` が `null` の場合も同じ確認を出す旨の既存記述が残っている
- [ ] 「`dev-loop` をサブエージェント経由で起動しない」の既存注意書きが残っている
- [ ] 「ルール・制約」節に承認ゲートを AskUserQuestion で出す旨の1行が追加されている
- [ ] エッジケース: 変更後も `skills/dev-plan/SKILL.md` が 500 行以内である
- [ ] `pnpm secretlint && pnpm check` が通る（`.md` は Biome 対象外だが品質ゲートとして実行する）

## Implementation Notes

- 参照すべき既存コード: `skills/dev-cleanup/SKILL.md` の「### Step 3: 確認（唯一のゲート）」
  — 「**このステップを飛ばしてはならない。**」という禁止形が、本リポジトリで唯一すでに存在する手本
- 実装のヒント: 既存の選択肢の表は残し、その上に命令形＋禁止形の2文、下にゲート仕様（question / header）を足す
- 注意事項: 呼び出し元から「停止時の提示に含めること」を指示された内容を添える既存段落
  （`enso-issue-fix` からの「Issue のどの記述をどう解釈したか」）を消さない。
  この提示は AskUserQuestion の**前**に出す位置関係を保つ
- 変更は記述のみ。ワークフローの段階数・分岐先を増減させない

## Files

- 変更: `skills/dev-plan/SKILL.md`
- 新規: なし
- テスト: なし（テストランナー未導入。品質ゲートは `pnpm secretlint && pnpm check`）
