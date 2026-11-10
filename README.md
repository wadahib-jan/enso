# Enso - AI駆動開発支援フレームワーク

EnsoはAI駆動開発のためのフレームワークです。要件定義から実装まで、AIを活用した効率的な開発プロセスを提供します。

## インストール

Enso は `~/.claude/skills/enso` に配置します。user スコープなので **一度入れれば全プロジェクトから使え、プロジェクト側の設定は一切不要**です。

```bash
git clone https://github.com/yukimnb/enso.git
cd enso
./scripts/install-local.sh
```

Claude Code を再起動（または `/reload-plugins`）すると読み込まれます。`claude plugin list` で確認できます。

```
❯ enso@skills-dir
  Version: 1.0.0
  Scope: user
  Status: ✔ loaded
```

**注意**: コマンドは `/enso:` プレフィックス付きで実行します（例：`/enso:dev-plan`）。

### 更新

`install-local.sh` はコピー方式です。リポジトリを編集しただけでは反映されないため、**反映したいタイミングで再実行**します。開発中の未完成な状態が全プロジェクトへ即座に漏れるのを防ぐためです。

```bash
git pull                        # 最新を取得
./scripts/install-local.sh      # 反映
./scripts/install-local.sh --dry-run     # 差分だけ確認
./scripts/install-local.sh --uninstall   # 撤去
```

`.claude-plugin/` `skills/` `hooks/` のみを同期し、`book/` や `docs/` は投入しません。リポジトリから削除したスキルは投入先からも消えます（`rsync --delete`）。

PR をマージしたあとは、後始末をまとめた次のスクリプトが使えます。

```bash
./scripts/sync-after-merge.sh   # main を pull → マージ済みブランチ削除 → 投入
```

## 概要

Ensoは以下のカテゴリで構成されています：

| ジャンル | 説明 |
|---------|------|
| **Dev** | コンテキスト分析・計画・実装・検証・デバッグの統合ワークフロー |
| **分析** | 影響範囲・エッジケース・原因調査などコードベースの分析 |
| **Issue** | enso 自体の不具合・改善要望を Issue にして修正まで進める |
| **ユーティリティ** | 強制モードの設定・蓄積ファイルと設定・ドキュメントの整頓 |
| **リバースエンジニアリング** | 既存コードからドキュメントを逆生成 |
| **テスト設計** | UAT・受入試験の試験項目一覧を生成 |
| **セキュリティ** | IPA 資料に基づく脆弱性の静的検査 |
| **汎用** | 分野を問わないタスク分割 |

ジャンルは [スキル一覧](#スキル一覧) の列と対応しています。このほか、プロジェクトごとに enso の経由・worktree/PR 運用を強制する **強制モード**（任意）があります。

### 強制モード（任意）

既定では、enso のスキルは明示的に呼んだときだけ動きます。プロジェクトによっては「必ず計画を立ててから実装する」「main を直接触らせない」を徹底したいことがあります。

`/enso:enso-policy init` を実行すると `<project>/.claude/enso.json` が作られ、**git の追跡下に置かれて PR になります**（チーム全員に同じ設定を効かせるため）。そのプロジェクトでは次が強制されます。

- 実装依頼は `dev-plan` → 承認 → `dev-loop` を経由する（毎ターン指示が注入される）
- コードの変更・コミット・push・PR 作成は **worktree の中でのみ**許可される。main 等の保護ブランチ上での操作はブロックされる
- `gh pr ready` の前に `ipa-security-check` のレポートが必要になる
- `gh pr merge` は、`dev-cleanup` のマージ確認を通した記録が `loop-state.yaml` に無ければブロックされる

**設定ファイルが無いプロジェクトの挙動は一切変わりません。** 無効化は `/enso:enso-policy disable`（こちらは PR を作らず、設定ファイルを書き換えるだけです）。設定の反映には Claude Code の再起動が必要です。詳細は [MANUAL.md](./MANUAL.md#強制モード) を参照してください。

## スキル一覧

スキルは **人が呼ぶスキル**（14個）と **内部スキル**（8個）の2層に分かれます。通常打つのは前者だけで、後者は呼び出し元から自動的に起動されます。**ここが一覧の正本です。** 各スキルの詳細は [MANUAL.md](./MANUAL.md) にあります。

### 人が呼ぶスキル

ユーザーの発話で自動発火します。`/enso:<スキル名>` で明示的に呼ぶこともできます。

| スキル | ジャンル | 説明 |
|-------|---------|------|
| [`dev-init`](./MANUAL.md#1-dev-init) | Dev | 新規プロジェクトの技術スタック選定・初期化 |
| [`dev-plan`](./MANUAL.md#2-dev-plan) | Dev | 要件をタスク分解して実装計画を作成し、worktree と Draft PR を用意 |
| [`dev-loop`](./MANUAL.md#3-dev-loop) | Dev | PR 確認後に実装〜検証〜レビュー依頼までを一気に完了 |
| [`dev-cleanup`](./MANUAL.md#4-dev-cleanup) | Dev | PR のマージと後始末（main 更新・worktree/ブランチ削除） |
| [`dev-screen-spec`](./MANUAL.md#5-dev-screen-spec) | Dev | ソースコードから画面仕様を自動生成・更新 |
| [`dev-webtest`](./MANUAL.md#6-dev-webtest) | Dev | Playwright による画面テスト実行 |
| [`feature-rubber-duck`](./MANUAL.md#1-feature-rubber-duck) | 分析 | アイデアを対話で整理して PRD 化。`dev-plan` に PRD をそのまま渡せる（要件定義前） |
| [`edgecase-analysis`](./MANUAL.md#2-edgecase-analysis) | 分析 | 6レイヤー×4カテゴリを並列分析し、優先度付きチェックリストを生成（設計・実装前） |
| [`enso-issue-report`](./MANUAL.md#1-enso-issue-report) | Issue | enso 自体の問題を対話で整理し、`yukimnb/enso` に Issue を作成 |
| [`enso-issue-fix`](./MANUAL.md#2-enso-issue-fix) | Issue | Issue を1件取り込み、`dev-plan` で実装計画を Draft PR に（実装は承認後に `dev-loop`） |
| [`enso-policy`](./MANUAL.md#強制モード) | ユーティリティ | プロジェクトごとの強制モード設定（worktree/PR ガード） |
| [`enso-tidy`](./MANUAL.md#整頓enso-tidy) | ユーティリティ | 蓄積ファイルの削除 PR と、AI 開発の設定・ドキュメントの冗長点検 |
| [`rev-docs`](./MANUAL.md#rev-docs-の詳細) | リバースエンジニアリング | 既存コードからタスク・設計文書・要件定義・テスト仕様書を一括逆生成 |
| [`uat-test-design`](./MANUAL.md#uat-test-design) | テスト設計 | UAT・受入試験・非機能受入の試験項目一覧を L1/L2/L3 の3階層で生成 |

分析スキルの出力は `docs/dev/analysis/` 配下に保存されます。Issue 連携スキルの投稿先は `yukimnb/enso` に固定されているため、**どのプロジェクトで作業中でも報告できます**（名前の `enso-` は「enso 自体を対象にする」という意味で、汎用の Issue 管理スキルではありません）。

### 内部スキル

呼び出し元から自動的に起動されるため、通常は直接打つ必要はありません。`/enso:<スキル名>` で明示的に呼ぶこともできます。呼び出し元は**そのスキルの手順内で内部実行されるもの**だけを挙げています（「修正は `dev-debug` へ引き継ぐ」のような案内は含みません）。

| スキル | ジャンル | 呼び出し元 | 説明 |
|-------|---------|----------|------|
| [`dev-context`](./MANUAL.md#1-dev-context) | Dev | `dev-plan` / `dev-impl` / `dev-run` / `dev-screen-spec` / `dev-webtest-plan` | プロジェクトのコンテキスト自動分析（context.md が無いとき） |
| [`dev-impl`](./MANUAL.md#2-dev-impl) | Dev | `dev-run` | テストファースト実装 |
| [`dev-run`](./MANUAL.md#3-dev-run) | Dev | `dev-loop` | タスク範囲の自動連続実装 |
| [`dev-verify`](./MANUAL.md#4-dev-verify) | Dev | `dev-run` / `dev-loop` | Plan 単位のテスト・ビルド・Lint 一括検証 |
| [`dev-debug`](./MANUAL.md#5-dev-debug) | Dev | `dev-run` | エラーカテゴリ別の診断・修正（不安定テスト・タイムアウトを含む） |
| [`dev-webtest-plan`](./MANUAL.md#6-dev-webtest-plan) | Dev | `dev-webtest` | Playwright 用 Web テスト計画の生成 |
| [`ipa-security-check`](./MANUAL.md#ipa-security-check) | セキュリティ | `dev-loop` | IPA 資料に基づく脆弱性の静的検査（強制モードで PR ready の前に必須） |
| [`task-breakdown`](./MANUAL.md#task-breakdown) | 汎用 | `dev-plan`（インライン適用） | 依頼をゴール/制約/前提に正規化し、タスク分割結果（ツリー＋表）を生成 |

**スキルを追加・削除したときは、この一覧の更新が必要です。** 層の決め方と `description` の書式は [CLAUDE.md](./CLAUDE.md) を参照してください。

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

## 詳細ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [MANUAL.md](./MANUAL.md) | 全スキルの詳細マニュアル |
| [CLAUDE.md](./CLAUDE.md) | Enso本体を開発する際のリポジトリ指示 |
