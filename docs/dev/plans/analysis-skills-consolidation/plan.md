# Plan: analysis-skills-consolidation

## Requirements Summary

分析系スキル6つのうち5つを削除し、`edgecase-analysis` の1つだけに絞る。

### 背景

分析系スキル（`bug-analysis` / `performance-analysis` / `impact-analysis` / `sequence-diagram-analysis` / `state-transition-analysis` / `edgecase-analysis`）は、README のクイックスタートに一度も登場せず、他スキルからの参照も `edgecase-analysis` を除いてほぼ孤立している。Entry 層に6つのトリガー語列が並ぶことで、無関係な発話での誤発火リスクだけが増えている。

基本思想は「**最低限のスキルをシンプルに保ち、不要なものは削除する**」。統合による延命ではなく削除を選ぶ。

### 削除するもの（5スキル・6,167行）

| スキル | 行数 | 削除の根拠 |
|---|---|---|
| `bug-analysis` | 1,796 | enso 自身が `MANUAL.md:947-949` で「調査の重複」「出口の不一致」「分量の不釣り合い」「需要の少なさ」を明記済み。この4点は経路だけでなくスキル自体に当てはまる |
| `performance-analysis` | 918 | 骨格が `bug-analysis` と同型で観点だけが違う。他のどのスキルからも参照されていない |
| `impact-analysis` | 964 | `dev-plan` Phase 2（Plan サブエージェントによる既存コード調査・データフロー整理・依存関係の特定）と中身が重複する |
| `sequence-diagram-analysis` | 849 | `rev-docs` が `references/phase2-design.md:147` で `sequenceDiagram` を生成済み。素の依頼でも代替できる |
| `state-transition-analysis` | 1,640 | 固有価値は遷移表のみ。状態遷移の異常系は `edgecase-analysis`（アプリケーション層の「ビジネスロジックの状態遷移」／複合カテゴリの「データモデル状態の組み合わせ」）が拾う |

### 残すもの

`edgecase-analysis` のみ。残す基準は「**素の依頼では再現しない網羅性があり、出力が次工程で消費される**」。

- 6レイヤー×4複合カテゴリの並列ファンアウトは指示なしでは再現しない（特に「カスケード障害」「タイミング依存」）
- 出力が P0〜P3 のチェックリストで、`dev-plan` の受入基準やテスト計画にそのまま流せる
- `rev-docs` から参照されている唯一の分析スキル

層は **Entry のまま維持する**。

### 検討したが採らなかった案

| 案 | 却下の理由 |
|---|---|
| 6 → 3 に統合（`code-analysis` / `flow-analysis` / `edgecase-analysis`）し全て Internal 化 | `flow-analysis` に実用的な呼び出し元が無い。`dev-screen-spec` は矢印テキスト記法で mermaid を生成せず、`rev-docs` は「サブエージェントは Task ツールを使えない」（`skills/rev-docs/SKILL.md:51-57`）ため Task を多用する分析スキルを呼べない。`skill-index` が `ipa-security-guide` を削除した状態と同じになる |
| 6 → 2（`code-analysis` を Entry で残す） | 統合しても「調査してレポートを書くだけでコードを変更しない」性質は変わらず、`dev-plan` Phase 2 との重複も残る |
| Internal 化して `dev-plan` Phase 2.5 / `dev-debug` escalation から呼ぶ | `dev-plan` に +40〜60行。発動条件が「既存ファイル5件以上」「破壊的変更」「🔴残存」のヒューリスティックになり、誤爆も空振りもする。人間が必要なときに呼ぶ方が正確 |
| 6 → 0（`edgecase-analysis` も削除） | `rev-docs` からの参照を外す必要があり、網羅的な異常系洗い出しの手段が失われる |

## Design Overview

### 変更しないもの

- **`dev-plan` / `dev-debug`**: 一切変更しない。Internal 化を採らないため呼び出し元の実装が不要
- **`CLAUDE.md`**: Internal 一覧表に分析スキルは含まれず、`edgecase-analysis` は Entry のまま維持するため「Internal は8つです」も不変
- **`.claude-plugin/plugin.json`**: `"skills": "./skills/"` とディレクトリ単位で指定しており、個別スキル名を持たない
- **`docs/dev/plans/**`**: 過去 Plan の成果物は履歴なので触らない

### 変更するもの

| 対象 | 変更内容 |
|---|---|
| `skills/{bug,performance,impact}-analysis/`、`skills/{sequence-diagram,state-transition}-analysis/` | ディレクトリごと削除 |
| `README.md:77` | 「人が呼ぶスキル（18個）」→（13個） |
| `README.md:92-97` | Entry 表から5行削除（`edgecase-analysis` の1行は残す） |
| `MANUAL.md:592-604` | 開発フェーズ別の使い分け表から5行削除 |
| `MANUAL.md:633-683, 726-817` | 5節を削除し、`### 1. feature-rubber-duck` / `### 2. edgecase-analysis` の2節に番号を振り直す |
| `MANUAL.md:853-864` | 注意事項の 5.（調査と修正の分離）を削除、4.（並列実行）は維持 |
| `MANUAL.md:943-952` | `enso-issue-fix` の経路削除の説明。`bug-analysis` が存在しなくなるため記述を過去形の経緯として整理し、代替案内を差し替える |
| `MANUAL.md:985` | `enso-issue-report` の対象外説明から `bug-analysis` を外す |
| `skills/feature-rubber-duck/SKILL.md:103` | 完了時の案内から `/enso:impact-analysis <対象>` を削除 |
| `skills/dev-debug/references/test-timeouts.md:5` | `performance-analysis` スキルへの言及を外す |
| `skills/enso-issue-fix/SKILL.md:112-119, 316, 334` + `references/plan-request-template.md:91` | `bug-analysis` 前提の記述を整理 |
| `skills/enso-issue-report/SKILL.md:46, 185, 197` | `bug-analysis` を担当先として挙げている記述を差し替え |

### 削除後のスキル構成

| 層 | 件数 | 変化 |
|---|---|---|
| Entry | 13 | 18 から5減（分析系5削除・`edgecase-analysis` 維持） |
| Internal | 8 | 変化なし |
| 分析系 | 1 | 6 から5減 |

## Task Dependency Graph

```
001 (5スキル削除)
002 (README 更新)
003 (MANUAL 分析スキル節の再編)
004 (MANUAL 残存参照の修正)
005 (他スキルの参照修正)
        ↓
006 (旧名参照ゼロの確認と品質ゲート)
```

001〜005 は互いに独立しており並列に実施できる。006 は全タスクの完了後に実行する。

## Cross-Plan Dependencies

なし。既存スキルの削除とドキュメント追従のみで、他 Plan と共有するインターフェースを持たない。
