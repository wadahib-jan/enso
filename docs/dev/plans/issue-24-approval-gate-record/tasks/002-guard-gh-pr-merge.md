---
id: "002"
title: "guard-bash.mjs に gh pr merge の承認ガードを追加"
status: done
priority: 2
dependencies: ["001"]
estimated_complexity: medium
---

# Task: guard-bash.mjs に gh pr merge の承認ガードを追加

## Goal

PreToolUse(Bash) で `gh pr merge` を検査し、対象 PR の `loop-state.yaml` に有効な `merge_approved_at` が無ければ deny して `dev-cleanup` Step 3 のゲートへ誘導する。

## Interfaces

```js
/**
 * `gh pr merge [<number>|<url>|<branch>] [flags]` の対象を取り出す。 🟡
 * gh pr merge でなければ null。
 * 操作対象が省略された場合は現在のブランチが対象なので prNumber も branch も null で返し、
 * 呼び出し側が gitState().branch で補う。
 */
function mergeTarget(segment); // → { prNumber: string|null, branch: string|null } | null
```

判定表 🔵:

| 状況 | 判定 |
|---|---|
| `enforce.flow !== true` | 何もしない（素通り） |
| 有効な `merge_approved_at` がある | 素通り |
| loop-state はあるが `merge_approved_at` が無い | `deny` |
| loop-state はあるが `stale` / `invalid` | `deny` |
| 対象 PR の loop-state が見つからない | `ask` |

## Test Strategy

- [ ] `merge_approved_at` の無い計画の PR に対し `gh pr merge 24 --merge` が deny され、理由に「`dev-cleanup` Step 3 のゲートを経由してください」が含まれる
- [ ] 直前に `merge_approved_at` を書いた計画の PR では素通りする
- [ ] 25 時間前の `merge_approved_at` では deny され、理由が「古い」旨を含む
- [ ] 対応する loop-state が無い PR 番号では `ask`（deny ではない）になる
- [ ] `enforce.flow: false` にすると一切介入しない
- [ ] `.claude/enso.json` が無いプロジェクトでは無出力で exit 0（既存の保証を壊していない）
- [ ] エッジケース: `echo "gh pr merge"` のような偽陽性で発火しない（既存の `segments()` / トークン判定に載せる）
- [ ] エッジケース: `gh pr merge` （対象省略）で現在のブランチの計画が使われる
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: `hooks/guard-bash.mjs` の `gh pr ready` 検査ブロック（`matchesGhCommand(segment, "ready")` と `hasSecurityReport()`）。**同じ形に揃える**と実装の追加コストが小さい（Issue の補助案）
- `matchesGhCommand(segment, "merge")` がそのまま使える
- 対象の解決は `gitState(cwd).topLevel` を基準にする。`policy.projectRoot`（設定ファイルの位置）ではない
- PR の指定は番号のほか URL / ブランチ名も取りうる。URL の場合は末尾の数字を番号として拾う
- `emitDecision(mode, reason)` を使う。`ask` に落とすケースは既存の破壊的操作ガードと同様に第1引数へ直接 `"ask"` を渡す
- deny メッセージには「この制約は .claude/enso.json（enforce.flow）によるものです」を含め、既存メッセージの体裁に合わせる
- hooks の3原則（jq 非依存 / 必ず exit 0 / 基準は `git rev-parse --show-toplevel`）を守る
- **003 とセットで入れる。** 002 だけ入れると `dev-cleanup` が記録を書かないため、マージが常に deny される

## Files

- 変更: `hooks/guard-bash.mjs`
