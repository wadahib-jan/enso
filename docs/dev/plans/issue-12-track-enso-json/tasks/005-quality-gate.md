---
id: "005"
title: "品質ゲートとドキュメント整合を確認する"
status: done
priority: 5
dependencies: ["001", "002", "003", "004"]
estimated_complexity: low
---

# Task: 品質ゲートとドキュメント整合を確認する

## Goal

001〜004 の変更が enso の品質ゲートを通り、Issue #12 の症状が実際に解消していることを確認する。

## Interfaces

このリポジトリの品質ゲート（`docs/dev/context.md` より、テストランナーは未導入）:

```bash
pnpm secretlint   # 機密情報の検査                                      🔵
pnpm check        # Biome: フォーマット・Lint（対象は JSON と JS/TS のみ）🔵
bash -n scripts/sync-after-merge.sh   # .sh は Biome 対象外のため個別に  🔵
claude plugin validate .              # マニフェストの検証（任意）        🟡
```

## Test Strategy

- [ ] `pnpm secretlint` がエラーなしで終了する
- [ ] `pnpm check` がエラーなしで終了する（`.claude/enso.json` の整形を含む。落ちたら `pnpm check:fix`）
- [ ] `bash -n scripts/sync-after-merge.sh` が構文エラーを出さない
- [ ] Issue の再現手順が解消している: `git status --short --untracked-files=all -- .claude` が `?? .claude/enso.json` を出力しない
- [ ] `skills/enso-policy/SKILL.md` が 500 行以内である
- [ ] `skills/enso-policy/references/` に新規ファイルが作られていない（手順は `SKILL.md` に直書きする方針）
- [ ] `skills/enso-policy/` 配下がネストしたスキルディレクトリを作っていない（`references/` は許容）
- [ ] `set` サブコマンドを追加していない（今回スコープ外）
- [ ] `enable` / `disable` の挙動を変えていない（今回スコープ外。従来どおりファイル書き換えのみ）
- [ ] `.claude-plugin/plugin.json` を変更していない（スキルの増減が無いため不要）
- [ ] `hooks/` 配下を変更していない（本 Issue は hooks のロジック不具合ではない）
- [ ] `SKILL.md` の設定スキーマ表・`references/enso.json.template`・`hooks/lib/policy.mjs` の `DEFAULT_ENFORCE` の3者でキーと既定値が一致している
- [ ] 変更ファイルが `skills/enso-policy/**` / `.claude/enso.json` / `scripts/sync-after-merge.sh` / `README.md` / `MANUAL.md` と計画成果物のみに収まっている

## Implementation Notes

- 参照すべき既存コード: `docs/dev/context.md`（Test Framework セクション）、`.github/workflows/ci.yml`（CI も同じ2コマンド）
- 実装のヒント:
  - pre-commit フック（simple-git-hooks）が `pnpm secretlint && pnpm check` を自動実行するため、コミット時点で大半は検証される。`bash -n` だけがゲートの外にある
  - **この worktree では pre-commit フックが Issue #10 で失敗する**（`simple-git-hooks` が worktree の `.git/hooks` を作れない）。その場合は `./node_modules/.bin/biome check .` と `./node_modules/.bin/secretlint` を直接実行して確認し、`--no-verify` でコミットする
- 注意事項:
  - フックは `node_modules` を必要とする。worktree で未インストールなら先に `pnpm install` を行う
  - `./scripts/install-local.sh` による投入は**このタスクでは行わない**。投入は全プロジェクトに即座に効くため、PR がマージされたあとに行う
  - 3者（`DEFAULT_ENFORCE` / 雛形 / `SKILL.md` の表）のスキーマ一致確認は目視で行う

## Files

- 変更: なし（検証のみ）
- 新規: なし
- テスト: なし（テストランナー未導入）
