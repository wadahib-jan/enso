---
id: "002"
title: "dev-plan の絶対パス規約とコマンド例をガードに合わせて整理する"
status: done
priority: 2
dependencies: ["001"]
estimated_complexity: low
---

# Task: dev-plan の絶対パス規約とコマンド例をガードに合わせて整理する

## Goal

`skills/dev-plan/SKILL.md` に残る `$(git rev-parse --show-toplevel)` を使った規約とコマンド例を、worktree 隔離ガードに拒否されない形へ書き換える。

## Interfaces

差し替え後の規約行（「ルール・制約」末尾、現在 364 行目） 🔵

```markdown
- Bash コマンドはプロジェクトルートの **絶対パス** を使用する。worktree セッション中は
  `$(git rev-parse --show-toplevel)` のようなコマンド置換を使わず、worktree ルートの
  確定した絶対パスを直接書く（ガードに拒否されるため）
```

書き換え対象のコマンド例 🔵

| 箇所 | 現状 | 方針 |
|---|---|---|
| Phase 4「ファイル出力」（195行目付近） | `PROJECT_ROOT="$(git rev-parse --show-toplevel)"` + `mkdir -p "$PROJECT_ROOT/..."` | Phase 0.7 で確定した worktree の絶対パスを直接書く例に差し替え、`mkdir` は 1 コマンドずつにする |
| Phase 5b「計画成果物のコミット」（281行目付近） | `git -C "$PROJECT_ROOT" add/commit/push` の 3 行 | 同上。`$(...)` を含む `push -u origin "$(git ... rev-parse --abbrev-ref HEAD)"` はブランチ名（`worktree-<plan-name>`）を直書きする形にする |

## Test Strategy

- [ ] 「ルール・制約」の絶対パス行が、コマンド置換を使わない旨を含む文言に差し替わっている
- [ ] 「絶対パスを使う」という元の意図（誤ったディレクトリへの書き込み防止）が失われていない
- [ ] Phase 4 の `mkdir` 例に `$(git rev-parse --show-toplevel)` が含まれない
- [ ] Phase 5b の `git add` / `commit` / `push` 例に `$(...)` が含まれず、1 コマンド 1 行になっている
- [ ] `push` のブランチ名が `worktree-<plan-name>` の形で解決できる（plan-name は Phase 0.5 で確定済み）
- [ ] エッジケース: worktree を作らなかった場合（git リポジトリでない / EnterWorktree 失敗）でも手順が破綻しない書き方になっている
- [ ] `skills/dev-plan/SKILL.md` が 500 行以内
- [ ] `pnpm secretlint` と `pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: `skills/dev-plan/SKILL.md` の 195・281・364 行目付近
- 実装のヒント: Phase 0.7 で worktree の絶対パスをユーザーに提示済みなので、以降のフェーズでは「Phase 0.7 で確定した worktree の絶対パス」を指す書き方にできる
- 注意事項: 001 で追加した Phase 0.7 の文言と矛盾しないこと。片方だけ直すと規約が二重になる
- 注意事項: **`dev-plan` 以外のファイルには手を入れない**。他スキルは 003・004 の担当

## Files

- 変更: `skills/dev-plan/SKILL.md`
- 新規: なし
- テスト: なし（品質ゲートは `pnpm secretlint && pnpm check`）
