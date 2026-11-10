---
id: "003"
title: "sync-after-merge.sh の worktree 削除を --force 化し回収処理を入れる"
status: done
priority: 2
dependencies: ["002"]
estimated_complexity: medium
---

# Task: sync-after-merge.sh の worktree 削除を --force 化し回収処理を入れる

## Goal

`scripts/sync-after-merge.sh` の `git worktree remove` を `--force` 付きにし、失敗した場合はタスク 002 で定義した回収手順（`worktree list` で実状確認 → `prune` → `rm -rf`）を実行して、孤立ディレクトリが残らないようにする。スキル定義とスクリプトの挙動を一致させる。

## Interfaces

```bash
# 現行（176 行付近）
run git -C "$MAIN" worktree remove "$WT"

# 変更後のふるまい
if run git -C "$MAIN" worktree remove --force "$WT"; then
  : # 削除成功
else
  # 失敗。エントリが残っているか孤立したかを worktree list で確認してから決める   # 🔵
  # - エントリあり  : SKIPPED に積んで continue（ブランチも消さない）              # 🔵
  # - 孤立（なし）  : worktree prune → rm -rf "$WT"（1度だけ再試行）              # 🟡
  #                   それでも残れば SKIPPED に積んで手作業を促す                  # 🔵
fi
```

制約:

```
set -euo pipefail 下で動く。失敗しうるコマンドは if / || で受けてスクリプトを止めない   # 🔵 既存方針
--dry-run では rm -rf を実行しない（run 経由にする）                                    # 🔵
rm -rf の対象は "$MAIN/.claude/worktrees/" 配下であることを確認してから実行する          # 🔵
```

## Test Strategy

- [ ] `worktree remove` の呼び出しが `--force` 付きになっている
- [ ] `worktree remove` が失敗してもスクリプトが `set -e` で異常終了しない（`if` または `|| ` で受けている）
- [ ] 失敗時に `git worktree list --porcelain` でエントリの有無を確認する処理がある
- [ ] エントリが残っている場合はブランチを削除せず `SKIPPED` に理由つきで積み、`continue` する
- [ ] 孤立している場合は `worktree prune` のあと `rm -rf` を実行し、失敗したら1度だけ再試行する
- [ ] `rm -rf` の前に対象パスが `$MAIN/.claude/worktrees/` 配下であることを確認している
- [ ] `rm -rf` が `run` 経由で、`--dry-run` では `[dry-run] rm -rf ...` の表示だけになり実削除しない
- [ ] 100 行付近のコメント「`git worktree remove` は未追跡ファイルごと消すため」が実態（`--force` を付けたときに消える）に合わせて修正されている
- [ ] `./scripts/sync-after-merge.sh --dry-run` が exit 0 で完走する
- [ ] 削除・回収した worktree が完了サマリに出力される
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード:
  - `scripts/sync-after-merge.sh` 96-100 行（本体判定と worktree 判定の使い分けを説明するコメント）
  - 同 127-135 行（`worktree_of()`）
  - 同 168-178 行（worktree の未コミット判定と削除）
  - 同 `run()` の定義（`--dry-run` 分岐）と `SKIPPED` / `DELETED` 配列の使い方
- 実装のヒント: 回収処理は `worktree_of()` の近くにヘルパー関数（例: `remove_worktree()`）として切り出すとループ本体が読みやすい。戻り値でループ側の `continue` を判断する
- 注意事項:
  - worktree 側の未コミット判定（`git -C "$WT" status --porcelain`、未追跡込み）は**現行のまま変えない**。タスク 001 でスキル定義をこちらに合わせている
  - このスクリプトは `hooks/` ではないが、`hooks/lib/policy.mjs` から設定を読む既存の流れ（`resolveEnforce()` 経由）には手を入れない
  - `hooks/` を変更する場合は「jq に依存しない」「必ず exit 0 で終える」「基準は `git rev-parse --show-toplevel`」の3原則に従うこと。本タスクの想定では `hooks/` の変更は発生しない

## Files

- 変更: `scripts/sync-after-merge.sh`
