---
id: "003"
title: "テンプレートを references へ機械抽出する"
status: completed
estimated_complexity: medium
priority: 1
dependencies: ["002"]
---

# Task: テンプレートを references へ機械抽出する

各コマンドの `<xxx_template>` ブロックを sed で抽出し、`skills/<name>/references/` に配置する。**内容は再入力せず機械的に切り出す。**

## Test Strategy
- 17 の reference ファイルが生成される
- 抽出行数の合計が元テンプレートの行数と一致する
- 抽出後のファイルに `<template>` タグが残っていない

## Files
- `skills/*/references/*.md`（17ファイル）
