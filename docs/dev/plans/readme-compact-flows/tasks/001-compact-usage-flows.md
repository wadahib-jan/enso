---
id: "001"
title: "README の「使い方の流れ」をコンパクトにする"
status: done
priority: 1
dependencies: []
estimated_complexity: low
---

# Task: README の「使い方の流れ」をコンパクトにする

## Goal

README.md の「## 使い方の流れ」節（「## 詳細ドキュメント」の直前まで）を、基本のサイクルと dev-plan に進むまでのパターン表だけに置き換える。

## Interfaces

置き換え後の節の全文（これと一致させる） 🔵

````markdown
## 使い方の流れ

### 基本のサイクル

```text
dev-plan       計画を作り、worktree と Draft PR を用意して停止
  │【実装承認】
dev-loop       実装 → 検証 → PR ready
  │（自動で引き継ぐ）
dev-cleanup    【マージ確認】マージ・main 更新・worktree/ブランチ削除
```

人が判断するのは【実装承認】と【マージ確認】の2箇所だけです（[承認ゲート一覧](./MANUAL.md#承認ゲート一覧)）。

### dev-plan に進むまでのパターン

| パターン | dev-plan までの流れ |
|---|---|
| 要件が固まっている | そのまま `dev-plan` |
| 新規開発 | `dev-init` → `dev-plan` |
| 既存プロジェクトへの導入 | `rev-docs` → `dev-plan` |
| アイデアから | `feature-rubber-duck` → `dev-plan <plan-name> <PRDパス>` |
| 分析から | `edgecase-analysis` → `dev-plan` |
| テストから | `dev-screen-spec` → `dev-webtest` → `dev-plan`（修正後に `dev-webtest retest`） |
| enso の問題から | `enso-issue-report` → `enso-issue-fix <N>`（`dev-plan` を内部実行） |
| 整頓から | `enso-tidy` → 直す指摘を `dev-plan`（削除 PR は `dev-cleanup` へ） |
````

## Test Strategy

- [x] 「## 使い方の流れ」から「## 詳細ドキュメント」の直前までが上の全文と一致する
- [x] 「### 全体像」「### 導入時に一度だけ」「### 入口の選び方」「### 分析・テストを入れるタイミング」の見出しが README に残っていない
- [x] 「## 詳細ドキュメント」以降と「## スキル一覧」以前が変わっていない（`git diff` で README.md の該当節だけが変わっている）
- [x] README 内の `](#...)` アンカー（`#スキル一覧` / `#強制モード任意`）の参照先見出しが残っている
- [x] `MANUAL.md` に「### 承認ゲート一覧」見出しがある
- [x] `pnpm secretlint` と `pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: `README.md`（現行の「使い方の流れ」節）、`MANUAL.md` の「承認ゲート一覧」
- 注意事項: 他のファイルからこの節へのアンカーリンクは無い。README.md 以外は変更しない

## Files

- 変更: `README.md`
