---
id: "003"
title: "フックに関するドキュメントの記述を是正する"
status: done
priority: 3
dependencies: ["002"]
estimated_complexity: low
---

# Task: フックに関するドキュメントの記述を是正する

## Goal

`CLAUDE.md` の「フックは `node_modules` を必要とします」という記述が実態とずれている点を是正し、worktree での挙動（hooks は共有される・`prepare` は skip される）を明記する。

## Interfaces

対象箇所:

```
CLAUDE.md:118   **注意**: フックは `node_modules` を必要とします。クローン直後は `pnpm install && pnpm prepare` を実行してください。
CLAUDE.md:58    pnpm prepare  # pre-commitフック（simple-git-hooks）のセットアップ
docs/dev/context.md:18    | Git Hooks | simple-git-hooks 2.13.1 | 🔵 |
docs/dev/context.md:122   | `pnpm prepare` | pre-commit フック（simple-git-hooks）のセットアップ |
```

> 🔵 行番号は本計画の作成時点のもの。実装時に grep で再確認する。

## Test Strategy

- [ ] `CLAUDE.md` に「`node_modules` があっても worktree では `prepare` が hooks を設置しない」旨が書かれている
- [ ] `CLAUDE.md` に「hooks は common dir で共有されるため worktree では設置不要」「そのため worktree でも pre-commit フックは効く」旨が書かれている
- [ ] `CLAUDE.md` の `pnpm prepare` の説明が、worktree では skip される挙動と矛盾しない
- [ ] `docs/dev/context.md` の Git Hooks / `pnpm prepare` の記述が `CLAUDE.md` と食い違わない
- [ ] `pnpm secretlint && pnpm check` が exit 0（Biome は `.md` を対象にしないが、ゲートは通す）

## Implementation Notes

- 参照すべき既存コード: 001・002 の実装結果（記述を実装に合わせる。逆をしない）
- 実装のヒント: `pnpm-workspace.yaml` の `allowBuilds` についても「なぜ追跡下に置いているか」を1-2行添えると、将来の削除事故を防げる
- 注意事項: Issue が「対応案」として挙げた `core.hooksPath` は採用しない。採用しなかった理由（hooks は既に共有されている）は plan.md に記録済みなので、ドキュメント側で改めて論じない
- 注意事項: Issue に書かれていない改善（README/MANUAL の全体的な書き直し等）に広げない

## Files

- 新規: なし
- 変更: `CLAUDE.md`、`docs/dev/context.md`
- テスト: なし
