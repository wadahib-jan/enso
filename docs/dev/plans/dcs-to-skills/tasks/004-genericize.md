---
id: "004"
title: "固有プロジェクト名を除去する"
status: completed
estimated_complexity: low
priority: 1
dependencies: ["003"]
---

# Task: 固有プロジェクト名を除去する

抽出したテンプレートに混入していた作者固有のプロジェクト名・パスを汎用表現へ置換する。

## Test Strategy
- `grep -rn "Prismatix\|prismatix\|ensemble-si\|makotan" skills/` が空
- 置換後もテンプレートの構造（見出し・手順）が壊れていない

## Files
- `skills/bug-analysis/references/initial-investigation-template.md`
- `skills/{impact,performance,state-transition,sequence-diagram}-*/references/*.md`
