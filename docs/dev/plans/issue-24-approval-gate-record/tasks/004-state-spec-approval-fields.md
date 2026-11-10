---
id: "004"
title: "dev-plan / dev-loop の状態ファイル仕様に承認フィールドを追加"
status: done
priority: 3
dependencies: []
estimated_complexity: low
---

# Task: dev-plan / dev-loop の状態ファイル仕様に承認フィールドを追加

## Goal

`loop-state.yaml` の仕様を記述している2つのスキル定義を、承認フィールドの追加に追随させる。あわせて `dev-plan` Phase 5e で「はい」が選ばれたときに `impl_approved_at` を記録する（監査用）。

## Interfaces

状態ファイル仕様に追加する記述 🔵

```yaml
plan_name: auth
status: awaiting-approval
branch: worktree-auth
worktree: /path/to/project/.claude/worktrees/auth
pr_number: 12
pr_url: https://github.com/<owner>/<repo>/pull/12
task_range: ["001", "005"]
impl_approved_at: 2026-09-08T10:00:00Z    # dev-plan Phase 5e で「はい」が選ばれた時刻（任意）
merge_approved_at: 2026-09-08T12:34:56Z   # dev-cleanup Step 3 で「はい」が選ばれた時刻（任意）
```

| フィールド | 書く場所 | 用途 |
|---|---|---|
| `impl_approved_at` | `dev-plan` Phase 5e で「はい」 | **監査のみ。** deny の根拠には使わない |
| `merge_approved_at` | `dev-cleanup` Step 3 で「はい」 | `gh pr merge` の PreToolUse ガードが検査する |

## Test Strategy

- [ ] `dev-plan` Phase 5e で「はい」を選ぶと `loop-state.yaml` に `impl_approved_at` が書かれる（`dev-loop` 起動前）
- [ ] 「いいえ」では書かれず、`status` は `awaiting-approval` のまま（既存の挙動を壊していない）
- [ ] `dev-plan` 5d / `dev-loop` 「状態ファイル仕様」の両方に2フィールドが記載されている
- [ ] 両者の記載内容が食い違っていない（フィールド名・意味・任意である旨）
- [ ] エッジケース: フィールドが無い既存の `loop-state.yaml` を `dev-loop` が読んでも従来どおり動く、と明記されている
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: `skills/dev-plan/SKILL.md` の 5d・5e、`skills/dev-loop/SKILL.md` の「状態ファイル仕様」
- **`impl_approved_at` に対する新しい deny は作らない。** Issue が求めているのは記録（監査性）まで。`gh pr ready` は既にセキュリティレポートで拘束されている
- 承認フィールドは**任意**である。承認時に初めて書かれるため、計画作成直後の `loop-state.yaml` には存在しない。この点を仕様に明記する（「フィールドが無い＝まだ承認されていない」であって「古い形式」ではない）
- `dev-plan` 5e の記録は 5d の状態ファイル出力とは別タイミング（承認後）なので、書いたあとコミットが必要かは `dev-loop` が直後に `status: running` へ更新してコミットする流れに合わせる
- 各 `SKILL.md` は 500 行以内に収める

## Files

- 変更: `skills/dev-plan/SKILL.md`
- 変更: `skills/dev-loop/SKILL.md`
