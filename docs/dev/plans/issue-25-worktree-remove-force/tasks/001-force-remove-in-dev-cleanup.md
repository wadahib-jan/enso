---
id: "001"
title: "dev-cleanup の worktree 削除を --force 化し判定基準を揃える"
status: done
priority: 1
dependencies: []
estimated_complexity: low
---

# Task: dev-cleanup の worktree 削除を --force 化し判定基準を揃える

## Goal

`skills/dev-cleanup/SKILL.md` の Step 6 汎用手順 3 で `git worktree remove --force` を使い、worktree 側の未コミット判定を「未追跡を含む `git status --porcelain`」と明記して、判定を通過した worktree が必ず削除できる状態にする。

## Interfaces

削除判定と実行手段の対応（スキル定義に表として記載する）:

```
本体チェックアウト: git -C "$MAIN" status --porcelain --untracked-files=no   # 🔵 現行どおり
worktree        : git -C "$WT"   status --porcelain                          # 🟡 未追跡を含む（現行の定義は --untracked-files=no）
削除            : git -C "$MAIN" worktree remove --force <path>              # 🔵 Issue #25 提案 A
```

> 🟡 worktree 側だけ未追跡を含めるのは、`--force` が未追跡ファイルも消すため。gitignore 対象（`node_modules` / `.venv`）は `status --porcelain` に出力されないので、この判定は生成物では成立しない。

## Test Strategy

- [ ] Step 6 汎用手順 3 のコードブロックが `git -C "$MAIN" worktree remove --force <path>` になっている
- [ ] 同じ節に「なぜ `--force` が安全なのか」（未追跡・無視対象を消すのであって、追跡済みの変更は事前判定で除外済み）が1〜3文で書かれている
- [ ] worktree の未コミット判定が `git -C "$WT" status --porcelain`（`--untracked-files=no` を付けない）として明記され、本体側の判定（`--untracked-files=no` あり）と区別されている
- [ ] 「ルール・制約」の「未コミット判定は `--untracked-files=no` を付ける」が、本体と worktree で基準が異なることを示す記述に更新されている
- [ ] 「ルール・制約」の「未コミットの変更が残る worktree は削除せず、警告して skip する」が維持されている（削除範囲を広げていない）
- [ ] `skills/dev-cleanup/SKILL.md` が 500 行以内である
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: `skills/dev-cleanup/SKILL.md` の 189-205 行付近（Step 6 汎用手順 3）、196-198 行付近（未コミット判定の記述）、240-245 行付近（ルール・制約）
- 既存実装の先例: `scripts/sync-after-merge.sh` の 168-177 行は既に worktree 側を `git -C "$WT" status --porcelain`（未追跡込み）で判定している。スキル定義をこれに合わせる
- 注意事項: 本体チェックアウトの判定（`--untracked-files=no`）は**変えない**。その理由（gitignore 漏れ1件で後始末全体が止まるのを防ぐ）は現行の記述が正しい
- 孤立ディレクトリの回収手順はタスク 002 で追加する。このタスクでは触れない

## Files

- 変更: `skills/dev-cleanup/SKILL.md`
