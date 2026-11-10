---
id: "002"
title: "Bash のルート取得に関する記述の矛盾を解消する"
status: done
priority: 2
dependencies: []
estimated_complexity: low
---

# Task: Bash のルート取得に関する記述の矛盾を解消する

## Goal

dev-plan / dev-loop / dev-cleanup は「worktree 内ではコマンド置換を使わない」と定める一方、多数のスキルが「`$(git rev-parse --show-toplevel)` でルートを取得」と指示している。散文ルール行を1つの文言に統一し、worktree セッション内で実際に実行されるコードブロック2箇所を直す。

## Interfaces

統一する文言（1行）:

```text
- Bash コマンドはプロジェクトルートの **絶対パス** を使う。worktree セッション中はコマンド置換（`$(...)`）で組み立てず、確定済みの絶対パスを直接書く   🔵 dev-plan:387 の趣旨と同じ
```

## Test Strategy

- [ ] `grep -rn 'show-toplevel)` でルートを取得' skills docs/dev/context.md` が 0 件になる
- [ ] `skills/dev-context/SKILL.md` の mkdir が `<project-root>/docs/dev` になる（dev-plan:207 と同じ表記）
- [ ] `skills/enso-policy/SKILL.md` のコミット手順から `$PROJECT_ROOT` と `git -C` が消え、1コマンドずつの2行になる
- [ ] 見送り対象（worktree 外で動く Entry スキルのコードブロック）は変更されていない
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- 散文ルール行を上の文言に置換（「（`$(git rev-parse --show-toplevel)` でルートを取得）」を含む行）:
  - skills/dev-webtest/SKILL.md:505
  - skills/dev-webtest-plan/SKILL.md:507, references/generate-prompt-template.md:18, references/update-apply-prompt-template.md:18
  - skills/dev-screen-spec/SKILL.md:531, references/{generate,diff-update,from-plan-generate}-prompt-template.md:18
  - skills/dev-context/SKILL.md:105, dev-init/SKILL.md:582, enso-issue-fix/SKILL.md:325, enso-policy/SKILL.md:143
  - skills/feature-rubber-duck/SKILL.md:167, rev-docs/SKILL.md:161, edgecase-analysis/SKILL.md:218
  - docs/dev/context.md:90（同じ趣旨の文に）
- コードブロック:
  - dev-context/SKILL.md:84 `mkdir -p "$(git rev-parse --show-toplevel)/docs/dev"` → `mkdir -p <project-root>/docs/dev`
  - enso-policy/SKILL.md:95-97 → `git add .claude/enso.json .gitignore` / `git commit -m "chore(enso-policy): 強制モードの設定を追加"` の2行＋「（プロジェクトルートから1コマンドずつ実行）」
- 見送り（plan.md に記録）: dev-plan / dev-run / dev-impl / dev-debug / dev-verify / dev-loop の既存ルール行（既に同趣旨の正本）、worktree 外で動く Entry スキルのコードブロック（dev-init:361、dev-screen-spec:104 等。今のままで動き、書き換えるとプレースホルダの受け渡しが増える）

## Files

- 変更: 上記 16 ファイル + skills/dev-context/SKILL.md, skills/enso-policy/SKILL.md（重複あり）
