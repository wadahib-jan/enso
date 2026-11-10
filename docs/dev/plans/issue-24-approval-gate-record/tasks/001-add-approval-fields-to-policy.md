---
id: "001"
title: "policy.mjs に承認記録の読み取り基盤を追加"
status: done
priority: 1
dependencies: []
estimated_complexity: medium
---

# Task: policy.mjs に承認記録の読み取り基盤を追加

## Goal

`loop-state.yaml` の承認フィールドを読めるようにし、「対象 PR の loop-state を引く」「承認記録が有効か判定する」の2つを `hooks/lib/policy.mjs` に共有ロジックとして置く。

## Interfaces

```js
// 既存の LOOP_STATE_FIELDS に2件追加する 🔵
const LOOP_STATE_FIELDS = [
  "plan_name",
  "status",
  "branch",
  "worktree",
  "pr_number",
  "pr_url",
  "merge_approved_at",
  "impl_approved_at",
];

/**
 * PR 番号 / ブランチ名に対応する loop-state を1件返す。 🟡
 * pr_number の一致を優先し、無ければ branch の一致で探す。
 * どちらも当たらなければ null。
 */
export function findLoopStateForPr(projectRoot, { prNumber, branch });

/**
 * 承認記録の有効性を判定する。 🟡
 * - 値が無い / 空 → "missing"
 * - Date として解釈できない → "invalid"
 * - now より maxAgeHours より前 → "stale"
 * - それ以外 → "ok"
 * 未来日時は "ok" として扱う（時計ずれで正当な承認を弾かないため）
 */
export function approvalStatus(isoString, { maxAgeHours = 24, now = Date.now() } = {});
```

## Test Strategy

このリポジトリに単体テストは無い。以下を**検証可能な確認項目**として手で確認する。

- [ ] `merge_approved_at: 2026-09-08T12:00:00Z` を含む `loop-state.yaml` を `findLoopStates()` で読むと、その値が state に入る
- [ ] `findLoopStateForPr(root, { prNumber: "24" })` が `pr_number: 24` の計画を返す
- [ ] `findLoopStateForPr(root, { prNumber: null, branch: "worktree-x" })` が `branch: worktree-x` の計画を返す
- [ ] 該当が無いとき `findLoopStateForPr` が `null` を返す（例外を投げない）
- [ ] `approvalStatus(undefined)` → `"missing"` / `approvalStatus("なにか")` → `"invalid"`
- [ ] エッジケース: 25 時間前の ISO8601 → `"stale"` / 23 時間前 → `"ok"` / 未来の日時 → `"ok"`
- [ ] `docs/dev/plans` が存在しないプロジェクトでも例外にならず `null` を返す
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: `hooks/lib/policy.mjs` の `findLoopStates()` / `LOOP_STATE_FIELDS`
- `findLoopStates()` はフラットなスカラーだけを正規表現で拾う軽量実装。**この方針を崩さない**（YAML パーサを足さない）
- `pr_number` は YAML 上は数字だが、正規表現で読むので**文字列**として入る。比較は `String(prNumber)` で揃える
- hooks の3原則を守る:
  - **jq に依存しない**（Node のみ）
  - **必ず exit 0 で終える**（`runHook()` に包まれる前提を壊さない）
  - **内容の基準は `git rev-parse --show-toplevel`**（`gitState().topLevel`）。設定ファイルの位置ではない
- 例外を投げない。読めなければ `null` / `"missing"` を返す（呼び出し側が安全側に倒す）

## Files

- 変更: `hooks/lib/policy.mjs`
