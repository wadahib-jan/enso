---
id: "004"
title: "README / MANUAL に init の PR 化を反映"
status: done
priority: 4
dependencies: ["001"]
estimated_complexity: low
---

# Task: README / MANUAL に init の PR 化を反映

## Goal

`init` が設定ファイルを追跡下に置き PR まで作るようになったことを利用者向けドキュメントに反映する。`CLAUDE.md` が「利用者向けのコマンド一覧は README.md、各コマンドの詳細は MANUAL.md」と定めているため、両方の更新が必要。

## Interfaces

更新箇所（実測済み）:

```
README.md:61   init を実行すると .claude/enso.json が作られる旨の説明
README.md:67   「無効化は /enso:enso-policy disable」
README.md:130  コマンド一覧表の enso-policy 行（PR #13 のマージで 129 → 130 にずれた）

MANUAL.md:33-36  サブコマンド一覧（行番号は PR #13 後も変わらず）
                 /enso:enso-policy init      # 対話で設定を作る
                 /enso:enso-policy show      # 現在の設定と、いま何がブロックされるかを確認
                 /enso:enso-policy disable   # 設定を残したまま一時的に無効化
                 /enso:enso-policy enable    # 再度有効化

MANUAL.md:91     運用上の注意の1項目目（★ PR #13 後に発見）
                 「.claude/enso.json は git 管理下に置いてください。
                   worktree にも複製され、チームで共有できます」
```

**MANUAL.md:91 は `SKILL.md` の ルール・制約 と同じ「利用者に手作業を求める」記述であり、Issue #12 が指摘した食い違いの片割れ。** `init` が自動で追跡下に置くようになる以上、ここも「`init` が自動で行う」に直さないと、ドキュメント間で矛盾が残る。

**サブコマンド一覧（33〜36行目）には行を追加しない。** `set` は今回スコープ外で、`init` / `show` / `disable` / `enable` の4つは変わらない。`init` のコメント文だけを、PR まで作ることが伝わる内容に見直す。

> 信号機: 🔵 — 既存の記述の書き換えのみ。新しい行や見出しは足さない

## Test Strategy

- [ ] `MANUAL.md:33` の `init` の説明が、設定ファイルが追跡下に入り PR が作られることを含む内容になっている
- [ ] `MANUAL.md` のサブコマンド一覧が**4行のまま**である（`set` の行を追加していない）
- [ ] `MANUAL.md` に「PR がマージされるまで設定は反映されない」旨が書かれている
- [ ] `README.md:61` 付近の `init` の説明に、設定ファイルが追跡下に入り PR が作られることが反映されている
- [ ] `README.md:67` の「無効化は `/enso:enso-policy disable`」の記述が、`init` が PR 経由になったことと矛盾していない（`disable` は従来どおりファイルを書き換えるだけ）
- [ ] `README.md:130` のコマンド一覧表の `enso-policy` の説明文が、現在の挙動と矛盾していない
- [ ] `MANUAL.md:91` の「`.claude/enso.json` は git 管理下に置いてください」が、`init` が自動で追跡下に置く旨に更新されている
- [ ] `MANUAL.md` の設定スキーマ表に `mergeMethod` の行が既にあることを確認し、**重複して追加していない**
- [ ] `MANUAL.md` の他コマンドのセクション番号を変更していない（`dev-cleanup` が 6 番、`dev-impl` 以降が繰り下がった構成を維持する）
- [ ] `README.md` / `MANUAL.md` の既存の見出し構造を変えていない

## Implementation Notes

- 参照すべき既存コード: `README.md`（61 / 67 / 130 行目）、`MANUAL.md`（33〜36 行目のサブコマンド一覧、91 行目の運用上の注意、`#強制モード` セクション）
- 実装のヒント: 既存の文体は日本語の簡潔な説明。`show` / `enable` / `disable` の説明の長さに合わせる
- 注意事項:
  - **PR #13 はマージ済み。** `MANUAL.md` に `dev-cleanup` が 6 番として入り `dev-impl` 以降が繰り下がった。設定スキーマ表には `mergeMethod` の行が追加済み。**本タスクではセクション番号を触らず**、`enso-policy` に関する箇所だけを編集する
  - `CLAUDE.md` も PR #13 でリモートブランチ削除の記述が増えたが、開発者向けであり `enso-policy` とは無関係。**更新不要**
  - Biome は `.md` を対象にしないため、この変更で `pnpm check` の結果は変わらない
  - `CLAUDE.md` は Enso 本体の開発者向けであり、利用者向けコマンドの一覧は持たない。**更新不要**

## Files

- 変更: `README.md`, `MANUAL.md`
- 新規: なし
- テスト: なし（テストランナー未導入）
