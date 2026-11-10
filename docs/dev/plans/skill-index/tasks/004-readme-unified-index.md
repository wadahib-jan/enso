---
id: "004"
title: "README に全スキルの統合一覧を新設する"
status: done
priority: 1
dependencies: ["003"]
estimated_complexity: medium
---

# Task: README に全スキルの統合一覧を新設する

## Goal

README の「利用可能なコマンド」節を、全 26 スキルを「人が呼ぶスキル」「内部スキル」の2表に集約した統合一覧へ置き換える。ジャンル列で種別を見分けられ、内部スキルは呼び出し元が一目で分かる状態にする。

## Interfaces

表の構造:

```markdown
### 人が呼ぶスキル                                 <!-- 🔵 18件 -->

| スキル | ジャンル | 説明 |
|-------|---------|------|
| [`dev-init`](./MANUAL.md#1-dev-init) | Dev | 新規プロジェクトの技術スタック選定・初期化 |
...

### 内部スキル                                     <!-- 🔵 8件 -->

| スキル | ジャンル | 呼び出し元 | 説明 |
|-------|---------|----------|------|
| [`dev-context`](./MANUAL.md#1-dev-context) | Dev | `dev-plan` / `dev-impl` / `dev-run` / `dev-screen-spec` / `dev-webtest-plan` | プロジェクトのコンテキスト自動分析 |
...
```

ジャンル値（🟡 既存の README / MANUAL のジャンル名を統合したもの）:

`Dev` / `分析` / `Issue` / `ユーティリティ` / `リバースエンジニアリング` / `テスト設計` / `汎用` / `セキュリティ`

掲載内容（003 完了後の確定値）:

| 層 | ジャンル | スキル |
|---|---|---|
| Entry | Dev | `dev-init` `dev-plan` `dev-loop` `dev-cleanup` `dev-screen-spec` `dev-webtest` |
| Entry | 分析 | `feature-rubber-duck` `sequence-diagram-analysis` `state-transition-analysis` `edgecase-analysis` `impact-analysis` `bug-analysis` `performance-analysis` |
| Entry | Issue | `enso-issue-report` `enso-issue-fix` |
| Entry | ユーティリティ | `enso-policy` |
| Entry | リバースエンジニアリング | `rev-docs` |
| Entry | テスト設計 | `uat-test-design` |
| Internal | Dev | `dev-context` `dev-impl` `dev-run` `dev-verify` `dev-debug` `dev-webtest-plan` |
| Internal | セキュリティ | `ipa-security-check` |
| Internal | 汎用 | `task-breakdown` |

MANUAL.md のアンカー（🔵 現行の見出しから算出）:

```
#1-dev-init  #2-dev-plan  #3-dev-loop  #4-dev-cleanup  #5-dev-screen-spec  #6-dev-webtest
#1-dev-context  #2-dev-impl  #3-dev-run  #4-dev-verify  #5-dev-debug  #6-dev-webtest-plan
#1-feature-rubber-duck  #2-sequence-diagram-analysis  #3-state-transition-analysis
#4-edgecase-analysis  #5-impact-analysis  #6-bug-analysis  #7-performance-analysis
#1-enso-issue-report  #2-enso-issue-fix
#rev-docs-の詳細  #task-breakdown  #uat-test-design  #ipa-security-check
#強制モード                                  <!-- 🔴 enso-policy に専用セクションが無いため代替 -->
```

## Test Strategy

- [ ] 「人が呼ぶスキル」表が 18 行、「内部スキル」表が 8 行で、合計が `skills/` 直下のディレクトリ数（26）と一致する
- [ ] 内部スキル表の呼び出し元が 003 で確定した値と一致する
- [ ] 既存のジャンル別の表（「分析スキル」「Issue 連携」「ユーティリティスキル」「リバースエンジニアリングスキル」の表）が統合一覧に置き換わり、重複した一覧が残っていない
- [ ] 全リンクのアンカーが MANUAL.md に実在する見出しを指す（`grep` で見出し文字列と突き合わせる）
- [ ] `uat-test-design` / `task-breakdown` / `ipa-security-check` が README に掲載されている（従来は MANUAL のみ）
- [ ] `ipa-security-guide` が README に現れない
- [ ] エッジケース: 分析スキル表にあった「使うタイミング」列の情報（要件定義前 / 設計時 / 障害対応時）が失われていない。統合一覧の説明列か、分析スキル向けの補足として残す
- [ ] エッジケース: 「Dev Skills」節の冒頭説明・クイックスタート・強制モードの記述を壊していない
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- 置き換え対象は README の「## 利用可能なコマンド」配下（`### Dev Skills` / `### 分析スキル` / `### Issue 連携` / `### ユーティリティスキル` / `### リバースエンジニアリングスキル`）
- 既存の Dev Skills 配下にある「#### 人が呼ぶスキル」「#### 内部スキル」の2表が、そのまま全ジャンルへ拡張される形になる。見出しレベルは `###` に上げる
- 説明文は既存の README / MANUAL の一覧表から流用する。`task-breakdown` / `uat-test-design` / `ipa-security-check` は MANUAL.md の「汎用スキル」「セキュリティチェックスキル」の表（`:1058` 付近 / `:1099` 付近）から持ってくる
- ジャンルごとの前置き（Issue 連携の「投稿先は `yukimnb/enso` に固定」等）は失うと意味が伝わらないため、統合一覧の下に短い補足として残す
- 各ジャンルの並び順は Dev → 分析 → Issue → ユーティリティ → リバースエンジニアリング → テスト設計 とし、開発フローの順に近づける

## Files

- 変更: `README.md`
- テスト: なし（Markdown のみ）
