---
id: "011"
title: "品質ゲートと受入基準を検証する"
status: completed
estimated_complexity: medium
priority: 1
dependencies: ["010"]
---

# Task: 品質ゲートと受入基準を検証する

acceptance-criteria.md の AC-001〜AC-013 を実行して確認する。

## Test Strategy
- `pnpm secretlint` と `pnpm check` がエラーなく完了
- `claude plugin validate .` が通過（tech-stack.md の frontmatter 警告は既知の既存事象）
- `./scripts/install-local.sh --dry-run` の差分が意図通り
- 7スキルすべてが 500 行以内

## Files
- （検証のみ。ファイル変更なし）
