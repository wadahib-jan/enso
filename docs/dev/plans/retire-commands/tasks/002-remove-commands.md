---
id: "002"
title: "commands/ を全削除し plugin.json から commands キーを外す"
status: done
priority: 1
dependencies: ["001"]
estimated_complexity: low
---

# Task: commands/ を全削除し plugin.json から commands キーを外す

## Goal

残る13コマンドと `commands/` ディレクトリを削除し、`.claude-plugin/plugin.json` を skills のみのマニフェストにして、enso をスキルのみのプラグインにする。

## Interfaces

削除対象（13ファイル）:

```
commands/adr-rubber-duck.md            commands/orchestrate.md
commands/auto-debug.md                 commands/refine-execute.md
commands/build-fix.md                  commands/refine-plan.md
commands/env-fix.md                    commands/task-exec.md
commands/flaky-fix.md                  commands/tech-stack.md
commands/help.md                       commands/test-optimization-patterns.md
commands/timeout-fix.md
```

変更後の `.claude-plugin/plugin.json`（🔵 `commands` キーはディレクトリ指定なので、ディレクトリごと消す以上は残せない）:

```json
{
  "name": "enso",
  "version": "1.0.0",
  "description": "AI-driven development toolkit for TDD and SDD workflows, providing comprehensive command templates and skills to enhance developer productivity with Claude Code",
  "skills": "./skills/"
}
```

## Test Strategy

- [ ] `test ! -d commands` が真（ディレクトリごと消えている）
- [ ] `git status` に13ファイルの削除が記録されている（`git rm` を使い、未追跡の取り残しが無い）
- [ ] `.claude-plugin/plugin.json` に `commands` キーが存在しない
- [ ] `.claude-plugin/plugin.json` に `"skills": "./skills/"` が残っている
- [ ] `claude plugin validate .` が通過し、`commands/tech-stack.md: No frontmatter block found` の警告が出力に含まれない
- [ ] `pnpm check` が通過する（plugin.json は Biome のフォーマット対象）
- [ ] `skills/` 配下のファイル数が本タスクで変化していない
- [ ] `scripts/install-local.sh` が、リポジトリに存在しなくなったトップレベルディレクトリを投入先からも削除する（`commands/` を消した状態で `./scripts/install-local.sh --dry-run` を実行し、投入先の `commands/` が残置される挙動になっていないこと）

## Implementation Notes

- 参照すべき既存コード: `docs/dev/plans/rev-docs/tasks/003-remove-old-commands.md` — 前回の rev-* 削除と同じ手順（`git rm` で消す）
- 実装のヒント:
  - `git rm commands/*.md` で13ファイルを削除すると空ディレクトリも git 上から消える。ローカルに空ディレクトリが残る場合は `rmdir commands` する
  - `plugin.json` の `description` は commands を含む文言だが、本タスクでは変更しない（README/MANUAL 側の整理は 004 で扱う。マニフェストの description 変更は配布名称に関わるため対象外とする）
  - `scripts/install-local.sh:59-66` は `for d in commands skills agents hooks` でソースを組み立て、`[[ -d ]]` で存在チェックするのでリポジトリから `commands/` が消えてもスクリプトは失敗しない。**問題は投入先側**で、`rsync -a --delete src... dest/` の `--delete` は転送された各ツリーの内側しか掃除しないため、`~/.claude/skills/enso/commands/` が**古いまま残り続ける**。既に投入済みの環境では削除したはずのコマンドが使えてしまうので、ソース一覧から外れたディレクトリを投入先から明示的に削除する処理を足す
  - 実装案（🟡 既存のループの直後に置く）: `for d in commands skills agents hooks; do [[ -d "$REPO/$d" ]] || rm -rf "$DEST/$d"; done` — `--dry-run` 時は削除せずメッセージのみ出す
- 注意事項:
  - 001 が完了していること（flaky/timeout/最適化パターンの退避先ができてから消す）
  - `--dry-run` の意味を壊さないこと（`--dry-run` 指定時に投入先を実際に消してはならない）

## Files

- 削除: `commands/`（13ファイルとディレクトリ）
- 変更: `.claude-plugin/plugin.json`, `scripts/install-local.sh`
- テスト: なし（`claude plugin validate .` と `pnpm check` を検証に用いる）
