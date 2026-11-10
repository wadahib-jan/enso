---
id: "001"
title: "policy.mjs に resolveEnforce を切り出す"
status: done
priority: 1
dependencies: []
estimated_complexity: low
---

# Task: policy.mjs に resolveEnforce を切り出す

## Goal

`hooks/lib/policy.mjs` の設定探索と `DEFAULT_ENFORCE` マージを `resolveEnforce()` として公開し、`enforce.enabled` の状態に関わらず完全な enforce 値を取得できるようにする。`loadPolicy()` はその上に `enabled` チェックを乗せる形に書き換え、**hooks から見た挙動は一切変えない**。

## Interfaces

```js
/**
 * cwd から上方向に .claude/enso.json を探し、DEFAULT_ENFORCE とマージした値を返す。
 * 設定が無い / 壊れている場合も DEFAULT_ENFORCE をそのまま返す（null にしない）。
 */
export function resolveEnforce(cwd) {
  // → { enforce, configPath, projectRoot }
  //    configPath: 読めた設定のパス。見つからない / JSON が壊れている場合は null  🔵
  //    projectRoot: 設定が見つかったディレクトリ。見つからなければ resolve(cwd)   🟡
}

/** 既存。シグネチャ・戻り値ともに変更しない。 */
export function loadPolicy(cwd) {
  // resolveEnforce を呼び、configPath が null なら null       🔵
  // enforce.enabled !== true なら null                        🔵
  // それ以外は { enforce, configPath, projectRoot }            🔵
}
```

## Test Strategy

- [ ] `.claude/enso.json` を持つディレクトリで `resolveEnforce()` を呼ぶと、`enforce.protectedBranches` が設定値になり、未指定のキー（例 `exclude`）は `DEFAULT_ENFORCE` の値で埋まる
- [ ] `enabled: false` の設定に対して `resolveEnforce()` は設定値を返し、同じ cwd で `loadPolicy()` は `null` を返す（＝分岐が正しく分かれている）
- [ ] 設定ファイルがどこにも無いパス（例 `/tmp` 配下の空ディレクトリ）で `resolveEnforce()` を呼ぶと `configPath: null`、`enforce` は `DEFAULT_ENFORCE` と等価
- [ ] JSON が壊れた設定に対し、`resolveEnforce()` は stderr に `enso: ... の JSON を読めません` を出し、`configPath: null` と既定値を返す（例外を投げない）
- [ ] 回帰: `enabled: true` の設定（本リポジトリの `.claude/enso.json`）で `loadPolicy()` の戻り値が変更前と同じ構造・同じ値であること
- [ ] `pnpm check` が通る（Biome は `.mjs` を対象にする）

## Implementation Notes

- 参照すべき既存コード: `hooks/lib/policy.mjs` の `loadPolicy`（49-72 行）と `DEFAULT_ENFORCE`（15-27 行）
- 探索ループ（`.claude/enso.json` を上方向に辿る）は `resolveEnforce` にそのまま移し、`loadPolicy` からは消す。**ロジックを複製しない**
- JSON パース失敗時の stderr メッセージは現行の文言を維持する（hooks の出力が変わらないようにする）
- hooks の3原則を守る: **`jq` に依存しない**（Node でパース）／呼び出し元の hook は `runHook()` により**必ず exit 0**／内容の基準は `git rev-parse --show-toplevel`（`gitState().topLevel`）であり、設定ファイルの位置ではない。本タスクは設定読み取り層のみを触り、この基準を変えない
- `DEFAULT_ENFORCE` は他所から書き換えられないよう、返す `enforce` は毎回新しいオブジェクト（スプレッド）にする
- 検証は `node --input-type=module -e '...'` の使い捨てスニペットで行う。テストランナーは導入しない

## Files

- 変更: `hooks/lib/policy.mjs`
- テスト: なし（このリポジトリに単体テストは存在しない。上記 Test Strategy を手動確認する）
