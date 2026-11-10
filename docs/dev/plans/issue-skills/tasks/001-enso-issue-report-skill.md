---
id: "001"
title: "enso-issue-report スキルを作成する"
status: done
priority: 1
dependencies: []
estimated_complexity: medium
---

# Task: enso-issue-report スキルを作成する

## Goal

enso の不具合・改善要望を `yukimnb/enso` に Issue として起票するスキルを新規作成する。他プロジェクトで作業中でも報告できるよう、投稿先リポジトリを固定する。

## Interfaces

呼び出しインターフェース:

```
/enso:enso-issue-report [問題の概要（任意）]
```

frontmatter（既存スキルの規約に準拠）: 🔵

```yaml
name: enso-issue-report
description: This skill should be used when the user asks to "enso-issue-report", "enso に問題を報告", "enso の不具合を報告", "Issue を作成", "Issue を起票", "report enso issue", "create issue", "enso の改善要望". enso 本体（スキル定義・hooks・コマンド・ドキュメント）の問題を対話で整理し、yukimnb/enso に GitHub Issue を作成する。
argument-hint: '[問題の概要（任意）]'
```

外部コマンドの契約: 🔵

```bash
gh auth status
gh search issues --repo yukimnb/enso "<キーワード>" --state all --limit 10
gh issue list --repo yukimnb/enso --state all --limit 20
gh issue create --repo yukimnb/enso --title "<タイトル>" --body-file <path> --label "<label>"
```

ワークフローの段階: 🔵

| Step | 内容 |
|---|---|
| 0 | `gh auth status` で前提確認。未認証なら `gh auth login` を案内して中断 |
| 1 | AskUserQuestion で種別 / 発生箇所 / 再現性 / 影響度を収集 |
| 2 | 症状・期待動作・実際の動作・再現手順を自由記述でヒアリング |
| 3 | 環境情報を自動収集（enso の version とコミット、OS、該当ファイル） |
| 4 | 重複候補を検索し、あれば提示して 新規作成 / 既存へコメント / 中止 を選ばせる |
| 5 | Issue 本文を組み立て、**全文をユーザーに提示して承認を得る** |
| 6 | `gh issue create` で作成 |
| 7 | 番号と URL を表示し、`/enso:enso-issue-fix <番号>` を案内 |

## Test Strategy

- [ ] frontmatter の `name` が `enso-issue-report` で、ディレクトリ名 `skills/enso-issue-report/` と一致する
- [ ] `description` が既存スキルと同じ「トリガーワード列挙 → 日本語の機能説明」形式になっている
- [ ] 本文が `## 前提知識` → `## ワークフロー` → `## ルール・制約` → `## 追加リソース` の構成になっている
- [ ] 投稿先が `yukimnb/enso` 固定であることが本文に明記され、全ての `gh` コマンドに `--repo yukimnb/enso` が付いている
- [ ] ラベルの選択肢が実在する3つ（`bug` / `enhancement` / `documentation`）に限定されている
- [ ] Step 5 の「ユーザー承認なしに Issue を作成しない」がルール・制約に明記されている
- [ ] 異常系: `gh` が未認証のときに中断して案内する手順が Step 0 に書かれている
- [ ] 異常系: 重複候補が見つかったときの3分岐（新規 / 既存へコメント / 中止）が書かれている
- [ ] エッジケース: 本文に機密情報（トークン、絶対パス中のユーザー名、社内リポジトリ名）を含めない注意がルール・制約にある
- [ ] `SKILL.md` が 500 行以内（リポジトリ規約）

## Implementation Notes

- 参照すべき既存コード: `skills/enso-policy/SKILL.md`（設定操作系スキルの書き方）、`skills/bug-analysis/SKILL.md`（ヒアリング表と信号機の書式）
- スキルは `skills/enso-issue-report/SKILL.md` の1階層構成。**ネストしたディレクトリは読み込まれない**
- Issue 本文テンプレートは肥大化するので `references/issue-template.md` に切り出す
- ラベルは `gh label list --repo yukimnb/enso` で実在を確認済み: `bug` / `documentation` / `enhancement` / `duplicate` / `help wanted` / `good first issue` / `invalid` / `question` / `wontfix`
- 環境情報は `~/.claude/skills/enso/.claude-plugin/plugin.json` の `version` を読む。git 管理外にコピーされている可能性があるため、コミットハッシュは取得できたときだけ載せる
- `plugin.json` はディレクトリ単位の指定なので、**スキルを増やしてもマニフェストの変更は不要**
- 本文・ヒアリングはすべて日本語

## Files

- 新規: `skills/enso-issue-report/SKILL.md`
- 新規: `skills/enso-issue-report/references/issue-template.md`
