---
id: "008"
title: "webtest 系スキルのファイル内の重複をまとめる"
status: done
priority: 3
dependencies: ["002", "003"]
estimated_complexity: low
---

# Task: webtest 系スキルのファイル内の重複をまとめる

## Goal

dev-webtest のエラー記録手順（5回の繰り返し）、dev-screen-spec / dev-webtest-plan のサブエージェント制約・コンテキスト管理の同文重複、dev-screen-spec のモード別信号機表を、それぞれファイル内で1回にまとめる。ファイル間の共通化は行わない。

## Interfaces

```text
skills/dev-webtest/SKILL.md ルール・制約
  ### エラー記録   ← パス・スクリーンショット保存先・NNN 採番・error.md テンプレート   🔵 5箇所が参照
skills/dev-screen-spec/SKILL.md, skills/dev-webtest-plan/SKILL.md
  ### サブエージェントとコンテキスト管理   ← 既存2節の統合                          🔵
```

## Test Strategy

- [ ] dev-webtest で「エラー記録」節が1つ、`「エラー記録」に従う` の参照が5箇所、各 Step の判定条件（⚠️/❌ 等）は残っている
- [ ] error.md テンプレートと NNN 採番ルールが「エラー記録」節にある
- [ ] dev-webtest-plan の統合節に `TaskCreate/TaskUpdate` と中間ファイルパス `tmp/webtest/plan/<plan-name>/`・`tmp/webtest/update/` が残っている
- [ ] dev-screen-spec の信号機が1つの表（列: 信号 / ソース解析（初回・差分） / from-plan）になり、どちらの基準も欠けていない
- [ ] `grep -rn 'SKILL.md の Step 1' skills/dev-webtest` の参照先（Step 1 見出し）が残っている
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- dev-webtest（行番号は現状基準。002 / 003 適用後は見出しで探す）:
  - ルール・制約の :493-496 と error.md テンプレート（:508-538）を「### エラー記録」節にまとめる
  - :316-319 → 「問題検出時は `screenshot` を取得し「エラー記録」に従う」、:364-366 → 「⚠️ または ❌ 判定時は「エラー記録」に従う」、:381-383 / :410-412 / :430-432 → 「問題検出時は「エラー記録」に従う」
  - Step 1 冒頭の ASCII フロー（:55-72）を削除（1-0〜1-2 の本文と表で表現済み）
- dev-screen-spec:
  - :53-66 の2節を「### サブエージェントとコンテキスト管理」に統合（:58 と :64 は同文）
  - ルール・制約 :532-536 を削除（:530-531, :537 は残す）
  - :81-94 の信号機表2つを1表に
- dev-webtest-plan:
  - :61-74 の2節を同様に統合（:66 と :72 は同文）
  - ルール・制約 :508-511、:516、:524、:525-526 を削除（統合節・:471 と同文）
- 見送り（plan.md に記録）:
  - dev-webtest Step 1 を docker-setup.md へ移す案: 1-0 / 1-1 / 1-5 / 1-6 は毎回実行され、必要時だけ読む手順書と混ざる。mcp-workflow.md も Step 1 を参照
  - error.md テンプレートの references 化: 30 行でサブエージェントへの受け渡しが1段増える
  - dev-webtest-plan のモード別の表の統合: 差分更新モードは「完全に独立」と宣言されており中身もほぼ重ならない
  - 信号機定義の全スキル共通化: 基準がスキルごとに異なる
  - dev-screen-spec / dev-webtest-plan 間の共通 reference 化: 10 行程度で、テンプレート側が既に制約を持つ

## Files

- 変更: skills/dev-webtest/SKILL.md, skills/dev-screen-spec/SKILL.md, skills/dev-webtest-plan/SKILL.md
