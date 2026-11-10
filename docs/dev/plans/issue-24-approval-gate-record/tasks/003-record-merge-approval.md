---
id: "003"
title: "dev-cleanup に承認記録の書き込み手順を追加"
status: done
priority: 2
dependencies: []
estimated_complexity: low
---

# Task: dev-cleanup に承認記録の書き込み手順を追加

## Goal

`dev-cleanup` Step 3 で「はい」が選ばれたとき、マージの前に `loop-state.yaml` へ `merge_approved_at` を書き、コミット・push する手順をスキル定義に追加する。

## Interfaces

`docs/dev/plans/<plan-name>/loop-state.yaml` に追加するフィールド 🔵

```yaml
merge_approved_at: 2026-09-08T12:34:56Z   # dev-cleanup Step 3 で「はい」が選ばれた時刻（ISO8601 / UTC）
```

Step 3 と Step 4 の間に挟む手順 🔵

```bash
# Step 3 で「はい」が選ばれた直後、Step 4（gh pr merge）の前に実行する
PLAN_DIR="<worktree>/docs/dev/plans/<plan-name>"
# loop-state.yaml に merge_approved_at を追記（既にあれば更新）
git -C "<worktree>" add "$PLAN_DIR/loop-state.yaml"
git -C "<worktree>" commit -m "chore(<plan-name>): マージ承認を記録"
git -C "<worktree>" push
```

## Test Strategy

- [ ] Step 3 で「はい」を選ぶと `loop-state.yaml` に `merge_approved_at` が ISO8601 で書かれる
- [ ] 記録がコミット・push されてから `gh pr merge` が実行される（記録が PR に含まれ、マージ後の base にも残る）
- [ ] Step 3 で「いいえ」を選んだ場合は記録を書かない
- [ ] エッジケース: `pr_number: null`（PR 未作成）の計画では Step 2〜4 を飛ばすため記録も書かない、と定義されている
- [ ] エッジケース: 既に `merge_approved_at` がある場合は上書き（新しい承認で更新される）
- [ ] Step 6 の後始末で worktree が「未コミットの変更あり」で skip されない（記録をコミット済みのため）
- [ ] `pnpm secretlint && pnpm check` が通る（Markdown は Biome の対象外だが secretlint は通す）

## Implementation Notes

- 参照すべき既存コード: `skills/dev-cleanup/SKILL.md` の Step 3・Step 4・Step 5・Step 6
- **記録は必ずコミットする。** 未コミットで残すと Step 6 の「未コミットの変更（追跡済み）が残る worktree は削除せず、警告して skip する」に該当し、後始末が完了しなくなる
- 書き込みは Step 5（`ExitWorktree`）より前なので、まだ worktree の中にいる。worktree ガードにも保護ブランチガードにも抵触しない
- Step 3 のルール（AskUserQuestion で出す・飛ばしてはならない）は既存の記述を残したうえで、「なぜ飛ばせないのか（記録が無ければ `gh pr merge` が hook に deny される）」を1行添える
- 「ルール・制約」に「承認記録を書かずに `gh pr merge` へ進まない」を追加する
- `SKILL.md` は 500 行以内に収める

## Files

- 変更: `skills/dev-cleanup/SKILL.md`
