# Plan: growing-files

## Requirements Summary

enso を使うほど増え続けるファイルと毎プロンプトの注入を抑え、enso 本体と enso を導入したプロジェクトを継続的に整頓できるようにする。**1つのスキル（新規 `enso-tidy`）の実行で、(1) 定期的に削除しても SDD / TDD の流れを壊さない蓄積ファイルを削除し、(2) AI 開発の設定とドキュメントの冗長・無駄を点検して直す項目を dev-plan に引き継ぐ。** 定期実行の仕組み（クラウドルーティン）は今回は作らない。

判断軸（ユーザーと合意。正本は enso-tidy の SKILL.md、要約を CLAUDE.md にも置く）:

1. **整頓と無駄の排除**: 第一優先。ただし複雑になるなら行わず理由を残す / 挙動を変えない / 迷ったら残す / 消す理由を1行で言えないものは消さない
2. **定期的に削除してよいファイル**: 後で読む処理が無い / 進行中の作業に使われていない / 失っても作り直せる・履歴から戻せる / 削除対象の表にパスと削除条件が明示されている（表に無いものは自動で消さず「削除候補」として提示）

合意した選別:

| 区分 | 対象 |
|---|---|
| 削除する | マージ済みの計画ディレクトリ / 残る計画の古いレポート（種類ごとに最新を残す）/ `security-reports/` の最新以外 / `status: fixed` の webtest エラー記録とスクリーンショット / webtest 実行レポートの計画ごとの最新以外 / UAT 試験項目の最新以外 / edgecase 分析の最新以外 / 作業用の中間ファイル（`.tmp/ipa-security-check/`、`tmp/webtest/`、`tmp/screen-spec/`） |
| 残す | `docs/dev/context.md` / `docs/dev/screen-specs/` / `docs/dev/webtests/plans/` / `docs/dev/webtests/env-knowledge.md` / rev-docs の出力 / rubber-duck の相談記録 / `docs/tasks/*/breakdown.md` / open の webtest エラー / 未完了の計画 |

点検の範囲: enso 本体では skills / hooks・scripts・設定 / ドキュメント全体。enso を導入したプロジェクトでは AI 開発の設定とドキュメント（CLAUDE.md、`.claude/`、`docs/dev/`、README 等）で、ソースコードは含めない。

関連して次の3つも直す:

- 状態一覧の注入: 毎プロンプト全計画（現在 20 件）を並べているのを、未完了の計画だけにして完了済みは件数のみにする
- セキュリティゲート: `gh pr ready` が「どれかの計画にレポートがあれば通る」のを、対象 PR の計画の reports/ だけを見るようにする（削除の有無で判定が変わらないように）
- ipa レポート名: dev-loop からの出力を計画ごとの固定名にし、日付違いのレポートが増えないようにしてトリアージの引き継ぎを効かせる

## Design Overview

| 要素 | 設計 |
|---|---|
| enso-tidy の流れ | Step 1 前提確認（本体チェックアウト・main 最新・enso 本体か導入先かを判定）→ Step 2 削除候補の収集と Step 3 点検（読み取りのみのサブエージェントを領域ごとに並列）→ Step 4 1回の AskUserQuestion で「削除する / しない」と「直す指摘」を選ぶ → Step 5 削除 PR（未追跡をローカル削除 → worktree で `git rm` → PR → loop-state.yaml → dev-cleanup）→ Step 6 選んだ指摘を要件テキストにして dev-plan を起動 |
| dev-cleanup との接続 | 削除 PR 用に `docs/dev/plans/tidy-YYYY-MM-DD/loop-state.yaml`（status shipped / pr_number / worktree）を置く。hooks と dev-cleanup はフラットなスカラーだけを読み、plan.md / tasks/ を要求しないので、変更なしで既存のマージゲートと承認記録が使える。そのディレクトリ自体は次回の実行で削除対象になる |
| 点検結果 | 会話に提示し、ファイルには保存しない（新たな蓄積ファイルを作らない。worktree 外への書き込みを避ける） |
| 「最新」の判定 | ファイル名（日付・連番の辞書順）で決める。clone 後の mtime は信用しない。固定名（日付なし）のレポートは最新として扱う |
| hooks | policy-context は完了済み（shipped かつ worktree 無し。NEXT_ACTIONS と同じ条件）を件数だけにする。guard-bash の ready ゲートはマージゲートと同じ方法で対象 PR の計画を解決し、その reports/ だけを見る。計画が見つからなければ ask（マージゲートと同じ） |

### 挙動が変わる点（PR 本文に明記）

- 毎プロンプトの注入から完了済みの計画の一覧が消え、件数1行になる
- `gh pr ready` は対象 PR の計画にレポートが無ければ deny（従来は他の計画のレポートでも通過）。対象 PR の計画が見つからなければ ask
- dev-loop からの ipa レポートが `reports/ipa-security-report.md(.sarif)` に固定される

### 見送り

| 項目 | 理由 |
|---|---|
| 定期実行（クラウドルーティン・無人モード） | ユーザーの判断で今回は作らない |
| 導入先プロジェクトのソースコードの点検 | ユーザーの判断で対象外。時間とトークンが大きく、コード品質は simplify / code-review の範囲 |
| 点検結果のファイル保存 | 新たな蓄積ファイルになる。会話と dev-plan の要件で足りる |
| 点検で見つけた問題の自動修正 | 検証・承認の仕組みを作り直すことになる。dev-plan → dev-loop を通す |
| 保持期間（日数・N 世代）の設定、mtime や git log による判定 | 設定項目と分岐が増える。最新1つを残す固定ルールで足りる |
| 他の worktree 配下にある計画の走査 | 本体チェックアウトだけを見る。worktree がある計画はそもそも削除対象外 |
| 既存計画の日付付き ipa レポートを固定名へ移行 | 削除対象 2 が最新以外を消すので自然に解消する |
| rubber-duck の相談記録の自動削除 | 未計画の PRD を含みうる。点検の「削除候補」として人が判断する |
| `gh pr ready -R owner/repo` などのオプション解析 | 既知の別件（redundancy-cleanup の plan.md に記録済み） |

## Task Dependency Graph

```
001 hooks（注入・ゲート）──────────────> 004 ipa 固定名・削除済み計画の除外 ─┐
002 enso-tidy（判断軸・削除）─> 003 enso-tidy（点検・dev-plan 引き継ぎ）───┼─> 005 README / MANUAL / CLAUDE.md
001 ───────────────────────────────────────────────────────────────────────┘
```

| ID | タイトル | 複雑度 | 依存 |
|---|---|---|---|
| 001 | 注入する計画一覧を未完了に絞り、セキュリティゲートを対象 PR の計画に限定する | medium | - |
| 002 | enso-tidy スキルを作成し、判断軸と蓄積ファイルの削除を実装する | high | - |
| 003 | enso-tidy に冗長・無駄の点検と dev-plan への引き継ぎを追加する | medium | 002 |
| 004 | ipa レポート名を計画内で固定し、削除済み計画を拾わないようにする | low | 001 |
| 005 | enso-tidy をドキュメントに追加し、判断軸を CLAUDE.md に記載する | low | 001, 002, 003, 004 |

001 と 002 は別ファイルなので並行できる。003 は 002 と同じ SKILL.md、004 は 001 と同じ dev-loop Step 8、005 は 001・004 と同じ MANUAL.md に触るため順に行う。

## Cross-Plan Dependencies

- redundancy-cleanup（PR #35）で見つけた「`gh pr ready` のセキュリティゲートが対象 PR の計画に紐付いていない（low）」をタスク 001 で解消する

## 範囲外で見つかった別件（Issue 候補）

- マージゲート（`gh pr merge`）は、明示した PR 番号に一致する計画が無いと現在のブランチの計画にフォールバックし、コマンド内の最初の1件しか検査しない。ready ゲートは本計画の修正サイクル1で直したが、マージゲートは挙動が変わるため触っていない（承認記録が24時間以内にある計画の worktree 内でのみ影響）
- `gh pr ready` で対象 PR の計画が解決できないときは ask になる（low。計画上の設計判断。enso 外の PR を ready にできなくならないようにするため）。厳格にしたい場合は `enforce` に deny を選べる設定を足す案がある
- `gh pr ready <URL>` / `gh pr merge <URL>` は URL 末尾の番号だけで計画を照合し、owner/repo を見ない（low。merge 側に元からあった解析を ready と共有したもの）。loop-state の `pr_url` と照合すれば解消できる
- warn モードでは、レポートが無い ready の warn が即 return し、同じコマンド内の ask（計画が解決できない ready / merge）が出ない（low。deny / ask モードでは弱まらない。verify → fix の上限 2 サイクルに達したため記録のみ）。レポート無しの判定も `decide` を通して warn を ask に上げれば解消できる
