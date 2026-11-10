---
id: "001"
title: "dev-navigate を廃止し参照を掃除する"
status: done
priority: 1
dependencies: []
estimated_complexity: low
---

# Task: dev-navigate を廃止し参照を掃除する

## Goal

`skills/dev-navigate/` を削除し、スキル定義と `docs/dev/context.md` に残る `dev-navigate` への参照を取り除く。スキルの description による自動ルーティングが機能している以上、「どのスキルを使うか案内するスキル」は Claude 自身の役割と重複するため。

## Interfaces

削除対象と参照掃除の対象（README / MANUAL は 004 / 005 で扱うため本タスクの範囲外）:

```
削除:
  skills/dev-navigate/SKILL.md          # ディレクトリごと削除  🔵

参照掃除:
  skills/enso-issue-fix/SKILL.md:57                      # Issue 命名例の1行  🔵
  skills/enso-issue-report/references/issue-template.md:84  # 記入例の1行     🔵
  docs/dev/context.md:108                                # スキル一覧の1行   🔵

書き換えない（履歴記録）:
  docs/dev/plans/dcs-to-skills/**
  docs/dev/plans/dev-cleanup/**
  docs/dev/plans/issue-skills/**
  docs/dev/plans/merge-gate-dedupe/**
  docs/dev/plans/retire-commands/**
```

`skills/enso-issue-fix/SKILL.md:57` は Issue タイトルからブランチ名を導く例示（`dev-navigate に Issue 導線がない` → `issue-14-navigate-issue-entry`）。廃止済みスキルを例に使うのは不適切なので、現存する Entry スキルを使った例に差し替える。

`skills/enso-issue-report/references/issue-template.md:84` は Issue テンプレートの「該当箇所」記入例。同様に現存スキルのパスに差し替える。

## Test Strategy

- [ ] `skills/dev-navigate/` がリポジトリに存在しない
- [ ] `grep -rn "dev-navigate" skills/` が 0 件
- [ ] `grep -n "dev-navigate" docs/dev/context.md` が 0 件
- [ ] `skills/enso-issue-fix/SKILL.md` の命名例が、現存する Entry スキルを対象にした例になっている
- [ ] `skills/enso-issue-report/references/issue-template.md` の記入例が実在するファイルパスを指している
- [ ] エッジケース: `docs/dev/plans/` 配下の過去の計画・レポートは1文字も変更されていない（`git diff --name-only` に `docs/dev/plans/dcs-to-skills` 等が現れない）
- [ ] エッジケース: `grep -rn "dev-navigate" scripts/ book/ hooks/` が 0 件のまま（元から参照が無いことの再確認）

## Implementation Notes

- 参照すべき既存コード: `skills/enso-issue-fix/SKILL.md` の Step で示されるブランチ命名規則、`skills/enso-issue-report/references/issue-template.md` の「該当箇所」欄
- `docs/dev/context.md` はこのリポジトリ自身のコンテキストファイル。スキル一覧テーブルから `dev-navigate` の行を削除する
- 削除は `git rm -r skills/dev-navigate` で行う

## Files

- 削除: `skills/dev-navigate/SKILL.md`
- 変更: `skills/enso-issue-fix/SKILL.md`
- 変更: `skills/enso-issue-report/references/issue-template.md`
- 変更: `docs/dev/context.md`
- テスト: なし（grep による確認）
