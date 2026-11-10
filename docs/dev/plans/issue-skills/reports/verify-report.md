# 検証レポート: issue-skills

実行日: 2026-09-06
対象: タスク 001〜005

## ゲート結果

| 項目 | コマンド | 結果 |
|---|---|---|
| 機密情報検査 | `pnpm secretlint` | ✅ OK（exit 0） |
| フォーマット・Lint | `pnpm check` | ✅ OK（11ファイル検査、修正なし） |
| マニフェスト検証 | `claude plugin validate .` | ✅ Validation passed with warnings |
| 投入差分の確認 | `./scripts/install-local.sh --dry-run` | ✅ 新規4ファイルを検出 |
| テスト | — | N/A（本リポジトリにテストランナーは存在しない） |
| ビルド | — | N/A（ビルド工程は存在しない） |

### マニフェスト検証の警告について

検出された2件はいずれも**本変更とは無関係な既存の警告**である。

| 警告 | 内容 | 本変更との関係 |
|---|---|---|
| `root: CLAUDE.md at the plugin root is not loaded as project context` | プラグインルートの `CLAUDE.md` はプラグインコンテキストとして読み込まれない | 既存。`CLAUDE.md` は Enso 本体を開発するときの指示書であり、プラグインとして配布する意図はないため対応不要 |
| `commands/tech-stack.md: No frontmatter block found` | frontmatter が無い | 既存。本変更で触れていない |

### 投入差分（`install-local.sh --dry-run`）

```
cd+++++++++ skills/enso-issue-fix/
>f+++++++++ skills/enso-issue-fix/SKILL.md
cd+++++++++ skills/enso-issue-fix/references/
>f+++++++++ skills/enso-issue-fix/references/plan-request-template.md
cd+++++++++ skills/enso-issue-report/
>f+++++++++ skills/enso-issue-report/SKILL.md
cd+++++++++ skills/enso-issue-report/references/
>f+++++++++ skills/enso-issue-report/references/issue-template.md
```

**削除される項目は無い。** 実際の投入は本 PR のマージ後に `./scripts/sync-after-merge.sh` で行う。

## 500行ルール

| ファイル | 行数 | 判定 |
|---|---|---|
| `skills/enso-issue-report/SKILL.md` | 197 | ✅ |
| `skills/enso-issue-fix/SKILL.md` | 340 | ✅ |
| `skills/enso-issue-report/references/issue-template.md` | 128 | ✅ |
| `skills/enso-issue-fix/references/plan-request-template.md` | 86 | ✅ |
| `skills/dev-navigate/SKILL.md` | 350 | ✅（変更前 267） |

## タスク別の受け入れ確認

### 001: enso-issue-report スキル

| 確認項目 | 結果 |
|---|---|
| `name` がディレクトリ名と一致 | ✅ `enso-issue-report` |
| `description` がトリガーワード列挙形式 | ✅ |
| 本文が 前提知識 → ワークフロー → ルール・制約 → 追加リソース | ✅ |
| 投稿先 `yukimnb/enso` 固定を明記、全 `gh` に `--repo` | ✅ |
| ラベルを実在3種に限定 | ✅ `bug` / `enhancement` / `documentation` |
| 承認なしに作成しない旨をルールに明記 | ✅ |
| 異常系: `gh` 未認証で中断 | ✅ Step 0 |
| 異常系: 重複候補の3分岐 | ✅ Step 4 |
| エッジケース: 機密情報を含めない注意 | ✅ ルール・制約に4項目 |
| 500行以内 | ✅ 197行 |

### 002: enso-issue-fix スキル

| 確認項目 | 結果 |
|---|---|
| `name` がディレクトリ名と一致 | ✅ `enso-issue-fix` |
| 調査を行わず dev-plan Phase 2 に一本化、その理由を記載 | ✅ 前提知識「なぜ原因分析スキルを経由しないのか」 |
| 引数が Issue 番号のみ（フラグなし） | ✅ frontmatter / Step 0b |
| Step 3 が実在確認のみ、Grep / Glob の探索を禁止 | ✅ Step 3 |
| Step 3 で中断しない | ✅ Step 3 |
| dev-plan を Lightweight 固定で呼ぶ | ✅ Step 4 / ルール・制約 |
| plan-name 規則 `issue-<番号>-<slug>` | ✅ |
| 不変条件が独立見出しで明記 | ✅ 「前提知識 > 不変条件」 |
| `Closes #<N>` の指示 | ✅ Step 4 と引き渡しテンプレート |
| Draft PR で停止し `dev-loop` を呼ばない | ✅ Step 6 / ルール・制約 |
| 停止時に「Issue のどの記述をどう解釈したか」を提示 | ✅ Step 6 |
| 承認後に `dev-loop` が行うこと（中断条件を含む）を参考記載 | ✅ Step 7 |
| bug-analysis を呼び出さない旨と代替手段の案内 | ✅ 前提知識 / ルール・制約 / 関連スキル |
| 異常系: Issue が closed | ✅ Step 1b |
| 異常系: 既に PR が存在（二重着手防止） | ✅ Step 1b + Step 2 の worktree/ブランチ確認 |
| 異常系: 番号が存在しない / `gh` 未認証 | ✅ Step 0 / Step 1 |
| エッジケース: 引数なしで一覧から選択 | ✅ Step 0b |
| 並列化の前提を「将来の拡張」に記載 | ✅ 「承認をオーケストレータの外に置く」を含む7項目の表 |
| 500行以内 | ✅ 340行 |
| （追加）Issue を信頼できない入力として扱う | ✅ セキュリティチェックの指摘により追加 |

### 003: dev-navigate 統合

| 確認項目 | 結果 |
|---|---|
| 対象スキル一覧に2行追加 | ✅ |
| Q1 に7つ目の選択肢を追加 | ✅ 「enso 自体の問題を報告・修正したい」 |
| Q2c で enso-issue-report / enso-issue-fix に振り分け | ✅ Step 3c |
| 既存の提案メッセージ形式を踏襲 | ✅ `## Nav 結果` → 推奨スキル → 説明 → 推奨フロー |
| 既存の選択肢・分岐が無傷 | ✅ Q1 の既存6選択肢、Q2 / Q2b の分岐すべて残存 |
| ルール・制約の質問数の記述を更新 | ✅ Q2/Q2b/Q2c |

### 004: ドキュメント更新

| 確認項目 | 結果 |
|---|---|
| README に2スキルの説明行 | ✅ 「### Issue 連携」を新設 |
| README から MANUAL への相対リンク | ✅ `./MANUAL.md#issue-連携` |
| MANUAL に `## Issue 連携` セクション | ✅ 分析スキルとリバースエンジニアリングの間 |
| 既存セクションと同じ体裁 | ✅ `### N. skill-name` 形式、実行例のコードブロック、表 |
| Issue 起点のフロー図（調査が dev-plan Phase 2 にあること） | ✅ |
| 注意事項に投稿先固定を記載 | ✅ 注意事項1 |
| 既存の目次・項番を壊していない | ✅ 既存セクションは未変更 |

### 005: 品質ゲート

上記「ゲート結果」のとおり全項目通過。`.claude-plugin/plugin.json` は未変更（ディレクトリ単位の指定のためスキル追加では不要）。

## 信号機サマリ

### 🔵 前工程指示

- スキルのファイル構成・frontmatter 形式・本文構成（既存スキルの規約に準拠）
- 調査を `dev-plan` Phase 2 に一本化する方針（計画で確定済み）
- 不変条件「1 Issue = 1 plan = 1 worktree = 1 PR」

### 🟡 要確認

| 対象 | 確認すべき点 |
|---|---|
なし。

**解消済み（2件）**

| 元の要確認 | 解消の経緯 |
|---|---|
| `bug-analysis` の非対話呼び出し | 経路A自体を削除したため消滅した |
| 対象リポジトリの固定が名前から読み取れない | `issue-report` / `issue-fix` → **`enso-issue-report` / `enso-issue-fix`** に改名し、スコープを名前に出した。あわせて固定が3層（Issue の取得先・実行できる場所・`dev-plan` に渡す規約）あることと、汎用化には3層目を `docs/dev/context.md` から読む形に置き換える必要があることを SKILL.md に明記した |

**将来の申し送り**: 汎用の Issue 駆動開発スキルが必要になった場合は、本スキルを改造するのではなく別スキルとして起こすほうがよい。`enso-` の名前が示すとおり、これらは enso のドッグフーディング専用である。

### 🔴 要判断

なし。

## 備考

本リポジトリに単体テストは存在せず、成果物はすべて Markdown のスキル定義とドキュメントである。そのため実装は `dev-run` のサブエージェント経由ではなく、計画のインターフェース定義と Test Strategy を直接の受け入れ条件としてメインコンテキストで行い、各タスクの Test Strategy を上表で1項目ずつ確認した。

計画コミット時に Issue #10（worktree 内で `pnpm secretlint` / `pnpm check` が `prepare` の失敗で落ちる）を踏んだため、`pnpm install --ignore-scripts` で回避している。原因は worktree の `.git` がディレクトリではなくファイルであるため `simple-git-hooks` の `mkdir .git/hooks` が `ENOTDIR` で失敗すること。
