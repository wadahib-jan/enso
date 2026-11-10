---
id: "001"
title: "ipa-security-guide を削除する"
status: done
priority: 1
dependencies: []
estimated_complexity: low
---

# Task: ipa-security-guide を削除する

## Goal

どこからも呼ばれていない内部スキル `ipa-security-guide` を、スキル本体と全ドキュメントの参照ごと削除する。削除後に「呼び出し元なしの内部スキル」がゼロになる状態を作る。

## Interfaces

削除対象（ファイル）:

```
skills/ipa-security-guide/SKILL.md              # 🔵 削除
skills/ipa-security-guide/knowledge/triage.md   # 🔵 削除
skills/ipa-security-guide/knowledge/priority.md # 🔵 削除
skills/ipa-security-guide/lib/output_formatter.md # 🔵 削除
```

参照の除去対象:

```
MANUAL.md:1169  "### ipa-security-guide" セクション全体          # 🔵
skills/dev-debug/SKILL.md:3  description の呼び出し元から除去     # 🔵
CLAUDE.md  Internal 一覧表の ipa-security-guide 行               # 🔵
CLAUDE.md  "Internal は9つです。" → 8つ                          # 🔵
```

`dev-debug` の description は `dev-run / dev-loop / ipa-security-guide から呼ばれる内部スキル。` から始まる。003 で `dev-run` のみに修正するため、**本タスクでは `ipa-security-guide` の語を落とすところまで**を行う。

## Test Strategy

- [ ] `skills/ipa-security-guide/` がリポジトリに存在しない
- [ ] `grep -rn "ipa-security-guide" .` の結果が 0 件（`docs/dev/plans/skill-index/` 配下の計画ドキュメントを除く）
- [ ] MANUAL.md の「セキュリティチェックスキル」節に `ipa-security-check` の解説のみが残り、見出し階層が壊れていない
- [ ] CLAUDE.md の Internal 一覧が 8 行になり、本文の件数表記と一致する
- [ ] エッジケース: `ipa-security-check` 側に guide への参照が無いこと（削除前から無いが、取り残しが無いことを確認する）
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- 削除の根拠は `plan.md` の「ipa-security-guide を削除する根拠」を参照。要約: (1) 呼び出し元が無い (2) 出力の受け取り先が無い（`dev-loop` Step 8 はレポート出力で終わる）(3) 偽陽性判定と優先順位付けは `ipa-security-check` 側が持つ
- ディレクトリ削除は `git rm -r skills/ipa-security-guide` で行う
- MANUAL.md のセクションは `### ipa-security-guide`（`:1169`）から次の `## ディレクトリ構造`（`:1179`）の直前まで

## Files

- 削除: `skills/ipa-security-guide/`（配下すべて）
- 変更: `MANUAL.md` / `CLAUDE.md` / `skills/dev-debug/SKILL.md`
- テスト: なし（Markdown のみのため grep と `pnpm check` で代替）
