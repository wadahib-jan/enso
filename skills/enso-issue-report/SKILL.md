---
name: enso-issue-report
description: This skill should be used when the user asks to "enso-issue-report", "issue-report", "enso に問題を報告", "enso の不具合を報告", "Issue を作成", "Issue を起票", "report enso issue", "create issue", "enso の改善要望", "このスキルの挙動がおかしい". enso 本体（スキル定義・hooks・コマンド・ドキュメント）の問題を対話で整理し、yukimnb/enso に GitHub Issue を作成する。作業中のプロジェクトがどこであっても enso に報告できる。
argument-hint: '[問題の概要（任意）]'
---

# Enso Issue Report（enso への問題報告）

enso を使っていて気づいた不具合・改善要望を、対話で整理して GitHub Issue にする。修正は `enso-issue-fix` が引き継ぐ。

## 前提知識

### 使いどころ

**enso 自体の仕組みに問題があるとき。** 利用中のプロジェクトのコードの問題ではない。

```
[enso のスキルが期待どおり動かない / hooks に阻まれる / ドキュメントが実装と食い違う]
        ↓
   enso-issue-report  ← ここ（起票）
        ↓ Issue #N
   enso-issue-fix <N> （原因分析 → 計画 → 実装 → PR）
```

### 投稿先は yukimnb/enso 固定

**名前の `enso-` は「enso 自体を対象にする」という意味である。** 汎用の Issue 起票スキルではない。

enso は user スコープ（`~/.claude/skills/enso`）に置かれ、**全プロジェクトから使われる**。問題に気づくのは enso のリポジトリで作業しているときとは限らない。そのため本スキルは投稿先を固定し、`gh` の全コマンドに `--repo yukimnb/enso` を明示する。

```
TARGET_REPO = yukimnb/enso
```

**カレントリポジトリには起票しない。** 利用中のプロジェクトの Issue を立てたい場合は本スキルの対象外なので、その旨を伝えて終了する。

### 報告対象の切り分け

| 症状 | 対象か |
|---|---|
| スキルが指示どおりに動かない、途中で止まる | ✅ enso の問題 |
| hooks が正当な操作をブロックする / すべきブロックをしない | ✅ enso の問題 |
| README / MANUAL の記述が実装と食い違う | ✅ enso の問題 |
| スキルの出力の質が低い、手順を増やしてほしい | ✅ enso の問題（`enhancement`） |
| 利用中プロジェクトのテストが落ちる、ビルドが通らない | ❌ `dev-debug` の担当 |
| 利用中プロジェクトのコードのバグ | ❌ enso の対象外（素の依頼で調査し `dev-debug` で修正する） |

判断がつかない場合は Step 1 のヒアリングで切り分ける。

### 使えるラベル

`yukimnb/enso` に存在するラベルのうち、本スキルが付与するのは次の3つに限る。

| ラベル | 用途 |
|---|---|
| `bug` | 期待どおりに動かない |
| `enhancement` | 新機能・既存スキルの改善要望 |
| `documentation` | README / MANUAL / スキル本文の記述の誤り・不足 |

`duplicate` / `wontfix` 等はメンテナが付けるものなので本スキルでは付けない。

## ワークフロー

### Step 0: 前提確認

```bash
gh auth status
```

未認証、または `gh` が見つからない場合は **中断する**。`gh auth login` の実行を案内して終了する。ここで進んでも Step 6 で必ず失敗する。

### Step 1: 基本情報の収集

引数がある場合は、その内容を1〜2文で言い換えてユーザーに提示し、認識が合っているか示す。

AskUserQuestion で以下を順に確認する。

| # | 質問 | header | 選択肢 |
|---|------|--------|--------|
| 1 | どの種類の報告ですか？ | 種別 | 不具合（bug）/ 改善要望（enhancement）/ ドキュメントの誤り（documentation） |
| 2 | どこで起きていますか？ | 発生箇所 | スキル定義（`skills/`）/ hooks・強制モード（`hooks/`）/ ドキュメント（README・MANUAL）/ 分からない |
| 3 | 再現しますか？ | 再現性 | 常に発生 / 特定条件で発生 / 一度だけ発生 / まだ再現していない |
| 4 | どの程度困っていますか？ | 影響度 | 作業がブロックされる / 回避策はあるが手間 / 軽微・気になる程度 |

### Step 2: 詳細のヒアリング

自由記述で以下を聞く。**すでに引数や会話から分かっているものは聞き直さない。**

- **症状** — 何が起きたか
- **期待した動作** — どうなるはずだったか
- **実際の動作** — 代わりに何が起きたか
- **再現手順** — どのスキルをどう起動したか（Step 1 の再現性が「まだ再現していない」なら省略可）
- **エラーメッセージ** — あれば原文のまま

`enhancement` の場合は「症状／期待／実際」の代わりに **解決したい課題** と **提案する挙動** を聞く。

### Step 3: 環境情報の収集

以下を Bash で自動収集する。**取得できなかった項目は空欄にせず「取得できず」と書く。**

```bash
# enso のバージョン（投入先を見る。リポジトリではなく実際に動いている方）
cat ~/.claude/skills/enso/.claude-plugin/plugin.json

# 投入元リポジトリが手元にあればコミットも添える（無ければスキップ）
git -C ~/.claude/skills/enso rev-parse --short HEAD 2>/dev/null

# OS
uname -srm

# Claude Code のバージョン
claude --version 2>/dev/null
```

Step 1 の発生箇所から**該当ファイルの候補**を特定する。`skills/<name>/SKILL.md` のように具体的なパスまで絞れると、`enso-issue-fix` と `dev-plan` が探索を省いてそこから調査を始められる。特定できたら本文の「該当箇所」に書く。

### Step 4: 重複チェック

**新規作成の前に必ず実行する。** 症状から2〜4語のキーワードを抜き出して検索する。

```bash
# gh search issues の --state は open|closed のみ。all は指定できないので省略する（省略で両方が対象）
gh search issues --repo yukimnb/enso "<キーワード>" --limit 10
gh issue list --repo yukimnb/enso --state all --limit 20
```

候補が見つかった場合は、番号・タイトル・状態（open/closed）を一覧で提示し、AskUserQuestion で選ばせる。

| 選択肢 | 動作 |
|---|---|
| 新規に Issue を作成する | Step 5 へ |
| 既存の Issue にコメントを追記する | `gh issue comment <N> --repo yukimnb/enso --body-file <path>` で追記し、Step 7 へ |
| 中止する | 何もせず終了する |

候補が無ければそのまま Step 5 に進む。

### Step 5: 本文の組み立てと承認

`references/issue-template.md` を Read し、種別に対応するテンプレートを Step 1〜3 の内容で埋める。

タイトルは **症状が一文で分かる形**にする。スキル名を先頭に置くと検索しやすい。

- 良い例: `dev-plan: worktree 内で pnpm check が prepare の失敗で落ちる`
- 悪い例: `バグがあります` / `dev-plan の件`

組み立てた**タイトルと本文の全文をユーザーに提示し、承認を得る。** 承認前に `gh issue create` を実行してはならない。修正の指示があれば反映して再提示する。

### Step 6: Issue の作成

本文を一時ファイルに書き出してから作成する。**本文をシェルコマンドに直接展開しない**（改行・バッククォート・`$(...)` が含まれうるため、`--body` に直接渡さない）。タイトルも同様に、シェルのメタ文字が解釈されない形で渡す。

```bash
gh issue create --repo yukimnb/enso \
  --title "<タイトル>" \
  --body-file <一時ファイルのパス> \
  --label "<bug | enhancement | documentation>"
```

失敗した場合は、組み立てた本文を失わないようファイルパスを提示したうえでエラー内容を報告する。

### Step 7: 完了報告と導線

```
Issue を作成しました: #<番号>
<URL>

修正に進む場合は `/enso:enso-issue-fix <番号>` を実行してください。
Issue を要件に翻訳して実装計画を立て、Draft PR にしたところで確認を求めます。
```

既存 Issue へのコメント追記だった場合も、同じ形式で番号と URL を提示する。

## ルール・制約

- **ユーザーの承認なしに Issue を作成しない。** Step 5 で全文を提示すること。外部に公開される投稿であり、取り消しても検索インデックスには残りうる
- **投稿先は `yukimnb/enso` 固定。** 全ての `gh` コマンドに `--repo yukimnb/enso` を付ける
- **Step 4 の重複チェックを飛ばさない。** 同じ問題が何度も立つとトリアージのコストになる
- **機密情報を本文に含めない。** 具体的には次を書き換えるか伏せる
  - トークン・API キー・パスワード（`gh auth status` の出力をそのまま貼らない）
  - 絶対パス中のユーザー名（`/home/<user>/...` → `~/...`）
  - 業務プロジェクト名・社内リポジトリ名・顧客名（`<project>` 等に置き換える）
  - エラーログを貼る場合は上記を除去してから貼る
- 本文・ヒアリングはすべて**日本語**で書く
- 付与するラベルは `bug` / `enhancement` / `documentation` の3つに限る
- 利用中プロジェクトのコードの問題は本スキルの対象外。`dev-debug` を案内して終了する
- 種別が判断できない場合は `bug` を選ばず、ユーザーに確認する

## 追加リソース

- **`references/issue-template.md`** — 種別ごとの Issue 本文テンプレート（bug / enhancement / documentation）

### 関連スキル

| スキル | 関係 |
|---|---|
| `enso-issue-fix` | 起票した Issue を取り込んで修正する。本スキルの出口 |
| `dev-debug` | **利用中プロジェクト**のテスト失敗・ビルドエラーの修正。enso 自体の問題ではない場合はこちら |
| `enso-policy` | 強制モードの設定。hooks の挙動が意図と違う場合、まず設定を確認する |
