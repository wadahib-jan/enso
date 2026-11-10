---
name: rev-docs
description: This skill should be used when the user asks to "rev-docs", "リバースエンジニアリング", "既存コードから設計書", "ドキュメント逆生成", "既存コードを分析してドキュメント化", "タスクを逆算", "要件を逆生成", "EARS逆生成", "テスト仕様を逆生成", "アーキテクチャを抽出", "reverse engineer", "generate docs from code". 既存のコードベースを機能単位に分解し、タスク一覧・技術設計文書・EARS要件定義・テスト仕様書を4フェーズで一括逆生成する。
argument-hint: '[分析対象パス]'
---

# Rev Docs

既存のコードベースから、実装を根拠にドキュメント一式を逆生成する。機能単位への分解を最初に1回だけ行い、その `{要件名}` を4つのフェーズで共有する。

## 前提知識

### 位置づけ

`dev-*` の前向きフロー（要件 → 設計 → 実装）とは逆向きに、既に動いているコードから文書を起こす。ドキュメントが無い既存プロジェクトに enso を導入するときの入口として使う。

```
既存コードベース → [rev-docs] → docs/tasks/ docs/design/ docs/spec/
                                        ↓
                              dev-plan（以降は通常フロー）
```

### フェーズ順序（変更しないこと）

```
Step 0: 機能分割 → Step 1: tasks → Step 2: design → Step 3: requirements → Step 4: specs → Step 5: レポート
```

**requirements が specs より先である。** テスト仕様は受け入れ基準から導出するものであり、順序を入れ替えると Step 4 が根拠を持たない。

### 引数

```
/enso:rev-docs [分析対象パス]
```

- 分析対象パス: 省略時はリポジトリルート（`$(git rev-parse --show-toplevel)`）
- 部分実行はできない。常に4フェーズを通し実行する

### 出力先

| フェーズ | 出力先 |
|---|---|
| 1. tasks | `docs/tasks/{要件名}/overview.md`, `docs/tasks/{要件名}/TASK-XXXX.md` |
| 2. design | `docs/design/{要件名}/architecture.md`, `dataflow.md`, `api-endpoints.md`, `database-schema.sql`, `interfaces.ts` |
| 3. requirements | `docs/spec/{要件名}/requirements.md`, `user-stories.md`, `acceptance-criteria.md` |
| 4. specs | `docs/spec/{要件名}/test-specs.md`, `docs/spec/{要件名}/test-cases.md` |

**これらのパスは他スキルの入力になっている。** 例えば `edgecase-analysis` は `docs/spec/{要件名}/requirements.md` を読む。勝手に変更しない。

### サブエージェント制約

機能数が多い場合、フェーズ×機能単位で Task サブエージェント（general-purpose）に委譲する。サブエージェントは Task ツールを使えない（ネスト不可）ため、委譲時は次を守る。

- 該当する `references/phaseN-*.md` の内容をプロンプトに埋め込み、サブエージェント側の Read を最小化する
- コード探索は Glob/Grep/Read を直接使わせる
- TodoWrite は使わせない

## ワークフロー

### Step 0: 機能分割（1回のみ）

**このステップの結果を Step 1〜4 のすべてが共有する。** 各フェーズで分割をやり直すと、`docs/tasks/` と `docs/design/` と `docs/spec/` でディレクトリ名がずれる。

1. 分析対象パスを確定する（引数が無ければリポジトリルート）
2. ディレクトリ構造・設定ファイル（`package.json`, `pyproject.toml`, `pom.xml` 等）・ルーティング定義・DB スキーマを読み、コードベースを**機能単位**（feature 単位）に分解する
3. 各機能に `{要件名}` を付ける:
   - 簡潔な英語に変換する
   - ケバブケース（kebab-case）を使用する
   - 最大50文字程度に収める
   - 例: ユーザー認証 → `user-authentication` / 商品検索 → `product-search` / 注文管理 → `order-management` / 通知配信 → `notification-delivery`
4. 確定した `{要件名}` の一覧をユーザーに提示する。**5件を超える場合は AskUserQuestion で対象を絞ってよいか確認する**（全機能に4フェーズを回すと出力が膨大になるため）
5. 機能が1つも特定できなかった場合は、その旨と調べた範囲を報告して終了する。ディレクトリを作らない

```bash
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
mkdir -p "$PROJECT_ROOT/docs/tasks" "$PROJECT_ROOT/docs/design" "$PROJECT_ROOT/docs/spec"
```

### Step 1: tasks（実装済み機能のタスク逆算）

1. `references/phase1-tasks.md` を Read する
2. 各 `{要件名}` について、実装済みの機能をタスクとして逆算し `docs/tasks/{要件名}/` に出力する
3. タスク ID は `{要件名}` のスコープ内で `TASK-0001` から採番する

### Step 2: design（技術設計文書）

1. `references/phase2-design.md` を Read する
2. Step 1 の `docs/tasks/{要件名}/overview.md` を入力として参照できる
3. 各 `{要件名}` について `docs/design/{要件名}/` に出力する

### Step 3: requirements（EARS 要件定義）

1. `references/phase3-requirements.md` を Read する
2. Step 1・Step 2 の出力を入力として参照できる
3. 各 `{要件名}` について `docs/spec/{要件名}/` に requirements.md / user-stories.md / acceptance-criteria.md を出力する

ここで作る受け入れ基準が Step 4 の根拠になる。**Step 4 より先に完了させること。**

### Step 4: specs（テスト仕様書）

1. `references/phase4-specs.md` を Read する
2. Step 3 の `acceptance-criteria.md` を根拠として、`docs/spec/{要件名}/test-specs.md` と `test-cases.md` を出力する
3. **テストコードは生成しない。** `docs/spec/{要件名}/tests/` を作らない

テストの実装が必要と判断した場合は、Step 5 のレポートで `dev-plan` への引き継ぎを推奨するにとどめる。

### Step 5: 最終レポート

```markdown
## rev-docs 完了レポート

### 対象
- 分析対象: <パス>
- 機能数: X 件（<要件名のリスト>）

### 生成ファイル
| フェーズ | ファイル数 | 出力先 |
|---|---|---|
| tasks | X | docs/tasks/ |
| design | X | docs/design/ |
| requirements | X | docs/spec/ |
| specs | X | docs/spec/ |

### 統計
- 抽出タスク数: X
- API エンドポイント数: X
- テーブル数: X
- 機能要件 / 非機能要件: X / X
- テストケース: X（うち実装済み X）

### 🟡 確認が必要な推定
- [推定した内容と、その根拠が弱い理由]

### 🔴 人間の判断が必要な項目
- [組織固有のポリシーや意図に依存し、コードからは決められない項目]

### 次のアクション
- [不足しているテスト・ドキュメントと、dev-plan への引き継ぎ提案]
```

## 信号機システム

逆生成した記述の各項目に確信度を付与する。**逆生成は推定を含むため、根拠の強さを必ず明示する。**

- 🔵 **コードに明記**: 実装・型定義・テストから直接読み取れる（API のシグネチャ、DB スキーマ、バリデーションルール）
- 🟡 **妥当な推測**: 実装パターンから合理的に導けるが、明示的な根拠は無い（ユーザーストーリーの WHY、非機能要件の目標値）
- 🔴 **AI 推論補完**: 組織の意図やポリシーに依存し、コードからは決められない（優先度、将来の拡張方針、業務上の制約）

🔴 が付いた項目は Step 5 のレポートに集約し、ユーザーに確認を促す。

## ルール・制約

- **フェーズ順序を変えない**（tasks → design → requirements → specs）。requirements は specs より先
- **`{要件名}` は Step 0 で1回だけ決める。** 各フェーズで決め直さない
- 出力先パス（`docs/tasks/` `docs/design/` `docs/spec/`）を変更しない。他スキルの入力になっている
- **テストコードを生成しない。** Step 4 の出力は仕様書のみ
- 既存の出力ディレクトリがある場合は、上書きしてよいかユーザーに確認する
- 推定した内容には必ず信号機を付ける。根拠のない断定をしない
- **強制モードが有効なプロジェクト（`.claude/enso.json` の `enforce.enabled: true`）では、保護ブランチ上での実行が `hooks/guard-edit.mjs` に deny される。** その場合は worktree 内で実行するようユーザーに案内する
- Bash コマンドはプロジェクトルートの **絶対パス** を使う。worktree セッション中はコマンド置換（`$(...)`）で組み立てず、確定済みの絶対パスを直接書く
- すべてのファイルは500行以内

## 追加リソース

### リファレンスファイル

- **`references/phase1-tasks.md`** — Step 1 の分析手順と `overview.md` / `TASK-XXXX.md` の出力フォーマット、分析対象ファイルの自動検出ルール
- **`references/phase2-design.md`** — Step 2 の分析手順と architecture / dataflow / api-endpoints / database-schema / interfaces の出力フォーマット
- **`references/phase3-requirements.md`** — Step 3 の分析手順、EARS 記法の分類定義、requirements / user-stories / acceptance-criteria の出力フォーマット
- **`references/phase4-specs.md`** — Step 4 の分析手順と test-specs / test-cases の出力フォーマット、テストケース抽出アルゴリズム
