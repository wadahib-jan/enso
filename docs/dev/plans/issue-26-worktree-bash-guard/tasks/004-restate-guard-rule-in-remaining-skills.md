---
id: "004"
title: "dev-debug / dev-verify / dev-cleanup / dev-loop に制約を再掲する"
status: done
priority: 3
dependencies: ["001"]
estimated_complexity: low
---

# Task: dev-debug / dev-verify / dev-cleanup / dev-loop に制約を再掲する

## Goal

worktree セッション中に走る残りの dev-* スキルへ、共通文言を 1 行に圧縮して再掲し、絶対パス規約を整理する。

## Interfaces

再掲する 1 行（4ファイル共通） 🔵

```markdown
- **worktree セッション中の Bash は「単一の、単純なコマンド」に限る。** コマンドの連結
  （`&&` / `;`）・ヒアドキュメント・コマンド置換は worktree 隔離ガードに拒否される。
  ファイルの作成・編集は Write / Edit ツールを使う
```

対象と既存記述の扱い 🔵

| ファイル | 現在の記述 | 対応 |
|---|---|---|
| `skills/dev-debug/SKILL.md` | 278行目に絶対パス規約 | 1行を追加 + 絶対パス行を差し替え |
| `skills/dev-verify/SKILL.md` | 70行目に `wc -l "$(git rev-parse --show-toplevel)/..."`、162行目に絶対パス規約 | 1行を追加 + 両方を差し替え |
| `skills/dev-cleanup/SKILL.md` | 165行目に「`--show-toplevel` は worktree 内だと worktree 自身を指すので使わない」 | 1行を追加。165行目の記述は**残す**（別の理由の注意書きであり、今回の理由を併記する） |
| `skills/dev-loop/SKILL.md` | 105行目に `PROJECT_ROOT="$(...)"`、187行目に `git -C "$(git rev-parse --show-toplevel)"` | 1行を追加 + 両方を差し替え |

## Test Strategy

- [ ] 4ファイルすべての「ルール・制約」に再掲の 1 行が含まれている
- [ ] 3つの禁止パターン（連結 / ヒアドキュメント / コマンド置換）が 1 行の中に残っている
- [ ] `dev-verify` 70行目・`dev-loop` 105/187行目の `$(git rev-parse --show-toplevel)` が解消されている
- [ ] `dev-cleanup` 165行目の既存の注意書き（本体チェックアウトを対象にする理由）が消えていない
- [ ] `dev-loop` の「worktree の外で `dev-run` / `dev-verify` を起動しない」既存制約と矛盾しない
- [ ] エッジケース: `dev-cleanup` は worktree を削除したあと**本体チェックアウトで**動く場面がある。その局面にまで「コマンド置換禁止」を適用しない書き分けになっている
- [ ] 4ファイルすべてが 500 行以内（現在 286 / 162 / 259 / 208 行）
- [ ] `pnpm secretlint` と `pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: 上表の各行番号
- 実装のヒント: 全文ではなく 1 行に圧縮するのは、これらのスキルが Bash を打つ量が dev-run / dev-impl より少なく、全文の重複がファイルを膨らませるため
- 注意事項: `dev-cleanup` は worktree の削除そのものを行うスキルで、worktree の中と外を跨ぐ。**「worktree セッション中は」という条件を落とさない**こと
- 注意事項: 001 の共通文言から情報を落としすぎない。3つの禁止パターンと「Write / Edit を使う」は必須

## Files

- 変更: `skills/dev-debug/SKILL.md`, `skills/dev-verify/SKILL.md`, `skills/dev-cleanup/SKILL.md`, `skills/dev-loop/SKILL.md`
- 新規: なし
- テスト: なし（品質ゲートは `pnpm secretlint && pnpm check`）
