---
id: "001"
title: "共通文言を確定し dev-plan Phase 0.7 に制約の提示を追加する"
status: done
priority: 1
dependencies: []
estimated_complexity: low
---

# Task: 共通文言を確定し dev-plan Phase 0.7 に制約の提示を追加する

## Goal

worktree 隔離ガードに拒否されない Bash の書き方を共通文言として確定し、`skills/dev-plan/SKILL.md` の Phase 0.7（worktree 作成）の直後に提示する手順を追加する。

## Interfaces

追加する共通文言（plan.md「共通文言（正）」と一字一句同じもの） 🔵

```markdown
**worktree セッション中の Bash は「単一の、単純なコマンド」に限る。**
Claude Code の worktree 隔離ガードは、worktree の外に出ないことを静的に検証できない
コマンドを拒否する。次を使わない:

- コマンドの連結（`cd A && cmd` / `cmd1; cmd2`）— worktree ルートから 1 コマンドずつ実行する
- ヒアドキュメントによるファイル生成 — **ファイルの作成・編集は Write / Edit ツールを使う**
- コマンド置換でパスを組み立てる形（`git -C "$(git rev-parse --show-toplevel)" ...`）—
  **worktree ルートの確定した絶対パスを直接書く**

拒否されたら書き方を変えて再実行する。ガードは無効化できない。
```

配置先 🔵: Phase 0.7 の手順 4「切り替え後のパスとブランチ名をユーザーに提示する」の直後に、手順 5 として「以降の Bash の書き方の制約を提示する」を追加し、上記文言を本文に置く。

## Test Strategy

- [ ] `skills/dev-plan/SKILL.md` の Phase 0.7 に共通文言が全文含まれている
- [ ] 3つの禁止パターン（コマンド連結 / ヒアドキュメント / コマンド置換）がすべて列挙されている
- [ ] 「ファイルの作成・編集は Write / Edit ツールを使う」が明記されている
- [ ] 「ガードは無効化できない」旨が含まれ、Claude Code 側の設定変更を促す記述が無い
- [ ] 追加箇所が Phase 0.7 の内部であり、Phase 1（要件明確化）以降に紛れ込んでいない
- [ ] `skills/dev-plan/SKILL.md` が 500 行以内（現在 376 行）
- [ ] エッジケース: worktree を作らなかった場合（git リポジトリでない / EnterWorktree 失敗）にこの制約が適用されない旨が読み取れる書き方になっている
- [ ] `pnpm secretlint` と `pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: `skills/dev-plan/SKILL.md` の Phase 0.7（「作業環境の準備（worktree）」）
- 実装のヒント: Phase 0.7 は番号付きリストの手順で構成されている。手順 5 として追加し、文言はリストの下にブロックで置く
- 注意事項: この文言は plan.md の「共通文言（正）」が正。003・004・005 は本タスクで確定した文言を転記するので、**先にこのタスクを完了させる**
- 注意事項: 本タスクでは Phase 0.7 以外（Phase 4 / 5b のコマンド例、ルール・制約の絶対パス行）に手を入れない。それは 002 の担当

## Files

- 変更: `skills/dev-plan/SKILL.md`
- 新規: なし
- テスト: なし（品質ゲートは `pnpm secretlint && pnpm check`）
