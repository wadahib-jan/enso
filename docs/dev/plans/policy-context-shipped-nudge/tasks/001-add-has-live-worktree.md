---
id: "001"
title: "policy.mjs に hasLiveWorktree() を追加する"
status: done
priority: 1
dependencies: []
estimated_complexity: low
---

# Task: policy.mjs に hasLiveWorktree() を追加する

## Goal

`loop-state` が指す worktree がまだ実在するかを返す述語を `hooks/lib/policy.mjs` に追加する。「`status` は `shipped` だがまだ後始末が済んでいない計画」を見分けるための唯一の判別材料になる。

## Interfaces

```js
/**
 * loop-state が指す worktree がまだ実在するか。
 *
 * 後始末（dev-cleanup / sync-after-merge.sh）が済むと worktree は削除されるため、
 * 「status は shipped だがまだ片付いていない」計画をこれで見分ける。
 * merge_approved_at は判別に使えない（マージゲート導入前の計画が持たないため）。
 *
 * @param {{worktree?: string}} state - findLoopStates() が返す要素
 * @returns {boolean}
 */
export function hasLiveWorktree(state) {
  // 🔵 値の無い / 壊れた loop-state.yaml でも例外を投げず false を返す
  // 🔵 existsSync は既に node:fs から import 済み
}
```

配置は `findLoopStates()` の直後（同じ loop-state 関連の関数群にまとめる）。🔵

> 信号機: すべて 🔵。`worktree` は `LOOP_STATE_FIELDS` に含まれ読み取り済み、`existsSync` は import 済みであることを確認済み

## Test Strategy

- [ ] `hasLiveWorktree({ worktree: "<実在する絶対パス>" })` が `true` を返す
- [ ] `hasLiveWorktree({ worktree: "/nonexistent/path" })` が `false` を返す
- [ ] エッジケース: `hasLiveWorktree({})` — `worktree` フィールドが無い（古い `loop-state.yaml`）→ `false`、例外を投げない
- [ ] エッジケース: `hasLiveWorktree({ worktree: "" })` — 空文字 → `false`、例外を投げない
- [ ] エッジケース: `hasLiveWorktree(undefined)` — 呼び出し側のバグで state 自体が無い → `false`、例外を投げない
- [ ] エッジケース: `worktree` が文字列でない（数値・オブジェクト）→ `false`、例外を投げない

検証は `node --input-type=module -e "import(...)"` か、一時スクリプトから import して実行する。

## Implementation Notes

- 参照すべき既存コード: `hooks/lib/policy.mjs:198-224`（`findLoopStates()`）、`hooks/lib/policy.mjs:10`（`existsSync` の import）、`hooks/lib/policy.mjs:178-189`（`LOOP_STATE_FIELDS`）
- 実装のヒント: `existsSync` 自体は例外を投げないが、引数が文字列でないと TypeError になりうる。先に `typeof state?.worktree === "string" && state.worktree !== ""` で弾く
- 注意事項: **hook は必ず exit 0 で終える**（CLAUDE.md）。`runHook()` が例外を握り潰すとはいえ、述語が投げると誘導文が丸ごと消える。ここで防ぐ
- 相対パス解決（`resolve()`）は**行わない**。`dev-plan` Phase 5d が絶対パスを記録するため不要で、相対解決を入れると基準ディレクトリの取り違えで誤判定する

## Files

- 変更: `hooks/lib/policy.mjs`
