---
id: "010"
title: "sync-after-merge.sh にリモートブランチ削除を追加する"
status: done
priority: 3
dependencies: ["002"]
estimated_complexity: low
---

# Task: sync-after-merge.sh にリモートブランチ削除を追加する

## Goal

`dev-cleanup` の汎用経路にはリモートブランチ削除があるのに、委譲先の `scripts/sync-after-merge.sh` には無い。**enso 経路だけこの処理が抜ける**という非対称を解消する。

## Interfaces

追加位置: 🔵

マージ済みブランチの削除ループ内、ローカルブランチ削除の直後。

```bash
  DELETED+=("$branch")

  if git_main ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
    echo "    リモートブランチを削除: origin/$branch"
    if run git -C "$MAIN" push origin --delete "$branch"; then
      REMOTE_DELETED+=("$branch")
    else
      SKIPPED+=("$branch (リモートブランチの削除に失敗)")
    fi
  fi
```

設計上の判断: 🔵

| 判断 | 理由 |
|---|---|
| 対象はループが「マージ済み」と判定したものだけ | 未マージのブランチに触らないという既存の原則を崩さない |
| `ls-remote --exit-code` で存在確認してから削除 | 既に消えているブランチへの `push --delete` はエラーになる |
| 失敗してもスクリプトを止めない（`if ! ...`） | `set -e` 下で push が失敗すると、ローカル削除だけ済んだ中途半端な状態で異常終了する |
| サマリに `REMOTE_DELETED` を追加 | 何が消えたかを利用者が確認できるようにする |

必要性の根拠: 🔵

```
$ gh api repos/yukimnb/enso --jq '.delete_branch_on_merge'
false
```

GitHub の自動削除が無効なため、マージ後もリモートブランチが溜まり続ける。

## Test Strategy

- [ ] `bash -n scripts/sync-after-merge.sh` が通る
- [ ] マージ済みでリモートに存在するブランチが削除される
- [ ] `main`（削除対象外）が残る
- [ ] リモートに存在しないブランチでは `push --delete` を実行しない（エラーにならない）
- [ ] `REMOTE_DELETED` に削除したブランチだけが入る
- [ ] `--dry-run` では実際に削除しない
- [ ] 異常系: push が失敗してもスクリプトが異常終了せず、`SKIPPED` に記録される
- [ ] `set -u` 下で `REMOTE_DELETED` が空でもサマリ出力が壊れない
- [ ] `CLAUDE.md` の `sync-after-merge.sh` の説明に追記されている
- [ ] `skills/dev-cleanup/SKILL.md` の委譲の記述が更新されている
- [ ] **保護ブランチ（`main` / `master` / `develop`）が削除対象から除外される**（セキュリティチェックの指摘5）
- [ ] `develop` が `main` の祖先の位置にあっても削除されない

## Implementation Notes

- 参照すべき既存コード: `scripts/sync-after-merge.sh` のマージ済みブランチ削除ループ（86行付近の配列宣言、113行付近の削除処理、161行付近のサマリ）
- **`set -euo pipefail` 下であることに注意。** `if ! cmd` の形なら errexit は発火しない
- 配列の空判定は既存の `${SKIPPED[@]:-}` パターンに合わせる
- 検証はスクラッチの git リポジトリ（bare リモート付き）で行う。**本リポジトリでの実行は Issue #12（未追跡の `.claude/enso.json`）でブロックされる**

## Files

- 変更: `scripts/sync-after-merge.sh`
- 変更: `CLAUDE.md`
- 変更: `skills/dev-cleanup/SKILL.md`
