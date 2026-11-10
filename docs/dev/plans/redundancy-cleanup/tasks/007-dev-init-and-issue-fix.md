---
id: "007"
title: "dev-init の質問ツリーを切り出し、enso-issue-fix の不要な節を削る"
status: done
priority: 3
dependencies: ["001", "002", "003"]
estimated_complexity: medium
---

# Task: dev-init の質問ツリーを切り出し、enso-issue-fix の不要な節を削る

## Goal

dev-init/SKILL.md（43KB）の Q1〜Q11 本文を references へ移し、ファイル内の重複（BFF の同一言語判定・ブローカー表・ルール節）を1回にする。enso-issue-fix/SKILL.md から、削除済みスキルの経緯・実行時に不要な将来構想・dev-loop 内部の言い直しを削る。

## Interfaces

```text
skills/dev-init/references/hearing-questions.md（新規）   🔵 Phase 3 が既に tech-recommendations.md を Read する構造と同じ
  ## Phase 2（Q1〜Q5）
  ## Phase 3（Q6〜Q11）
skills/dev-init/SKILL.md 前提知識
  ### 同一言語判定   ← Q9 と 6b-2 が参照する唯一の定義               🔵
```

## Test Strategy

- [ ] 移動前後で Q 見出し（Q1〜Q11, Q4b/Q4c, Q5a-c, Q6a-c, Q9-*）の件数が一致する（`grep -c` を main と比較）
- [ ] dev-init/SKILL.md の Phase 2 / Phase 3 に `references/hearing-questions.md` を Read する指示があり、「追加リソース」にも追記されている
- [ ] 質問フロー一覧（Q5/Q6 の分岐表）が SKILL.md に残っている
- [ ] 「同一言語判定」の定義が1箇所、参照が2箇所（Q9、6b-2）
- [ ] 6b-1 / 6b-2 の制約（80行・30行・指示的な言語・信号機を使わない等）が 6b に残り、ルール節からの重複だけが消えている
- [ ] enso-issue-fix から「なぜ原因分析スキルを経由しないのか」「Step 7」「将来の拡張」の見出しが消え、「dev-loop を呼ばない」「Issue をクローズしない」がルール節に残っている
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- dev-init（行番号は現状基準。001〜003 適用後は見出しで位置を探す）:
  - :61-330（Q1〜Q11 本文、:213-215 の順序説明、:328 / :330 の Note）を hearing-questions.md へ移動。SKILL.md には :57-59（Phase 2 見出しと1問ずつ聞くルール）+ 参照、:209-211（Phase 3 見出しと tech-recommendations 参照）+ 参照、:332-348 の質問フロー一覧を残す
  - :350 / :352（Q5/Q6 の分岐の言い直し）を削除
  - BFF 判定: :278（Q3 別条件）と :541（3層条件）を前提知識「### 同一言語判定」にまとめ、両方を参照に。:330 は基準が違う（Q3=Web の自動 TypeScript を考慮しない）ので触らない
  - ブローカー表: reference 側のイベント駆動 Q4（元 :158-165）を「選択肢は Q4c と同じ（Kafka / RabbitMQ / SQS+SNS / Redis Pub/Sub）」に
  - ルール節 :583-592（6b-1 / 6b-2 の繰り返し）を削除
- enso-issue-fix:
  - :110-122「なぜ原因分析スキルを経由しないのか」を削除（必要な指示はルール :317-318）
  - :274-287 Step 7 を削除（dev-loop 内部の言い直し。「dev-loop を呼ばない」は :272 とルール :321、Issue をクローズしない件はルール :323 にある）。これにより :282 のセキュリティチェック条件の食い違いも解消する
  - :288-307「将来の拡張」を削除（設計記録は docs/dev/plans/issue-skills/plan.md に残っている。実行時に必要な「対話が要る Issue は割り当てない」は :106）
  - :317-318 を1行に:「コードベースを調査しない（調査は dev-plan Phase 2 の責務。Step 3 は実在確認だけで Grep/Glob で探さない。深い原因分析が要る場合はユーザーが先に調べて見立てを添える）」
  - Step 番号の参照（Step 7 への言及）が他に残っていないか grep で確認

## Files

- 新規: skills/dev-init/references/hearing-questions.md
- 変更: skills/dev-init/SKILL.md, skills/enso-issue-fix/SKILL.md
