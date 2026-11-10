---
id: "007"
title: "edgecase-analysis を作成する"
status: completed
estimated_complexity: high
priority: 2
dependencies: ["004"]
---

# Task: edgecase-analysis を作成する

6レイヤー並列 + 4カテゴリ並列の異常系分析スキルを作成する。元コマンドは6/4個の個別テンプレートを参照していたが、実体は単一の共通テンプレートなので、担当レイヤーを指定して同一テンプレートを渡す形に整理する。

## Test Strategy
- Step 4 / Step 5 が並列実行であることが明記されている
- 要件定義書の探索先に dev-plan 出力と rev-requirements 出力の両方が含まれる
- P0〜P3 の優先度基準が定義されている
- 500 行以内

## Files
- `skills/edgecase-analysis/SKILL.md`
