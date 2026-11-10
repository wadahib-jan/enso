---
id: "003"
title: "fixture と実データで4状態の注入内容を検証する"
status: done
priority: 2
dependencies: ["002"]
estimated_complexity: medium
---

# Task: fixture と実データで4状態の注入内容を検証する

## Goal

hook を直接実行して、状態ごとに期待どおりの誘導文が出ることを確認する。テストフレームワークが無いため、これが唯一の回帰検出手段になる。

## Interfaces

検証コマンド（動作確認済み）:

```bash
echo '{"cwd":"<projectRoot>"}' | node hooks/policy-context.mjs
```

`hookSpecificOutput.additionalContext` を含む JSON が標準出力に出て **exit 0** になる。🔵

fixture の最小構成（スクラッチパッドに作る）:

```
<fixture>/
├── .claude/enso.json              # enforce.enabled, enforce.flow を true に
└── docs/dev/plans/<name>/loop-state.yaml
```

`loop-state.yaml` の `worktree` に、実在するディレクトリ／実在しないパスを書き分けて状態を作る。🔵

> 信号機: 🔵。検証手段は実行して確認済み

## Test Strategy

fixture で作る状態と期待結果:

- [ ] `shipped` + `worktree` が実在 → `dev-cleanup` を促す文と計画名が出る
- [ ] `shipped` + `worktree` が実在しない → 促さない（汎用フォールバック）
- [ ] `shipped` + `worktree` フィールド自体が無い → 促さない。**exit 0 で、出力が壊れていない**
- [ ] `failed` + `worktree` が実在 → 残存問題の確認を促す文が出る
- [ ] `awaiting-approval` + `shipped`(実在) の2件 → 箇条書きで両方出る
- [ ] 該当1件 → 1行形式（`次にすべきこと: ` に続けて出る）

実データ（このリポジトリ）での確認:

- [ ] 本リポジトリを `cwd` に渡すと、**16件の `shipped` はいずれも促されない**（worktree が残っていないため）。一覧表示（`describeState`）には従来どおり16件が並ぶ
- [ ] 本 Plan 自身が `awaiting-approval` になった状態で、承認待ちの誘導が出る

エッジケース:

- [ ] `.claude/enso.json` が無いディレクトリを `cwd` に渡すと**無出力で exit 0**（設定の無いプロジェクトに影響しないという保証の確認）
- [ ] 壊れた `loop-state.yaml`（YAML として不正な行）があっても exit 0 で、他の計画の誘導は出る

## Implementation Notes

- 参照すべき既存コード: `hooks/lib/policy.mjs`（`loadPolicy` / `findLoopStates` / `readHookInput`）、`.claude/enso.json`
- 実装のヒント:
  - fixture はスクラッチパッド（`/tmp/claude-1000/.../scratchpad`）に作る。リポジトリ内に置くと `findLoopStates` が拾って他の検証を汚す
  - `worktree` が実在する状態を作るには、fixture 内に適当なディレクトリを掘ってその絶対パスを書けばよい（git worktree である必要は無い。述語は存在確認しかしない）
  - 結果は目視で足りるが、期待文字列を `grep` で確認すると回帰検出になる
- 注意事項: 検証スクリプトを**リポジトリにコミットしない**。テストフレームワークを導入しない方針のため、手順は本タスクファイルとレポートに残す

## Files

- 変更: なし（検証のみ。不整合が見つかった場合は 001 / 002 のファイルを修正する）
- 一時: スクラッチパッド配下の fixture（コミットしない）
