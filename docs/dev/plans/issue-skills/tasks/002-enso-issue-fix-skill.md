---
id: "002"
title: "enso-issue-fix スキルを作成する"
status: done
priority: 1
dependencies: []
estimated_complexity: high
---

# Task: enso-issue-fix スキルを作成する

## Goal

Issue 番号を1件受け取り、`dev-plan` が使える要件に翻訳して実装計画の Draft PR まで進めるスキルを新規作成する。コードベースの調査は `dev-plan` Phase 2 に一本化し、本スキルでは行わない。実装は人間の承認後に `dev-loop` が引き継ぐ。将来の並列オーケストレータから呼べるワーカーとして設計する。

## Interfaces

呼び出しインターフェース: 🔵

```
/enso:enso-issue-fix <issue-number>
```

frontmatter: 🔵

```yaml
name: enso-issue-fix
description: This skill should be used when the user asks to "enso-issue-fix", "Issue を修正", "Issue に着手", "Issue を取り込んで修正", "fix issue", "Issue 番号を指定して修正", "#12 を直して". GitHub Issue を1件取得して dev-plan が使える要件に翻訳し、実装計画の Draft PR を作って停止する。実装は人間の承認後に dev-loop が引き継ぐ。
argument-hint: '<issue-number>'
```

Issue 取得の契約: 🔵

```bash
gh issue view <N> --repo yukimnb/enso --json number,title,body,labels,state,url,comments
gh pr list --repo yukimnb/enso --search "<N> in:body" --state all --json number,url,state
gh issue comment <N> --repo yukimnb/enso --body "<進捗>"
```

該当箇所の裏付け（軽量・非対話）: 🔵

Issue 本文から抜き出したパスの実在を確かめるだけ。Grep / Glob による探索は行わない。

| 状況 | `dev-plan` への渡し方 |
|---|---|
| `skills/**` 等のパスが書かれていて実在する | 「確認済みの該当箇所」として渡す |
| 書かれているが実在しない | 渡さず、「パスが古い可能性」を1行添える |
| 記載が無い | 「Phase 2 で特定する」とだけ渡す |

いずれの場合も中断しない。

不変条件（本文に明記する）: 🔵

```
1 Issue = 1 plan = 1 worktree = 1 PR
plan-name = issue-<番号>-<英語スラッグ>
```

対話の有無の分離（本文に表として明記する）: 🔵

| 区分 | ステップ |
|---|---|
| 対話が必要 | 引数なし起動時の Issue 選択 / Issue が closed または既に PR ありのときの続行確認 |
| 引数と状態ファイルで完結 | Issue 取得・plan-name 確定・該当箇所の裏付け・dev-plan・Issue へのコメント |

## Test Strategy

- [ ] frontmatter の `name` が `enso-issue-fix` で、ディレクトリ名 `skills/enso-issue-fix/` と一致する
- [ ] コードベースの調査を行わず `dev-plan` Phase 2 に一本化すること、その理由が SKILL.md に書かれている
- [ ] 引数が Issue 番号のみでフラグを取らないことが frontmatter と Step 0b に書かれている
- [ ] Step 3 が実在確認のみで、Grep / Glob による探索を禁じていることが書かれている
- [ ] Step 3 で中断しない（該当箇所が不明でも計画に進む）ことが書かれている
- [ ] `dev-plan` を **Lightweight 固定**で呼ぶことが書かれている
- [ ] `plan-name` が `issue-<番号>-<英語スラッグ>` である規則が書かれている
- [ ] 「1 Issue = 1 plan = 1 worktree = 1 PR」が不変条件として独立した見出しで明記されている
- [ ] PR 本文に `Closes #<番号>` を含める指示が dev-plan への引き渡し内容に含まれている
- [ ] Draft PR で停止し `dev-loop` を呼ばないこと、実装は人間の承認後であることが明記されている
- [ ] 停止時の提示に「Issue のどの記述をどう解釈したか」を含める指示がある
- [ ] 承認後に `dev-loop` が行うこと（中断条件を含む）が参考として書かれている
- [ ] `bug-analysis` を呼び出さないこと、深い分析が要る場合はユーザーが単独で実行することが書かれている
- [ ] 異常系: Issue が `closed` のときの続行確認が書かれている
- [ ] 異常系: 同じ Issue に紐づく PR が既に存在するときの二重着手防止が書かれている
- [ ] 異常系: 引数の Issue 番号が存在しない / `gh` 未認証のときに中断する手順がある
- [ ] エッジケース: 引数なしで起動したときに Open Issue 一覧から1件選ばせる手順がある
- [ ] 並列化の前提（同一 Issue の重複割当禁止・plan-name と worktree 名の一意性・同時実行数の上限）が「将来の拡張」節に書かれている
- [ ] `SKILL.md` が 500 行以内

## Implementation Notes

- 参照すべき既存コード:
  - `skills/dev-loop/SKILL.md` — 前段スキルから後段へ繋ぐスキルの書き方、中断条件の表、`loop-state.yaml` の扱い
  - `skills/dev-plan/SKILL.md` の Phase 2 — Plan サブエージェントによる調査の範囲。ここと重複する処理を `enso-issue-fix` に持たせない
  - `skills/dev-plan/SKILL.md` — Phase 0 のモード選択、Phase 0.7 の worktree 作成、Phase 5 の Draft PR と `loop-state.yaml`
- `dev-plan` は Phase 0 で AskUserQuestion によるモード選択を行う。Draft PR までを対話なしで走り切るため、呼び出し時に「Lightweight を選択する」と明示して渡す
- worktree は `dev-plan` の Phase 0.7 が作る。`enso-issue-fix` 側では作らない（二重作成になる）
- `dev-loop` は**メインコンテキストで実行する**必要がある（サブエージェントのネスト不可）。`enso-issue-fix` からサブエージェント経由で呼ばないこと
- `dev-plan` に渡す要件テキストが長くなるため、`references/plan-request-template.md` にテンプレートとして切り出す
- Issue へのコメントは着手時（plan / PR の URL）と完了時（結果）の2回
- 投稿先は `enso-issue-report` と対になるよう `yukimnb/enso` を既定とし、その旨を本文に明記する

## Files

- 新規: `skills/enso-issue-fix/SKILL.md`
- 新規: `skills/enso-issue-fix/references/plan-request-template.md`
