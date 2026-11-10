---
id: "002"
title: "enso 本体の .claude/enso.json を git 追跡下に置く"
status: done
priority: 2
dependencies: []
estimated_complexity: low
---

# Task: enso 本体の .claude/enso.json を git 追跡下に置く

## Goal

Issue #12 が名指しした実害（enso 自身のリポジトリで `.claude/enso.json` が未追跡）を解消する。これにより `scripts/sync-after-merge.sh` が実行できるようになり、worktree にも設定が複製されるようになる。

## Interfaces

追跡対象にするファイルの内容（本体チェックアウトの現行値）:

```json
{
  "enforce": {
    "enabled": true,
    "mode": "deny",
    "worktree": true,
    "flow": true,
    "security": true,
    "skills": ["dev-plan", "dev-loop", "ipa-security-check"],
    "baseBranch": "main",
    "mergeMethod": "merge",
    "protectedBranches": ["main", "master", "develop"],
    "exclude": ["docs/**", "*.md", ".claude/**", ".gitignore"]
  }
}
```

> 信号機:
> - 🔵 既存の9キー — 本体の現行値をそのまま追跡下に入れる。**値は変更しない**
> - 🟡 `mergeMethod: "merge"` の**追加** — 本体の現行ファイルにはこのキーが無い（PR #13 より前に作られたため）。`DEFAULT_ENFORCE` が `"merge"` を補うので**無くても動作は同じ**だが、追跡下に置いて正典にする以上、雛形（`references/enso.json.template`）と同じ全キー列挙に揃えるのが妥当と判断した。既定値と同値なので挙動は変わらない

**この1点だけ「現行値そのまま」から外れる。** 揃えない判断（現行9キーのまま追跡する）も成立するので、レビューで覆してよい。

## Test Strategy

- [ ] `git ls-files .claude/enso.json` が `.claude/enso.json` を出力する（追跡下にある）
- [ ] `git status --short --untracked-files=all -- .claude` が `?? .claude/enso.json` を出力しない
- [ ] 追跡下に入れた内容が本体チェックアウトの現行値と一致する（`enabled: true`、`mode: "deny"`、`exclude` 4件などが保たれている）
- [ ] `mergeMethod: "merge"` が含まれ、キー順が `references/enso.json.template` と同じである（`baseBranch` の次、`protectedBranches` の前）
- [ ] `git check-ignore -v .claude/enso.json` が何も出力しない（ignore されていないことの確認）
- [ ] `.gitignore` の `.claude/settings.local.json` と `.claude/worktrees/` の2行が残っている
- [ ] `.claude/settings.local.json` を誤って追跡下に入れていない（`git ls-files .claude/` の出力が `enso.json` のみであること）
- [ ] JSON として妥当で、Biome の JSON 整形を通る

## Implementation Notes

- 参照すべき既存コード: `skills/enso-policy/references/enso.json.template`（全キーの既定値。現行ファイルとの差分確認に使う）
- 実装のヒント:
  - **この worktree には `.claude/enso.json` が存在しない。** 未追跡ファイルは `git worktree add` で複製されないため。本体チェックアウト（`/workspace/enso`）から内容をコピーして、この worktree 側で作成・追跡する
  - 本体チェックアウトのパスは `git worktree list --porcelain` の最初のエントリで取得できる
  - add の対象は `.claude/enso.json` のみ。`.claude/` をディレクトリごと add しない
- 注意事項:
  - **Biome の JSON 整形対象。** インデント・改行が設定と合っているか確認し、合わなければ `pnpm check:fix` で整形する
  - このファイルに機密情報は含まれないが、secretlint を通して確認する
  - `.claude/worktrees/` は ignore 済みなので、この worktree 自身が追跡対象に混ざることはない

## Files

- 新規: `.claude/enso.json`（本 worktree 内。本体では既存の未追跡ファイルを追跡下に移す扱い）
- 変更: なし
- テスト: なし（テストランナー未導入）
