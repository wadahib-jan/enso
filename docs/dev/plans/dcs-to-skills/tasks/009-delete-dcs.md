---
id: "009"
title: "commands/dcs を削除する"
status: completed
estimated_complexity: low
priority: 1
dependencies: ["005","006","007","008"]
---

# Task: commands/dcs を削除する

DCS コマンド10本をディレクトリごと削除する。`install-local.sh` は `rsync --delete` なので投入先からも自動的に消える。`plugin.json` はディレクトリ単位指定のため変更不要。

## Test Strategy
- `commands/dcs/` が存在しない
- `.claude-plugin/plugin.json` が変更されていない

## Files
- `commands/dcs/`（削除）
