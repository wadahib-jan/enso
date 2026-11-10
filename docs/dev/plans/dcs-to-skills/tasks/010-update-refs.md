---
id: "010"
title: "参照を更新する"
status: completed
estimated_complexity: high
priority: 3
dependencies: ["009"]
---

# Task: 参照を更新する

削除・改名に伴う参照をすべて更新する。

## Test Strategy
- `dcs` / `incremental-dev` / `code-question` / `test-performance-analysis` の検索結果が、移行注記2件を除いて空
- dev-navigate の Q2 から incremental-dev が消え、代替ルートが提示される
- auto-debug の委譲先が timeout-fix になっている
- MANUAL の分析スキル節が開発フェーズ別に構成されている

## Files
- `README.md` / `MANUAL.md` / `CLAUDE.md`
- `commands/help.md` / `commands/auto-debug.md` / `commands/refine-plan.md` / `commands/refine-execute.md`
- `skills/dev-navigate/SKILL.md` / `skills/uat-test-design/references/source-categories.md`
