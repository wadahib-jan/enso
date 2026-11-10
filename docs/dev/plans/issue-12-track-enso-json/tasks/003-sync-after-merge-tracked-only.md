---
id: "003"
title: "sync-after-merge.sh の本体未コミット判定を追跡済みファイルに絞る"
status: done
priority: 4
dependencies: []
estimated_complexity: low
---

# Task: sync-after-merge.sh の本体未コミット判定を追跡済みファイルに絞る

## Goal

`scripts/sync-after-merge.sh` の**本体チェックアウトに対する**未コミット判定を「追跡済みファイルに変更があるか」に絞り、gitignore 漏れの未追跡ファイル1件で後始末全体が止まらないようにする。Issue #12 の「補足: 判定の粒度についての提案」への対応。

## Interfaces

変更対象は2箇所ある判定のうち **1箇所だけ**。

```bash
# ── 51行目付近: 本体チェックアウトの判定 ─────────── ★変更する 🟡
if [[ -n "$(git_main status --porcelain --untracked-files=no)" ]]; then
  echo "✘ $MAIN に未コミットの変更があります。退避してから再実行してください。" >&2
  git_main status --short --untracked-files=no >&2
  exit 1
fi

# ── 119行目付近: 削除対象 worktree の判定 ───────── ★変更しない 🔵
if [[ -n "$(git -C "$WT" status --porcelain 2>/dev/null)" ]]; then
  SKIPPED+=("$branch (worktree $WT に未コミットの変更)")
fi
```

> 信号機:
> - 🟡 本体側を絞ること — Issue が「検討の余地がある」として提案した内容。採否はレビュー時の論点
> - 🔵 worktree 側を変えないこと — `git worktree remove` は未追跡ファイルごと削除するため、ここで未追跡を無視すると**ユーザーのデータを失う**。絶対に同じ変更を適用しない

## Test Strategy

- [ ] 本体に未追跡ファイルのみがある状態で実行すると、未コミット判定で中断せず先へ進む
- [ ] 本体に追跡済みファイルの変更（未ステージ）がある状態で実行すると、従来どおり中断し `✘ ... 未コミットの変更があります` を出力する
- [ ] 本体にステージ済みで未コミットの変更がある状態で実行すると、従来どおり中断する（`--untracked-files=no` はステージ済み変更を隠さない）
- [ ] 中断時に表示される `status --short` の出力にも `--untracked-files=no` が適用され、無関係な未追跡ファイルが列挙されない
- [ ] worktree 側の判定（119行目付近）が変更されておらず、未追跡ファイルを持つ worktree は従来どおり skip される
- [ ] `--dry-run` で実行しても上記の判定挙動が変わらない
- [ ] `bash -n scripts/sync-after-merge.sh` が構文エラーを出さない

## Implementation Notes

- 参照すべき既存コード: `scripts/sync-after-merge.sh`（本体判定は 50〜55 行目、worktree 判定は 119〜122 行目。PR #13 のマージで行番号が下にずれた）
- 実装のヒント:
  - `git_main` ヘルパ（`git -C "$MAIN" "$@"`）が既にあるので、それに引数を足すだけで済む
  - 判定コマンドと表示コマンドの**両方**に `--untracked-files=no` を付ける。片方だけだと「中断理由が表示に出ない／出すぎる」ちぐはぐな挙動になる
  - なぜ本体だけ絞るのかを1〜2行のコメントで残す（fetch / ff-only pull / ブランチ削除は未追跡ファイルを失わせないが、`worktree remove` は失わせる）
- 注意事項:
  - **Biome の対象は JSON と JS/TS のみ。** `.sh` は対象外なので `pnpm check` では検証されない。`bash -n` による構文確認を必ず行う
  - このタスクは他と独立。Issue の根本対応（002）が済めば実害は消えるので、**レビューで不要と判断されたら落としてよい**
  - **PR #13 はマージ済み。** あちらも `scripts/sync-after-merge.sh` を変更した（リモートブランチ削除の追加、`PROTECTED_BRANCHES` の導入）が、**未コミット判定の2箇所には触れていない**。本タスクは依然として有効で、内容の競合は無い。行番号だけがずれた
  - 追加されたリモートブランチ削除（`git push origin --delete`）も未追跡ファイルを失わせないため、本体判定を絞る根拠は変わらない

## Files

- 変更: `scripts/sync-after-merge.sh`
- 新規: なし
- テスト: なし（テストランナー未導入）
