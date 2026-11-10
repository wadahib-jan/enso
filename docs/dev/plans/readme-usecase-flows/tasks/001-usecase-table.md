---
id: "001"
title: "README の使い方の流れをユースケース別に書き直す"
status: done
priority: 1
dependencies: []
estimated_complexity: low
---

# Task: README の使い方の流れをユースケース別に書き直す

## Goal

README.md の `### dev-plan に進むまでのパターン`（見出しから `## 詳細ドキュメント` の直前まで）を、ユースケース別の表に置き換える。

## Interfaces

置き換え後の全文（これと一致させる） 🔵

````markdown
### ユースケース別の流れ

矢印は実行順です。かっこ内はそのスキルが作り、次のスキルや人が使うファイルです。

| ユースケース | 流れ |
|---|---|
| 要件が固まっている | `dev-plan` から基本のサイクル |
| 新規開発 | `dev-init`（`docs/dev/context.md`）→ `dev-plan` |
| 既存プロジェクトへの導入 | `rev-docs`（`docs/tasks/`・`docs/design/`・`docs/spec/`）→ `dev-plan` |
| アイデアから始める | `feature-rubber-duck`（`prd.md`）→ `dev-plan <plan-name> <prd.md の絶対パス>` |
| enso の問題を直す | `enso-issue-report`（Issue）→ `enso-issue-fix <N>`（`dev-plan` を自動実行） |
| enso を整頓する | `enso-tidy` → 削除 PR は `dev-cleanup` へ、直す指摘は `dev-plan` を自動実行 |
| 異常系を洗い出す | 要件定義書（`dev-plan` Full-spec または `rev-docs`）→ `edgecase-analysis`（`check_list.md`）→ 直す項目を選んで `dev-plan` |
| 画面をテストする | `dev-plan` の計画 → `dev-webtest`（`docs/dev/webtests/errors/`）→ 直すのは `dev-plan`、確認は `dev-webtest retest` |
| 画面仕様を作る・更新する | 実装後: `dev-screen-spec`（`docs/dev/screen-specs/`）／実装前: `dev-plan`（Full-spec の `acceptance-criteria.md`）→ `dev-screen-spec from-plan` |
| 受入試験の項目を作る | 要件・仕様の資料（無ければ `rev-docs`）→ `uat-test-design`（`docs/uat/<yyyymmdd>/`）→ 人が試験を実施 |

`edgecase-analysis` と `uat-test-design` の出力を読むスキルはありません。どれを直すかは人が選び、要件として `dev-plan` に渡します。

`dev-webtest` のテスト計画は `dev-plan` の計画から作られます。画面仕様があると、画面の変更差分からテスト計画を追従させられる（`dev-webtest-plan update`）ので、Web テストを繰り返すなら `dev-screen-spec` も実行しておきます。
````

## Test Strategy

- [x] `### ユースケース別の流れ` から `## 詳細ドキュメント` の直前までが上の全文と一致する
- [x] 見出し `### dev-plan に進むまでのパターン` が README に残っていない
- [x] `### 基本のサイクル` の中身（コードブロックと承認ゲートの1文）が変わっていない
- [x] `## 詳細ドキュメント` 以降が変わっていない（`git diff` で README.md の該当節だけが変わっている）
- [x] 表に出てくるファイルパスが実在の出力先と一致する（`docs/dev/context.md`、`docs/spec/`、`docs/dev/screen-specs/`、`docs/dev/webtests/errors/`、`docs/uat/<yyyymmdd>/`）
- [x] `pnpm secretlint` と `pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: `README.md` の現行の `### dev-plan に進むまでのパターン`（120行目付近から `## 詳細ドキュメント` の直前まで）
- 注意事項: README.md 以外は変更しない。`### 基本のサイクル` には手を入れない

## Files

- 変更: `README.md`
