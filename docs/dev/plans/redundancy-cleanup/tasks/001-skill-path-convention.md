---
id: "001"
title: "スキル内の壊れたパスをベースディレクトリ基準に統一する"
status: done
priority: 1
dependencies: []
estimated_complexity: medium
---

# Task: スキル内の壊れたパスをベースディレクトリ基準に統一する

## Goal

`.claude/skills/<skill>/...` や `skills/<skill>/...` のようにプロジェクト相対で書かれ、user スコープ配置（`~/.claude/skills/enso/skills/<skill>/`）では解決できないパスを、既存の規約（スキルのベースディレクトリ基準の相対パス）に揃える。あわせて ipa-security-check の `/ipa-security-check` 表記を `/enso:ipa-security-check` に揃える。

## Interfaces

パスの規約（新規の宣言は足さない。既存の `references/x.md` 形式に揃えるだけ）:

```text
同じスキル内        : rules/x.yaml                      🔵 既存スキルの書き方
他スキルのファイル  : ../dev-context/references/x.md    🔵 ベースディレクトリ基準
絶対パスが要る場所  : <skill-dir>/...（orchestrator.md） 🟡 既存の <agent> 表記に合わせる
                      {{SKILL_DIR}} / {{PROJECT_ROOT}}（dev-plan の fullspec テンプレート） 🟡 既存の {{PLAN_NAME}} 表記に合わせる
```

## Test Strategy

- [ ] `grep -rn '\.claude/skills/' skills` の結果が、`~/.claude/skills/enso` を指す正当な記述（enso-policy:15、enso-issue-report、dev-cleanup の投入先説明）と issue-template.md の例示だけになる
- [ ] `grep -rn 'skills/task-breakdown\|skills/dev-plan/references' skills` が 0 件になる
- [ ] `lib/orchestrator.md` の `python3` 行が `<skill-dir>/scripts/...` を使い、冒頭に `<skill-dir>` の置換規則が1行ある
- [ ] `fullspec-prompt-template.md` から「Glob で実際のパスを探索」と `$(git rev-parse --show-toplevel)` が消え、dev-plan Phase 1.5 の置換リストに `{{SKILL_DIR}}` / `{{PROJECT_ROOT}}` がある
- [ ] `grep -rn '`/ipa-security-check' skills` が 0 件になる（report.md.tmpl を比較する fixture が scripts にあればその1行は見送り、plan.md に記録）
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- `agents/{01..11,safe-sql-details,web-health-check,operation-checklist}.md` の :16 / :20（14ファイル共通）: `.claude/skills/ipa-security-check/` → `<skill-dir>/`
- `lib/orchestrator.md`: :3 直後に「パス中の `<skill-dir>` はこのスキルのベースディレクトリの絶対パスに置換する。サブエージェントにはベースディレクトリが表示されないため、プロンプトにも絶対パスで埋め込む」を1行追加。:140 / :143 / :223 / :251 / :322 を `<skill-dir>/...` に
- `ipa-security-check/SKILL.md:168` ツリーの根を `ipa-security-check/` に
- `dev-init/SKILL.md:366,604` → `../dev-context/references/context-template.md`
- `dev-init/references/docker-dev-templates.md:266` → `../dev-webtest/references/docker-setup.md`
- `dev-plan/SKILL.md:190,394` → `../task-breakdown/...`。:143-146 の置換リストと :400 の列挙に `{{SKILL_DIR}}`（このスキルのベースディレクトリ）と `{{PROJECT_ROOT}}`（Phase 0.7 で確定した worktree の絶対パス）を追加
- `dev-plan/references/fullspec-prompt-template.md:39-41` → `ファイルパス: {{SKILL_DIR}}/references/fullspec-templates.md` の1行。:45-48 → `mkdir -p {{PROJECT_ROOT}}/docs/dev/plans/{{PLAN_NAME}}` の1行
- `/ipa-security-check` → `/enso:ipa-security-check`: SKILL.md:24,28-33 / references/arguments.md:6,13,30,33,36,39,42,45 / lib/orchestrator.md:3,51 / lib/triage_state.md:163 / templates/report.md.tmpl:97
- 行番号は目安。文字列置換で指定しているので、前後のタスクで行がずれても検索して直す
- 対象外: ipa の検査系 agents/*.md 14体が orchestrator から読まれていない件（重複定義の整理は振る舞いの変更を伴うため別件）

## Files

- 変更: skills/ipa-security-check/agents/*.md（14ファイル）
- 変更: skills/ipa-security-check/lib/orchestrator.md, lib/triage_state.md, SKILL.md, references/arguments.md, templates/report.md.tmpl
- 変更: skills/dev-init/SKILL.md, skills/dev-init/references/docker-dev-templates.md
- 変更: skills/dev-plan/SKILL.md, skills/dev-plan/references/fullspec-prompt-template.md
