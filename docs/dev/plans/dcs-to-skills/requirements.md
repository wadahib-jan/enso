# Requirements: dcs-to-skills

DCS コマンド群を廃止し、開発フロー上の出番が明確なものだけをスキルとして残す。

## 背景

`commands/dcs/` に10本のコマンド（計 12,671 行）が存在するが、次の問題を抱えている。

- 「DCS（分析・調査）」という一括りで並んでおり、**どれをいつ使うのか判断できない**
- dev-plan / dev-debug / timeout-fix の整備が進んだ結果、**一部が既存スキルと重複**している
- 分析機能だけが `commands/` 側に取り残され、**スキル一覧から発見できない**

## 機能要件（EARS）

### 削除

- **FR-001**: システムは、`commands/dcs/` ディレクトリを削除しなければならない（SHALL）。
- **FR-002**: システムは、`incremental-dev`・`code-question`・`test-performance-analysis` の機能を復活させてはならない（SHALL NOT）。これらは dev-plan / 通常の質問 / timeout-fix で代替される。
- **FR-003**: 削除されたコマンドを参照している箇所がある場合、システムはその参照を代替スキルへの案内に置き換えなければならない（WHEN 参照が存在する THEN）。

### スキル化

- **FR-004**: システムは、以下7つを `skills/<name>/SKILL.md` として提供しなければならない（SHALL）: `impact-analysis`, `edgecase-analysis`, `bug-analysis`, `feature-rubber-duck`, `sequence-diagram-analysis`, `state-transition-analysis`, `performance-analysis`。
- **FR-005**: 各スキルの `description` は、利用者が**いつ使うかを判別できる**トリガーワードと機能説明を含まなければならない（SHALL）。
- **FR-006**: `bug-analysis` は、分析完了時に修正工程として `dev-debug` への導線を提示しなければならない（WHEN 最終レポート作成完了 THEN）。
- **FR-007**: `feature-rubber-duck` は、PRD 作成完了時に `dev-plan` へ PRD パスを渡す呼び出し例を提示しなければならない（WHEN PRD 作成完了 THEN）。
- **FR-008**: 各スキルは、分析結果に信号機（🔵🟡🔴）で確信度を付与しなければならない（SHALL）。
- **FR-009**: `bug-analysis` および `performance-analysis` は、コードを修正してはならない（SHALL NOT）。調査と方針提示までを担当範囲とする。

### 出力先

- **FR-010**: 各スキルは、分析結果を `docs/dev/analysis/<timestamp>_<name>/` に出力しなければならない（SHALL）。
- **FR-011**: `refine-plan` / `refine-execute` は、出力先を `docs/dev/refine/` としなければならない（SHALL）。

### ドキュメント

- **FR-012**: README・MANUAL・help・dev-navigate は、7スキルを**開発フェーズ別**に提示しなければならない（SHALL）。
- **FR-013**: ドキュメントは、役割が近い既存スキルとの使い分けを明示しなければならない（SHALL）。特に `bug-analysis` と `dev-debug`、`performance-analysis` と `timeout-fix`。

## 非機能要件

- **NFR-001**: 各 `SKILL.md` は 500 行以内に収める。
- **NFR-002**: 巨大なテンプレートは `references/` に切り出し、`SKILL.md` からは参照のみとする。
- **NFR-003**: テンプレート本文は元コマンドから機械的に抽出し、内容を変質させない。
- **NFR-004**: 品質ゲート（`pnpm secretlint && pnpm check`）と `claude plugin validate .` を通過すること。
- **NFR-005**: スキル定義に特定プロジェクト固有の名称・パスを含めない（Enso は汎用フレームワークとして配布される）。

## 制約

- **CON-001**: `skills/` は**直下1階層のみ**。ネストしたディレクトリは読み込まれないため、`dcs/` サブディレクトリは作れずフラット化が必須。
- **CON-002**: `.claude-plugin/plugin.json` はディレクトリ単位の指定のため、コマンド／スキルの増減でマニフェスト変更は不要。
- **CON-003**: `install-local.sh` は `rsync --delete` で user スコープへ同期するため、**投入は全プロジェクトに即座に効く**。壊れた状態を投入してはならない。
- **CON-004**: Biome の対象は JSON と JS/TS のみ。`.md` の整形は自動検証されない。

## 用語集

| 用語 | 意味 |
|---|---|
| DCS | Deep Code Survey。廃止する旧コマンド群の呼称 |
| 信号機システム | 🔵前工程指示 / 🟡妥当な推測 / 🔴AI推論補完 で確信度を示す Enso 共通規約 |
| 分析スキル | 本作業で新設する7スキルの総称。DCS に代わる呼称 |
