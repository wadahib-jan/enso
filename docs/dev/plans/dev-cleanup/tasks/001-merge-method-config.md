---
id: "001"
title: "enforce.mergeMethod を設定スキーマに追加する"
status: done
priority: 1
dependencies: []
estimated_complexity: low
---

# Task: enforce.mergeMethod を設定スキーマに追加する

## Goal

`.claude/enso.json` の `enforce` に `mergeMethod` を新設し、`dev-cleanup` がマージ方式をプロジェクトごとに決められるようにする。既定は `merge`。

## Interfaces

設定値: 🔵

```json
{
  "enforce": {
    "mergeMethod": "merge"
  }
}
```

| 値 | `gh pr merge` のフラグ | 備考 |
|---|---|---|
| `merge` | `--merge` | **既定**。このリポジトリの既存履歴に合わせる |
| `squash` | `--squash` | |
| `rebase` | `--rebase` | |

`hooks/lib/policy.mjs` の `DEFAULT_ENFORCE`: 🔵

```js
const DEFAULT_ENFORCE = {
  // ...既存キー
  baseBranch: "main",
  mergeMethod: "merge",   // 追加。hook はこの値を参照しない
  protectedBranches: ["main", "master", "develop"],
  // ...
};
```

## Test Strategy

- [ ] `skills/enso-policy/references/enso.json.template` に `"mergeMethod": "merge"` が含まれ、JSON として妥当（`pnpm check` が通る）
- [ ] `skills/enso-policy/SKILL.md` の「設定スキーマ」表に `mergeMethod` の行があり、既定値と3つの取りうる値が書かれている
- [ ] `skills/enso-policy/SKILL.md` の init の質問（ワークフロー Step 3）にマージ方式の確認が追加されている
- [ ] `MANUAL.md` の強制モードの設定表と JSON 例に `mergeMethod` が反映されている
- [ ] `hooks/lib/policy.mjs` の `DEFAULT_ENFORCE` に `mergeMethod: "merge"` が追加されている
- [ ] 異常系: **hook の挙動が変わっていない。** `mergeMethod` を参照する分岐を hooks に追加していないこと（`grep -rn "mergeMethod" hooks/` が `DEFAULT_ENFORCE` の1行のみ）
- [ ] エッジケース: `enso.json` に `mergeMethod` が無い既存プロジェクトでも、`DEFAULT_ENFORCE` とのマージで `merge` が入ること（`loadPolicy` は `{ ...DEFAULT_ENFORCE, ...parsed.enforce }` で合成している）

## Implementation Notes

- 参照すべき既存コード:
  - `hooks/lib/policy.mjs` の `DEFAULT_ENFORCE`（15-25行付近）— キーの並び順は既存に合わせ、`baseBranch` の次に置く
  - `skills/enso-policy/SKILL.md` の「設定スキーマ」表と「ワークフロー > init」
  - `skills/enso-policy/references/enso.json.template`
  - `MANUAL.md` の「強制モード > 設定ファイル」
- **hooks に分岐を足さない。** `DEFAULT_ENFORCE` への追加はスキーマの一貫性のためだけ。hook のバグでセッションが止まるのが最悪のシナリオなので、挙動に触れる変更は避ける
- `dev-cleanup`（タスク 002）はこのキーを読むが、`enso.json` が無い場合は既定 `merge` で動く必要がある

## Files

- 変更: `hooks/lib/policy.mjs`
- 変更: `skills/enso-policy/SKILL.md`
- 変更: `skills/enso-policy/references/enso.json.template`
- 変更: `MANUAL.md`
