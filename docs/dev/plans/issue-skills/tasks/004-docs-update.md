---
id: "004"
title: "README.md と MANUAL.md に2スキルを追記する"
status: done
priority: 3
dependencies: ["001", "002"]
estimated_complexity: low
---

# Task: README.md と MANUAL.md に2スキルを追記する

## Goal

利用者向けドキュメントに `enso-issue-report` / `enso-issue-fix` を追加し、Issue 起点の開発フローが README の一覧と MANUAL の詳細から辿れるようにする。

## Interfaces

README.md への追加: 🔵

「利用可能なコマンド」に **Issue 連携** の節を新設し、2スキルを表で掲載する。

```
### Issue 連携

| スキル | 説明 |
|-------|------|
| `enso-issue-report` | enso 自体の問題を対話で整理し、yukimnb/enso に Issue を作成 |
| `enso-issue-fix` | Issue を1件取り込み、原因分析（必要時）→ dev-plan → dev-loop で修正 PR まで |
```

MANUAL.md への追加: 🔵

- 「Dev Skills」と「分析スキル」に並ぶ `## Issue 連携` セクションを新設
- 各スキルの用途・引数・実行例・出力・注意事項を、既存セクションと同じ体裁で記述
- Issue 起点のフロー図（`enso-issue-report → Issue → enso-issue-fix → bug-analysis?（条件付き）→ dev-plan → dev-loop → Closes`）

## Test Strategy

- [ ] README.md に `enso-issue-report` と `enso-issue-fix` の説明行が存在する
- [ ] README.md から MANUAL.md の該当セクションへの相対リンクが張られている
- [ ] MANUAL.md に `## Issue 連携` セクションが追加され、2スキルの詳細がある
- [ ] MANUAL.md の記述が既存セクション（見出しレベル・実行例のコードブロック・表）と同じ体裁になっている
- [ ] Issue 起点のフロー図が記載され、`bug-analysis` が条件付き経由であることが分かる
- [ ] MANUAL.md の注意事項に、投稿先が `yukimnb/enso` 固定であることが書かれている
- [ ] 既存の目次・セクション番号との整合が取れている（既存項番を壊していない）

## Implementation Notes

- 参照すべき既存コード: `README.md` の「利用可能なコマンド」（Dev Skills / 分析スキル / ユーティリティコマンド / リバースエンジニアリング）、`MANUAL.md` の `## Dev Skills` と `## 分析スキル`
- MANUAL.md の既存セクションは「### N. skill-name」の連番形式。新設セクション内も同じ形式で `### 1.` から振る
- ドキュメントは日本語
- Biome は Markdown を対象にしないため、整形は手動で既存の体裁に合わせる

## Files

- 変更: `README.md`
- 変更: `MANUAL.md`
