---
id: "002"
title: "enso-tidy スキルを作成し、判断軸と蓄積ファイルの削除を実装する"
status: done
priority: 1
dependencies: []
estimated_complexity: high
---

# Task: enso-tidy スキルを作成し、判断軸と蓄積ファイルの削除を実装する

## Goal

enso 本体と enso を導入したプロジェクトを整頓する Entry スキル `skills/enso-tidy/SKILL.md` を新規作成する。本タスクでは、スキル全体の枠組み（モード・Step 構成）、判断軸（整頓と無駄の排除 / 定期的に削除してよいファイル）、明示した蓄積ファイルの削除（削除 PR → dev-cleanup でマージ）までを実装する。冗長・無駄の点検と dev-plan への引き継ぎはタスク 003 で追加する。

## Interfaces

```yaml
# frontmatter                                                                        🔵
name: enso-tidy
description: This skill should be used when the user asks to "enso-tidy", "tidy", "enso を整頓", "不要ファイルを削除", "古い計画を削除", "蓄積したファイルを整理", "冗長な記述を点検", "月次の整理". enso 本体と enso を導入したプロジェクトを整頓する。定期的に消してよい蓄積ファイル（マージ済み計画・古いレポート・修正済み webtest エラー・一時ファイル等）を削除 PR にまとめてマージを dev-cleanup に引き継ぎ、AI 開発の設定とドキュメントの冗長・無駄を点検して、直す項目を dev-plan に引き継ぐ。
```

SKILL.md の「## 判断軸」節（ユーザーと合意した文言。この節は削除・点検の両方の基準になる）:

```markdown
## 判断軸

### 1. 整頓と無駄の排除

- **第一優先は整頓と無駄の排除。** ただし、消す・まとめることで手順・分岐・判定が複雑になるなら行わない。見送った理由を報告に残す
- **挙動を変えない。** 消してよいのは「読まれない」「同じ内容が他にある」「再生成できる」ものだけ
- **迷ったら残す。** 誤って消すコスト（作業の喪失）は、残すコスト（容量）より大きい
- **消す理由を1行で言えないものは消さない**

### 2. 定期的に削除してよいファイル

次の**すべて**を満たすものだけを削除対象にする。

| 条件 | 確認すること |
|---|---|
| 後で読む処理が無い | スキル・hooks・スクリプトがそのファイルを参照しない。参照されるなら、参照される版（最新・open など）は残す |
| 進行中の作業に使われていない | 未完了の計画、未マージの PR、worktree が残る計画に属さない |
| 失っても作り直せる、または履歴から戻せる | コミット済みなら git 履歴に残る。未追跡なら 1 回の実行の中だけで使う中間ファイルに限る |
| 削除対象の表に、パスと削除条件が明示されている | 表に無いものは、条件を満たしそうでも自動では消さない。点検結果に「削除候補」として出し、人が判断する |

残すものの典型: 次の実行の入力になるもの（`context.md`、画面仕様の `last_synced_commit`、テスト計画の `last-run`）/ 人が明示的に保存を選んだもの、まだ計画にしていないアイデア / 上書き更新で増えないもの
```

削除対象の表（「最新」はファイル名で決める。clone 後の mtime は信用しない）:

| # | 対象 | 削除する条件 | 残すもの |
|---|---|---|---|
| 1 | `docs/dev/plans/<d>/` | loop-state.yaml が `status: shipped` かつ worktree が null または存在しない かつ `gh pr view <n> --json state -q .state` が `MERGED` | それ以外（pr_number null・gh 失敗・OPEN/CLOSED はスキップとして一覧に出す。loop-state.yaml の無いディレクトリは触らない） 🔵 |
| 2 | 残る計画の `reports/` | `^(verify|ipa-security-report)(-.+)?\.(md|sarif)$` を「接頭辞＋拡張子」でまとめ、最新以外 | 固定名（日付なし）があればそれ、無ければ辞書順最大 🟡 |
| 3 | `security-reports/` | `ipa-security-report-YYYY-MM-DD-NN.{md,sarif}` の最新の組以外 | 辞書順最大の組 🔵 |
| 4 | `docs/dev/webtests/errors/<YYYY-MM-DD>-<NNN>-<slug>/` と同名の `tmp/webtest/errors/<同>/` | error.md の frontmatter が `status: fixed` | open・判別不能 🔵 |
| 5 | `docs/dev/webtests/reports/<YYYY-MM-DD>-<plan>.md` | 計画ごとに最新以外 | 計画ごとの最新 🔵 |
| 6 | `docs/uat/<yyyymmdd>[-HHMM]/` | 最新以外 | 辞書順最大 🔵 |
| 7 | `docs/dev/analysis/*_edgecase/` | 最新以外（`_edgecase` 以外は見ない） | 先頭 TIMESTAMP の辞書順最大 🟡 |
| 8 | `.tmp/ipa-security-check/`、`tmp/webtest/{results,plan,update,screenshots}/`、`tmp/screen-spec/` | 存在すれば削除（未追跡・ローカルのみ） | なし 🔵 |

残すもの（触らない）: `docs/dev/context.md`、`docs/dev/screen-specs/`、`docs/dev/webtests/plans/`、`docs/dev/webtests/env-knowledge.md`、rev-docs の出力、`docs/dev/analysis/` の `_edgecase` 以外、`docs/tasks/*/breakdown.md`、open の webtest エラー、未完了の計画。

```yaml
# 削除 PR 用の loop-state.yaml（dev-cleanup とマージ hook を再利用するため）            🔵 policy.mjs はフラットなスカラーのみ読む
# docs/dev/plans/tidy-YYYY-MM-DD/loop-state.yaml
plan_name: tidy-YYYY-MM-DD
status: shipped
branch: worktree-tidy-YYYY-MM-DD
worktree: <worktree の絶対パス>
pr_number: <N>
pr_url: <URL>
task_range: null
```

## Test Strategy

スキル定義（Markdown）なので、scratchpad の一時 git リポジトリに各対象のフィクスチャを置き、SKILL.md の手順どおりに判定をコマンドで確認する（PR 作成・push は行わない）。

- [ ] 「## 判断軸」節が Interfaces の文言どおりにあり、削除対象の表・残すもの一覧と矛盾しない
- [ ] 対象 1: shipped・worktree 無し・MERGED のみ削除候補、shipped・worktree あり / OPEN / pr_number null / failed / awaiting-approval は残る（スキップ理由が出る）
- [ ] 対象 2: `verify-2026-09-01.md` と `verify-2026-09-14.md` → 前者のみ候補。`ipa-security-report.md` と `ipa-security-report-2026-09-13.md` → 後者のみ候補
- [ ] 対象 3〜7 の各フィクスチャで「最新だけ残る」「fixed だけ消える」「_edgecase 以外は見ない」
- [ ] 対象 8 はパターンに完全一致するパスだけを、glob を使わず1パスずつ削除する手順になっている
- [ ] 表に無いファイルは削除しない（点検結果の「削除候補」に回す）と明記されている
- [ ] 削除候補が0件なら worktree も PR も作らない
- [ ] AskUserQuestion の yes/no を経由し、「いいえ」なら何もしない
- [ ] Step 順序: 未追跡の削除（本体）→ EnterWorktree → `git rm` → commit → push → PR → loop-state.yaml → dev-cleanup をメインコンテキストで起動
- [ ] worktree セッション中の Bash が単一の単純なコマンドだけで書かれている（`&&` / `;` / `$(...)` / ヒアドキュメント無し）
- [ ] Draft PR にせず `gh pr ready` を使わない
- [ ] トリガー語が dev-cleanup（掃除 / cleanup / 片付け / 後始末）と重ならない
- [ ] 定期実行（`--scheduled`・クラウドルーティン）の記述が無い
- [ ] `pnpm secretlint` / `pnpm check` が通る

## Implementation Notes

- SKILL.md の構成: frontmatter → 前提知識（2つの役割〔削除 / 点検〕と全体の流れ、enso 本体か導入先かの判定〔`.claude-plugin/plugin.json` の `name` が `enso` なら本体〕）→ 判断軸 → 削除対象の表と残すもの → ワークフロー → ルール・制約 → 追加リソース。点検の Step はタスク 003 が追加するので、ワークフローは「Step 1 前提確認 / Step 2 削除候補の収集 / Step 3 点検（003）/ Step 4 確認 / Step 5 削除 PR / Step 6 dev-plan への引き継ぎ（003）」の骨組みにしておく
- Step 1 前提確認（本体チェックアウト）: worktree の中（`--git-common-dir` ≠ `--git-dir`）なら中断。`git fetch origin` 後に `git merge-base --is-ancestor origin/<base> HEAD` が失敗したら pull を案内して中断。`<base>` は enso.json の `enforce.baseBranch`、無ければ `main`
- Step 2 削除候補の収集（読み取りのみ）: 追跡済み判定は `git ls-files -- <対象パス>` を1回。「追跡済み（PR で削除）」「未追跡（ローカルで削除）」「スキップ（理由つき）」の3区分で件数とパス
- Step 4 確認: 削除候補の一覧を提示し AskUserQuestion（yes/no）
- Step 5 削除 PR:
  - 未追跡の削除を worktree に入る前に本体で行う（1パスずつ `rm -rf <MAIN の絶対パス>/<パス>`。直前にパターン一致と MAIN 配下を確認）。追跡済みが0件ならコミット不要
  - 計画名 `tidy-YYYY-MM-DD`（同月の再実行で衝突しないよう日単位）。`EnterWorktree name: tidy-YYYY-MM-DD` → `git rm -r -- <パス…>` → `git commit -m "chore(tidy): 蓄積ファイルを削除"` → `git push -u origin worktree-tidy-YYYY-MM-DD`
  - PR: `gh pr create --base <base> --title "tidy: 蓄積ファイルの削除 (YYYY-MM-DD)" --body-file <件数表 + 区分ごとのパス一覧（各50件まで）+ スキップ一覧>`。本文ファイルは worktree の `tmp/` に Write で作る
  - loop-state.yaml を Write で作り add / commit / push（フィールドは Interfaces）
  - Skill ツールで `enso:dev-cleanup tidy-YYYY-MM-DD` をメインコンテキストで起動（マージの質問は自分で出さない）
- gh が使えない場合は対象 1 をすべてスキップにして続行（エラー終了しない）
- 互換性の根拠: policy.mjs:178-189 / 240-277 はフラットなスカラーのみ読む、plan.md / tasks/ は hooks・dev-cleanup とも読まない、guard-bash のマージゲートは findLoopStateForPr で pr_number 一致を優先、dev-cleanup Step 3.5 は worktree の絶対パスが前提
- エッジケース分析の TIMESTAMP 形式は実装時に skills/edgecase-analysis/SKILL.md で確認する
- SKILL.md は 500 行以内。タスク 003 の追加分を見越し、削除対象の表の補足説明は簡潔に

## Files

- 新規: skills/enso-tidy/SKILL.md
