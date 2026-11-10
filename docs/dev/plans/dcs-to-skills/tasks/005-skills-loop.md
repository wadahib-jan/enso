---
id: "005"
title: "調査ループ型4スキルを作成する"
status: completed
estimated_complexity: high
priority: 2
dependencies: ["004"]
---

# Task: 調査ループ型4スキルを作成する

impact-analysis / performance-analysis / sequence-diagram-analysis / state-transition-analysis の SKILL.md を作成する。4本は「初期調査 → 追加調査ループ（最大5回）→ 最終サマリー」の共通骨格を持つが、抽象化せず各自に記述する。

## Test Strategy
- 各 SKILL.md の frontmatter の `name` がディレクトリ名と一致する
- description が「いつ使うか」を判別できるトリガーワードを含む
- 出力先が `docs/dev/analysis/` になっている
- performance-analysis に timeout-fix との使い分けが明記されている
- 各 500 行以内

## Interfaces
🔵 出力先: `docs/dev/analysis/<timestamp>_<name>/`
🔵 timestamp 形式: `yyyyMMddHHmmss`
🔵 追加調査は最大5回、各回でユーザー承認

## Files
- `skills/{impact,performance,sequence-diagram,state-transition}-analysis/SKILL.md`
