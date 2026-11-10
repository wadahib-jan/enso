---
id: "001"
title: "旧 rev-* コマンドから references/ をsed抽出する"
status: done
priority: 1
dependencies: []
estimated_complexity: medium
---

# Task: 旧 rev-* コマンドから references/ をsed抽出する

## Goal

旧4コマンドの「実行内容（分析手順）」と「出力フォーマット例」を `sed` で機械的に抽出し、`skills/rev-docs/references/` 配下の4ファイルに移す。再入力による内容劣化を防ぐため、**本文は手で打ち直さない**。

## Interfaces

抽出元の行範囲（`grep -n "^## "` で確認済み）:

| 出力先 | 抽出元 | 行範囲 | 確信度 |
|---|---|---|---|
| `references/phase1-tasks.md` | `commands/rev-tasks.md` | 49-196（実行内容〜分析対象ファイルの自動検出）+ 216-221（実行後の確認） | 🔵 |
| `references/phase2-design.md` | `commands/rev-design.md` | 17-473（実行内容〜分析アルゴリズム）+ 492-497 | 🔵 |
| `references/phase3-requirements.md` | `commands/rev-requirements.md` | 17-362（実行内容〜要件抽出アルゴリズム）+ 385-391 | 🔵 |
| `references/phase4-specs.md` | `commands/rev-specs.md` | 17-591 から後述の除去対象を引いたもの + 616-622 | 🟡 |

各ファイルの先頭には、そのフェーズが何を生成するかを 3-5 行で説明する見出しを付ける。

## Test Strategy

- [ ] 4ファイルすべてが `skills/rev-docs/references/` に生成される
- [ ] 抽出後の各ファイルに `claude code rev-` の文字列が1件も残っていない（`grep -c` が 0）
- [ ] `phase4-specs.md` に `--generate-code`、`docs/spec/{要件名}/tests/`、テストコードのコードブロック（`describe(` / `it(` / `test(` を含むブロック）が残っていない
- [ ] 各 `references/*.md` に、他の rev-* コマンドの事前実行を求める「前提条件」の記述が残っていない
- [ ] エッジケース: 抽出範囲の境界でコードフェンス（```）が閉じずに切れていないこと。各ファイルの ``` の出現回数が偶数であることで確認する

## Implementation Notes

- 参照すべき既存コード: `skills/dev-run/references/` — 同じ「テンプレートを references に置き、SKILL.md から Read する」構造の先例
- 抽出の基本形（worktree 内の相対パスで実行する）:
  ```bash
  sed -n '49,196p;216,221p' commands/rev-tasks.md > skills/rev-docs/references/phase1-tasks.md
  ```
- **除去対象**（抽出後に手で削る）:
  - 各ファイル末尾の `## 実行コマンド例` 節（実在しない `claude code rev-*` CLI）
  - `commands/rev-specs.md` のテストコード生成に関わる記述:
    - `## 生成されたテストケース`（109-322）配下の**実テストコードのコードブロック**
    - `## テストコード生成アルゴリズム`（564-591）
    - `docs/spec/{要件名}/tests/` への出力指示（`## 実行内容` の 7 項目目）
    - テストケース**一覧・仕様の記述**は残す（表・項目定義は phase4 の成果物そのもの）
  - 各ファイル冒頭に含まれる、他の rev-* コマンドの事前実行を求める `## 前提条件` の記述
- 注意事項: 行番号は抽出元ファイルを編集する前の値。**削除タスク（003）より先に実行する**

## Files

- 新規: `skills/rev-docs/references/phase1-tasks.md`
- 新規: `skills/rev-docs/references/phase2-design.md`
- 新規: `skills/rev-docs/references/phase3-requirements.md`
- 新規: `skills/rev-docs/references/phase4-specs.md`
- 参照（この時点では変更しない）: `commands/rev-tasks.md`, `commands/rev-design.md`, `commands/rev-requirements.md`, `commands/rev-specs.md`
