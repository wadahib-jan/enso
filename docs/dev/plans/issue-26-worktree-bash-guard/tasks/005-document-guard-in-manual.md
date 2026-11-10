---
id: "005"
title: "MANUAL.md に worktree 運用の注意として記載する"
status: done
priority: 4
dependencies: ["001"]
estimated_complexity: low
---

# Task: MANUAL.md に worktree 運用の注意として記載する

## Goal

利用者が worktree 隔離ガードの拒否メッセージを見たときに参照できるよう、`MANUAL.md` に運用上の注意を追加する。

## Interfaces

記載する内容 🔵

- ガードは **Claude Code に組み込まれたもの**であり、enso 側で無効化・緩和できないこと（`settings.json` の `permissions` でも hooks でも手前に入れない）
- 拒否が起きるのはコマンドの連結・ヒアドキュメント・コマンド置換を書いたときであり、**書き方で回避できる**こと
- enso のスキル定義側にこの制約が明文化されており、通常は利用者が意識する必要はないこと
- 拒否メッセージの実例（Issue #26 に記載されたもの）を 1 つ引用して、検索でここに辿り着けるようにする 🟡

配置先 🟡: 強制モードの worktree 運用を説明しているセクション（52-97 行目付近）の末尾。`.claude/enso.json` の注意書きが並ぶ箇所に隣接させる。

## Test Strategy

- [ ] `MANUAL.md` に worktree 隔離ガードに関する記述が追加されている
- [ ] 「enso 側では無効化できない」旨が明記され、無効化手順を案内していない
- [ ] 回避方法（1コマンドずつ / Write・Edit ツール / 絶対パス直書き）が読み取れる
- [ ] 拒否メッセージの文言が引用されており、メッセージで検索して辿り着ける
- [ ] 追加箇所が worktree / 強制モードの説明セクション内であり、無関係なセクションに挿入されていない
- [ ] エッジケース: 強制モードを使っていない（`.claude/enso.json` が無い）プロジェクトでも `EnterWorktree` を使えば同じ制約が効く旨が矛盾なく読める
- [ ] `pnpm secretlint` と `pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: `MANUAL.md` の 52-97 行目（強制モードと worktree の説明）、1015 行目（worktree 内実行の注意）
- 実装のヒント: MANUAL.md は利用者向け。スキル定義の内部規約をそのまま貼らず、「なぜ拒否されるのか / どうすればよいのか」を利用者の視点で書く
- 注意事項: Issue の趣旨は「Claude Code への要望ではない」。ガードを問題として書かず、**安全機構として妥当だが書き方で避けられる**という位置づけにする
- 注意事項: MANUAL.md は 1208 行あるが、スキル定義ではないので 500 行制限の対象外

## Files

- 変更: `MANUAL.md`
- 新規: なし
- テスト: なし（品質ゲートは `pnpm secretlint && pnpm check`）
