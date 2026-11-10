---
id: "002"
title: "dev-cleanup に孤立ディレクトリの回収手順を追加する"
status: done
priority: 2
dependencies: ["001"]
estimated_complexity: medium
---

# Task: dev-cleanup に孤立ディレクトリの回収手順を追加する

## Goal

`git worktree remove` が失敗したあとに管理エントリだけ消えてディレクトリが孤立する git の挙動に備え、`skills/dev-cleanup/SKILL.md` に「失敗後は `worktree list` で実状を確認してから次の手を決める」回収手順を定義する。過去に失敗して残っている孤立ディレクトリも同じ手順で片付けられるようにする。

## Interfaces

回収の分岐（スキル定義に記載する手順）:

```
git -C "$MAIN" worktree remove --force <path>   # 失敗した場合のみ以下へ
  ↓
git -C "$MAIN" worktree list --porcelain | grep -F "worktree <path>"
  ├─ ヒットする（エントリが残っている）  → skip して警告する。次回の後始末で再試行できる   # 🔵
  └─ ヒットしない（孤立している）        → git -C "$MAIN" worktree prune                    # 🔵
                                           rm -rf <path>（失敗したら1度だけ再試行）        # 🟡 virtiofs の遅延対策
                                           それでも残ればパスを提示して手作業を案内         # 🔵
```

前提条件（`rm -rf` の実行前に必ず確認する）:

```
<path> が "$MAIN/.claude/worktrees/" 配下の絶対パスであること   # 🔵 取り違え防止
```

## Test Strategy

- [ ] Step 6 汎用手順 3 に、`worktree remove --force` が失敗した場合の分岐が記載されている
- [ ] 分岐が `git worktree list` でエントリの有無を確認してから決まる形になっており、「失敗＝何も起きていない」と仮定していない
- [ ] エントリが残っている場合は skip して警告する（`rm -rf` しない）と明記されている
- [ ] 孤立している場合の手順が `worktree prune` → `rm -rf <path>` の順で記載されている
- [ ] `rm -rf` の実行前に「`.claude/worktrees/` 配下であること」を確認する旨が明記されている
- [ ] `rm -rf` が失敗したときに1度だけ再試行し、それでも残ればパスを提示して手作業を案内する旨が書かれている（virtiofs 等の遅延を理由として1文添える）
- [ ] Step 7 の完了報告の表に、回収した孤立ディレクトリ／手作業が必要なパスを載せる項目がある
- [ ] 「ルール・制約」に、削除失敗後は `worktree list` で実状を確認してから次の手を決める旨が追加されている
- [ ] `skills/dev-cleanup/SKILL.md` が 500 行以内である
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: タスク 001 で更新した `skills/dev-cleanup/SKILL.md` Step 6 汎用手順 3、および Step 7（完了報告）の表
- 実装のヒント: 手順が長くなるので、汎用手順 3 の直後に「削除に失敗したとき」の小見出しを設けて分岐を書く。本文の主線（成功パス）は短いまま保つ
- 注意事項:
  - `locked` な worktree は `worktree list` に出るため孤立ではない。`worktree remove` は `--force` を2回指定しないと locked を消せないが、**本タスクでは locked の強制削除に踏み込まない**（ロックは意図的に付けられたものであり、Issue #25 の症状ではない）。skip して警告するに留める
  - `rm -rf` は本スキルで唯一の非可逆な直接削除になる。前提条件の確認を手順から落とさない

## Files

- 変更: `skills/dev-cleanup/SKILL.md`
