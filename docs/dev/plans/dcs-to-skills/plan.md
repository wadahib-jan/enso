# Plan: dcs-to-skills

## Requirements Summary

`commands/dcs/` の10コマンド（12,671行）を廃止し、開発フロー上の出番が明確な7本を `skills/` へフラットなスキルとして移設する。3本は既存スキルで代替できるため削除する。

詳細: [requirements.md](requirements.md) | [user-stories.md](user-stories.md) | [acceptance-criteria.md](acceptance-criteria.md)

### 判定結果

**削除（3本）** — 代替が存在する

| コマンド | 代替 |
|---|---|
| `incremental-dev` | dev-plan の設計 + task-breakdown による依存グラフ付きタスク分解 |
| `code-question` | 通常の質問（構造化出力が付くだけで固有の出番がない） |
| `test-performance-analysis` | timeout-fix + test-optimization-patterns |

**スキル化（7本）** — 代替が無く、出番が明確

| スキル | 出番 | 既存スキルに無い理由 |
|---|---|---|
| `feature-rubber-duck` | 要件定義前 | dev-plan は要件が言語化済みである前提。adr-rubber-duck は単一決定限定 |
| `sequence-diagram-analysis` | 設計・レビュー時 | rev-design はコードベース全体の逆生成で、単一機能狙いには重い |
| `state-transition-analysis` | 設計時 | rev-design は flowchart 止まりでステートマシンに踏み込まない |
| `edgecase-analysis` | 設計・実装前 | 異常系をゼロから洗い出せる手段が他に無い |
| `impact-analysis` | 実装前 | refine-plan の影響調査は直接参照の Grep どまり |
| `bug-analysis` | 障害対応時 | dev-debug はエラーが目の前にある前提の設計 |
| `performance-analysis` | 障害対応時 | timeout-fix / flaky-fix はテスト実行の速度・安定性のみ |

## Design Overview

### 構造変換

各コマンドは「step ロジック（前半）＋巨大テンプレート（後半）」という規則的な構造を持つ。これを利用して、

- **テンプレート部分**は `sed` で機械的に `references/` へ抽出する（再入力しない＝内容の劣化を防ぐ）
- **step ロジック部分**を skills 形式（`## 前提知識` / `## ワークフロー` / `## 信号機システム` / `## ルール・制約` / `## 追加リソース`）へ書き直す

結果: SKILL.md 計 1,206 行 + references 計 7,721 行。

### 設計判断

**1. 出力先を `.dcs/` から `docs/dev/analysis/` へ移す。**
DCS という呼称を廃止する以上 `.dcs` は意味を失う。既存の dev-* スキルは `docs/dev/` に統一されており、そこへ寄せる。隠しディレクトリは成果物のレビュー・共有がしにくい。refine 系も `docs/dev/refine/` へ揃える。旧 `.dcs/` を読みに行く後方互換処理は入れず、MANUAL に注記のみ置く。

**2. 共通骨格を抽象化しない。**
impact / performance / sequence / state-transition の4本は「調査 → 追加調査ループ → サマリー」という同一骨格を持つが、共有用スキルを作るとコマンド一覧に無意味なエントリが増え、references の重複配置は同期コストになる。各 SKILL.md に素直に書き、スキルの独立性を優先する。

**3. 調査と修正を分離する。**
`bug-analysis`（原因特定）→ `dev-debug`（修正）、`feature-rubber-duck`（PRD）→ `dev-plan`（計画）という引き渡しを各スキルの最終ステップに明記する。dev-debug の「最小コンテキスト・3サイクル」と bug-analysis の「多段階調査」は設計思想が正反対なので、同居させない。

### 想定外の発見と対処

抽出したテンプレート8ファイルに、作者の固有プロジェクト名（`Prismatix`, `prismatix-factory/`, `ensemble-si`, `makotan`）が13箇所混入していた。Enso は汎用フレームワークとして配布されるため、すべて汎用的な記述へ置換した。

## Task Dependency Graph

```
T1 (context.md)
 └─ T2 (計画成果物)
     ├─ T3..T9 (7スキル作成・相互に独立)
     │   └─ T10 (commands/dcs 削除)
     │       └─ T11..T15 (参照更新)
     │           └─ T16 (検証)
     └─ (T3..T9 と並行可)
```

トポロジカル順: T1 → T2 → T3〜T9 → T10 → T11〜T15 → T16

## Cross-Plan Dependencies

本ブランチは `feature/enforce-policy-hooks`（hooks 追加 + sync-after-merge、main 未マージ）を含む。ユーザー判断により hooks ごと main への1PRとしてまとめる。
