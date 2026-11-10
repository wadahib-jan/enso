---
id: "002"
title: "nextAction に failed / shipped の分岐と複数併記を実装する"
status: done
priority: 1
dependencies: ["001"]
estimated_complexity: medium
---

# Task: nextAction に failed / shipped の分岐と複数併記を実装する

## Goal

`nextAction()` に `failed` と `shipped` の分岐を追加し、該当するカテゴリをすべて提示するよう変更する。これが本 Plan の中心。

## Interfaces

```js
// hooks/policy-context.mjs

function nextAction(states, git, enforce) {
  // 戻り値は string のまま。該当が複数のときは改行区切りで返す 🟡
}
```

提示するカテゴリと優先順位:

| 順 | 条件 | 文面の趣旨 |
|---|---|---|
| 1 | `status === "awaiting-approval"` | 既存のまま変更しない 🔵 |
| 2 | `status === "running"` | 既存のまま変更しない 🔵 |
| 3 | `status === "failed"` かつ `hasLiveWorktree(state)` | 中断した計画がある。残存問題を確認する 🟡 |
| 4 | `status === "shipped"` かつ `hasLiveWorktree(state)` | **後始末が済んでいない。`dev-cleanup` を実行する** 🔵 |
| 5 | 上のいずれも該当なし | 既存のフォールバック2種（worktree 外 / 汎用）🔵 |

呼び出し側の描画:

```js
// 1件 → 現状と同じ1行
`次にすべきこと: ${action}`

// 2件以上 → 見出し + 箇条書き
`次にすべきこと:`
`- ${action1}`
`- ${action2}`
```

> 信号機: 🔵 は既存実装とデータで裏が取れている。🟡 は「複数併記にする」「failed を shipped より前に置く」という設計判断で、レビューで覆りうる

## Test Strategy

- [ ] `shipped` + worktree 実在の計画が1件 → `dev-cleanup` を促す文が出て、計画名が含まれる
- [ ] `shipped` だが worktree が無い計画のみ → **促さない**（汎用フォールバックに落ちる）
- [ ] `failed` + worktree 実在 → 残存問題の確認を促す文が出る。`dev-cleanup` を促す文言にはなっていない
- [ ] `awaiting-approval` と `shipped`(worktree 実在) が同時に存在 → **両方が箇条書きで出る**（どちらも消えない）
- [ ] 該当1件のみのとき → 従来どおり `次にすべきこと: <文>` の1行形式（箇条書きにならない）
- [ ] 同一カテゴリが複数件 → 既存の awaiting / running と同じくカンマ区切りで計画名が並ぶ
- [ ] エッジケース: `states` が空配列 → 既存のフォールバックが出る。例外を投げない
- [ ] エッジケース: `status` が未知の値（`unknown` など）→ どのカテゴリにも入らず無視される

## Implementation Notes

- 参照すべき既存コード: `hooks/policy-context.mjs:60-84`（`nextAction()`）、`hooks/policy-context.mjs:110`（`次にすべきこと:` の描画箇所）
- 実装のヒント: 既存の awaiting / running は `filter` → `map` → `join(", ")` で名前を並べている。同じ書き方を踏襲する。カテゴリ定義を配列にまとめると分岐の重複が減る
- 注意事項:
  - **既存2カテゴリの文面と順序を変えない。** 変えると既存の挙動に対する回帰になる
  - `enforce.worktree` / 汎用のフォールバック2種は「該当カテゴリが1つも無いとき」にのみ出す。カテゴリと併記しない
  - 描画の変更は `sections` を組み立てている箇所（`runHook` 内）に及ぶ。`nextAction` が改行を含む文字列を返す前提で、配列に push する形へ直す

## Files

- 変更: `hooks/policy-context.mjs`
