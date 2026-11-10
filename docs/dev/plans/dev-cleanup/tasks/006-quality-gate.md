---
id: "006"
title: "品質ゲートとマニフェスト検証を通す"
status: done
priority: 4
dependencies: ["001", "002", "003", "004", "005", "007", "008", "009"]
estimated_complexity: low
---

# Task: 品質ゲートとマニフェスト検証を通す

## Goal

追加・変更した全ファイルが品質ゲートを通過し、プラグインとして正しく読み込めることを確認する。

## Interfaces

実行するコマンド: 🔵

```bash
pnpm secretlint
pnpm check                             # JSON を触るので今回は特に重要
claude plugin validate .
./scripts/install-local.sh --dry-run
```

## Test Strategy

- [ ] `pnpm secretlint` が成功する
- [ ] `pnpm check` が成功する（`enso.json.template` と `policy.mjs` を変更しているため Biome の対象）
- [ ] `claude plugin validate .` が成功する
- [ ] `./scripts/install-local.sh --dry-run` の差分に `skills/dev-cleanup/` が現れ、**削除される項目が無い**
- [ ] `skills/dev-cleanup/SKILL.md` が `skills/` 直下1階層に置かれている
- [ ] `grep -rn "mergeMethod" hooks/` の結果が `DEFAULT_ENFORCE` の1行のみ（`mergeMethod` で hook の挙動を変えていない）
- [ ] タスク 008 のガード緩和後も、`git commit` / 通常の `git push` が worktree 外で **deny される**（緩和が広がりすぎていない）
- [ ] `enforce.enabled: false` のプロジェクトで全 hook が**無出力で終了する**（既存の保証を壊していない）
- [ ] 承認ゲートが `dev-plan` 後と `dev-loop` 後の**2箇所だけ**で、`enso-issue-fix` 経由でも二重に出ない
- [ ] `.claude-plugin/plugin.json` を変更していない
- [ ] `grep -rn "gh pr checks" skills/` の結果が「使わない」文脈のみ（実行手順として残っていない）
- [ ] `grep -rn "公開リポジトリ" skills/` が 0 件（タスク 007 の訂正が漏れていない）
- [ ] エッジケース: `enso.json.template` が JSON として妥当（`node -e` でパースできる）

## Implementation Notes

- このリポジトリに単体テストは存在しない。`pnpm secretlint && pnpm check` が実質のテスト
- **Issue #10 の既知問題**（worktree 内で `prepare`（simple-git-hooks）が `ENOTDIR` で落ちる）を踏むので、事前に `pnpm install --ignore-scripts` を通しておく
- `install-local.sh` は `rsync --delete` なので `--dry-run` で差分だけ確認する。**実際の投入は行わない**（PR マージ後に `dev-cleanup` 自身が行う）
- **`dev-cleanup` の実地実行は行わない。** 実際に走らせると PR がマージされ worktree が消える。初回の実適用は本 PR のマージ時が自然

## Files

- 変更: なし（検証のみ）
- 出力: `docs/dev/plans/dev-cleanup/reports/` に検証結果
