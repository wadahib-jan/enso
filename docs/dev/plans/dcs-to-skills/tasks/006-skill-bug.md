---
id: "006"
title: "bug-analysis を作成する"
status: completed
estimated_complexity: medium
priority: 1
dependencies: ["004"]
---

# Task: bug-analysis を作成する

4段階（初期調査 → 処理フロー分析 → 詳細原因分析 → 最終レポート）の原因特定スキルを作成する。**dev-debug への引き渡し導線が本タスクの要。**

## Test Strategy
- dev-debug との役割分担が表で示されている
- 最終ステップに dev-debug への導線がある
- 「コードを修正しない」ことがルールに明記されている
- 候補記載の品質基準（⭐⭐以上・コード上の証拠必須）が保持されている

## Interfaces
🔵 確度評価: ⭐1〜5。⭐⭐未満は記載しない
🔵 信号機は「修正方針の確からしさ」を表す（確度とは別軸）

## Files
- `skills/bug-analysis/SKILL.md`
