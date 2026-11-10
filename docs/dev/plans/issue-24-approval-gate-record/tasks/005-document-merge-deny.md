---
id: "005"
title: "README / MANUAL の deny 一覧に gh pr merge を追記"
status: done
priority: 4
dependencies: ["002", "003", "004"]
estimated_complexity: low
---

# Task: README / MANUAL の deny 一覧に gh pr merge を追記

## Goal

強制モードで何がブロックされるかの一覧に `gh pr merge` を加え、承認記録の仕組みを利用者向けに説明する。

## Interfaces

`MANUAL.md`「何が起きるか」の表に追加する行 🔵

```markdown
| `gh pr merge` | `loop-state.yaml` に有効なマージ承認の記録が無ければブロックされる |
```

`MANUAL.md` の設定項目表の `flow` 行を更新する 🔵

```markdown
| `flow` | `true` | dev-* フローの経由を促すコンテキストを注入し、承認記録の無い `gh pr merge` をブロックする |
```

## Test Strategy

- [ ] `MANUAL.md`「何が起きるか」の表に `gh pr merge` の行がある
- [ ] `MANUAL.md` の設定項目表で `flow` の説明が新ガードを含んでいる
- [ ] `README.md` の強制モード概要に、承認記録が無ければマージがブロックされる旨が1行ある
- [ ] `merge_approved_at` / `impl_approved_at` の説明が `MANUAL.md` にあり、004 の記述と食い違っていない
- [ ] ブロックされたときの回避方法（`dev-cleanup` Step 3 を経由する）が読み取れる
- [ ] エッジケース: 対応する `loop-state.yaml` が無い PR は `ask` に落ちる（enso 管理外の PR は締め出さない）ことが書かれている
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: `MANUAL.md` の「強制モード > 何が起きるか」の表と設定項目表、`README.md` の「強制モード（任意）」節
- 実装（002〜004）が確定してから書く。**先に書くと実際の挙動とずれる**
- README は概要にとどめ、詳細は MANUAL へのリンクで済ませる（既存の分担を崩さない）

## Files

- 変更: `MANUAL.md`
- 変更: `README.md`
