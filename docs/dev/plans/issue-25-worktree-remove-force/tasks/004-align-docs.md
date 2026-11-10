---
id: "004"
title: "CLAUDE.md の後始末の記述を実装に合わせる"
status: done
priority: 3
dependencies: ["003"]
estimated_complexity: low
---

# Task: CLAUDE.md の後始末の記述を実装に合わせる

## Goal

`CLAUDE.md` の「PR をマージしたあと」の節が、タスク 003 で変更した `scripts/sync-after-merge.sh` の挙動（`--force` での削除と孤立ディレクトリの回収）と食い違わないようにする。

## Interfaces

更新対象の記述（現行）:

```
未コミットの変更が残る worktree は削除せず、警告して skip します。
```

更新後に含める内容:

```
worktree の削除は --force で行い、gitignore 対象の生成物（node_modules / .venv 等）ごと消す   # 🔵
未コミットの変更（未追跡を含む）が残る worktree は削除せず、警告して skip する                 # 🔵
削除に失敗した場合は worktree list で実状を確認し、孤立していれば prune + rm -rf で回収する    # 🔵
```

## Test Strategy

- [ ] `CLAUDE.md` の「PR をマージしたあと」の節に `--force` で削除する旨とその理由が1〜2文で書かれている
- [ ] 「未コミットの変更が残る worktree は削除せず、警告して skip します」が、判定に未追跡ファイルを含むことが分かる表現になっている
- [ ] 削除失敗時に孤立ディレクトリを回収する旨が1文で書かれている
- [ ] `skills/dev-cleanup/SKILL.md` の記述と矛盾がない（001・002 の成果と読み比べる）
- [ ] `MANUAL.md` / `README.md` に `worktree remove` の挙動を説明した記述が無いことを確認する（`grep -rn "worktree remove" --include="*.md"` の結果が `MANUAL.md:55` の権限プロンプトの話と `skills/dev-cleanup/SKILL.md` だけであること）
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: `CLAUDE.md` の「### PR をマージしたあと」の節
- 注意事項: `MANUAL.md:55` の `git worktree remove` は「確認プロンプトに落ちるコマンド」の例示であり、本 Issue とは無関係。変更しない
- Issue に書かれていない改善（README の構成変更など）を持ち込まない

## Files

- 変更: `CLAUDE.md`
