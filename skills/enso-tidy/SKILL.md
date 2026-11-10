---
name: enso-tidy
description: This skill should be used when the user asks to "enso-tidy", "tidy", "enso を整頓", "不要ファイルを削除", "古い計画を削除", "蓄積したファイルを整理", "冗長な記述を点検", "月次の整理". enso 本体と enso を導入したプロジェクトを整頓する。定期的に消してよい蓄積ファイル（マージ済み計画・古いレポート・修正済み webtest エラー・一時ファイル等）を削除 PR にまとめてマージを dev-cleanup に引き継ぎ、AI 開発の設定とドキュメントの冗長・無駄を点検して、直す項目を dev-plan に引き継ぐ。
---

# Enso Tidy（整頓）

enso を使うほど増えるファイルを消し、設定とドキュメントの冗長・無駄を点検する。**消す・直すの判断は「判断軸」節に従い、確認は Step 4 の1回だけ**にまとめる。

## 前提知識

### 2つの役割

| 役割 | 内容 | 出口 |
|---|---|---|
| 削除 | 「削除対象」表に明示した蓄積ファイルを消す | 未追跡はローカルで削除、追跡済みは削除 PR → `dev-cleanup` がマージ |
| 点検 | 設定とドキュメントの冗長・無駄を読み取りのみで洗い出す | 直す指摘を要件にして `dev-plan` へ |

```
Step 1 前提確認 → Step 2 削除候補の収集 ─┐
                  Step 3 点検 ────────────┴→ Step 4 確認【1回】→ Step 5 削除 PR → dev-cleanup
                                                                  → Step 6 dev-plan への引き継ぎ
```

**どちらの役割も、ファイルを変える前に Step 4 を必ず通る。** 削除だけ・点検だけの実行もできる。

### 本体か導入先か

`.claude-plugin/plugin.json` の `name` が `enso` なら **enso 本体**、それ以外（ファイルが無い場合を含む）は **導入先**。点検の範囲がこれで変わる。削除の手順は共通。

### 本体チェックアウトで実行する

削除候補の収集と未追跡の削除は**本体チェックアウト**に対して行い、追跡済みの削除だけを worktree に入って PR にする。worktree の中から実行すると、他の worktree の計画と本体の状態を取り違えるため中断する。

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

## 削除対象

**「最新」はファイル名の辞書順（ASCII のバイト順）で決める。** clone 後の mtime は信用しない。`ls` の表示順にも頼らず、名前を比べて決める。パスは本体チェックアウトのルートからの相対パス。

| # | 対象 | 削除する条件 | 残すもの |
|---|---|---|---|
| 1 | `docs/dev/plans/<d>/` | `loop-state.yaml` が `status: shipped` かつ `worktree` が null または存在しない かつ PR の state が `MERGED` | それ以外（`pr_number` null・gh 失敗・`OPEN` / `CLOSED` はスキップとして一覧に出す）。`loop-state.yaml` の無いディレクトリは触らない |
| 2 | 残る計画の `reports/` | 名前パターン 2 に一致するものを「接頭辞＋拡張子」でまとめ、最新以外 | 固定名（`verify.md` / `ipa-security-report.md` など日付なし）があればそれ、無ければ辞書順最大 |
| 3 | `security-reports/` | 名前パターン 3 に一致するもの。拡張子を除いた名前を「組」とし、最新の組以外 | 辞書順最大の組（`.md` と `.sarif` の両方） |
| 4 | `docs/dev/webtests/errors/<YYYY-MM-DD>-<NNN>-<slug>/` と同名の `tmp/webtest/errors/<同>/` | 名前パターン 4 に一致し、`error.md` の frontmatter の `status` が `fixed` | `open`・判別不能 |
| 5 | `docs/dev/webtests/reports/<YYYY-MM-DD>-<plan>.md` | 名前パターン 5 に一致するもの。`<plan>` ごとに最新以外 | `<plan>` ごとの辞書順最大 |
| 6 | `docs/uat/<yyyymmdd>[-HHMM]/` | 名前パターン 6 に一致するもの。最新以外 | 辞書順最大 |
| 7 | `docs/dev/analysis/<TIMESTAMP>_<name>_edgecase/` | 名前パターン 7 に一致するもの（TIMESTAMP は `date +%Y%m%d%H%M%S`）。最新以外 | 辞書順最大。`_edgecase` で終わるがパターン 7 に一致しないものは判別不能として残す |
| 8 | `.tmp/ipa-security-check/`、`tmp/webtest/results/`、`tmp/webtest/plan/`、`tmp/webtest/update/`、`tmp/webtest/screenshots/`、`tmp/screen-spec/` | 存在すれば削除（未追跡・ローカルのみ） | なし |

名前パターン（ERE。ディレクトリ・ファイルの名前だけに当てる）:

```text
2: ^(verify|ipa-security-report)(-.+)?\.(md|sarif)$
3: ^ipa-security-report-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2}\.(md|sarif)$
4: ^[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{3}-.+$
5: ^[0-9]{4}-[0-9]{2}-[0-9]{2}-(.+)\.md$        # (.+) が <plan>
6: ^[0-9]{8}(-[0-9]{4})?$
7: ^[0-9]{14}_.+_edgecase$
```

- 名前パターンに一致しないファイル・ディレクトリは、同じ場所にあっても**触らない**
- 対象 2 は、対象 1 で「`pr_number` が null」「`CLOSED`」「gh 失敗」のためにスキップした計画（shipped かつ worktree が残らない）だけを見る。未完了・worktree が残る・PR が `OPEN` の計画は進行中として見ない
- 対象 8 は追跡済みなら削除せずスキップにする（表の前提と違うため人が判断する）

**残すもの（触らない）**: `docs/dev/context.md`、`docs/dev/screen-specs/`、`docs/dev/webtests/plans/`、`docs/dev/webtests/env-knowledge.md`、rev-docs の出力、`docs/dev/analysis/` の `_edgecase` 以外、`docs/tasks/*/breakdown.md`、open の webtest エラー、未完了の計画。

## ワークフロー

### Step 1: 前提確認

本体チェックアウトのルートの絶対パスを `<MAIN>` とし、以降のコマンドで直接書く。1 コマンドずつ実行する。

```bash
git rev-parse --show-toplevel
git rev-parse --git-dir
git rev-parse --git-common-dir
```

| 確認 | 失敗したとき |
|---|---|
| `--git-dir` と `--git-common-dir` が同じ（worktree の中ではない） | **中断。** 「本体チェックアウトで実行してください」と伝える |
| `git -C <MAIN> branch --show-current` が `<base>` | **中断。** `<base>` に切り替えてから再実行するよう伝える |
| `git -C <MAIN> fetch origin` の後、`git -C <MAIN> merge-base --is-ancestor origin/<base> HEAD` が成功 | **中断。** `git pull --ff-only` を案内する |
| `git -C <MAIN> rev-list --count origin/<base>..HEAD` が `0` | **中断。** 未 push のコミットが削除 PR に混ざるため、push か退避を案内する |

`<base>` は `<MAIN>/.claude/enso.json` の `enforce.baseBranch`、無ければ `main`。

続けて次を記録する（中断はしない）。

| 項目 | 確認 | 用途 |
|---|---|---|
| 本体か導入先か | `<MAIN>/.claude-plugin/plugin.json` を Read し `name` を見る | Step 3 の点検範囲 |
| PR を作れるか | `git -C <MAIN> remote get-url origin` と `gh auth status` がともに成功 | 失敗なら「PR 不可」。対象 1 はすべてスキップ、追跡済みの候補は「スキップ（PR を作れない）」に回す。未追跡の削除は行える |
| 今日の日付 | `date +%Y-%m-%d` | 計画名 `tidy-YYYY-MM-DD` |

origin が無い場合は fetch と上表の後ろ2つの確認を飛ばす。

### Step 2: 削除候補の収集

**読み取りのみ。** 対象ごとに次を実行し、「削除対象」表の条件で候補を選ぶ。ディレクトリが無い対象は0件として飛ばす。

| # | 手順 |
|---|---|
| 1 | `ls -1 <MAIN>/docs/dev/plans` → 各 `<d>/loop-state.yaml` を Read（無ければ触らない）→ `status` が `shipped` でなければスキップ → `worktree` が null でなく `test -d <worktree>` が成功ならスキップ → `pr_number` が null ならスキップ → `gh pr view <n> --json state -q .state` を実行し、`MERGED` が返れば候補、`OPEN` / `CLOSED` はスキップ、コマンドが失敗したら「gh 失敗」でスキップ |
| 2 | 残る計画ごとに `ls -1 <MAIN>/docs/dev/plans/<d>/reports` |
| 3 | `ls -1 <MAIN>/security-reports` |
| 4 | `ls -1 <MAIN>/docs/dev/webtests/errors` → 名前パターン 4 に一致する各ディレクトリの `error.md` を下の grep で判定 |
| 5 | `ls -1 <MAIN>/docs/dev/webtests/reports` |
| 6 | `ls -1 <MAIN>/docs/uat` |
| 7 | `ls -1 <MAIN>/docs/dev/analysis` |
| 8 | 表の6パスそれぞれに `test -e <MAIN>/<パス>`。glob で探さない |

対象 4 の判定:

```bash
grep -n -E "^(---|status:)" <MAIN>/docs/dev/webtests/errors/<dir>/error.md
```

| grep の出力 | 判定 |
|---|---|
| 1行目が `1:---` で、次の `---` より前にある最初の `status:` 行の値（前後の空白を除く）が `fixed` | 候補。`test -d <MAIN>/tmp/webtest/errors/<dir>` が成功すればそれも候補に加える |
| 同じ位置の値が `open` | 残す |
| それ以外（`error.md` が無い・frontmatter が無い・`status` が無い・テンプレートの `open`/`fixed` 併記のまま） | 「判別不能」でスキップ |

候補がそろったら、追跡済みかを**1回で**判定する。

```bash
git -C <MAIN> ls-files -- <候補パス1> <候補パス2> ...
```

出力に候補パスそのもの、または `<候補パス>/` で始まる行があれば**追跡済み**、無ければ**未追跡**。

結果を3区分で整理する。

| 区分 | 内容 | Step 5 での扱い |
|---|---|---|
| 追跡済み（PR で削除） | 件数とパス | worktree で `git rm` → PR |
| 未追跡（ローカルで削除） | 件数とパス | 本体で `rm -rf` |
| スキップ | パスと理由（shipped でない / worktree が残る / pr_number が null / OPEN / CLOSED / gh 失敗 / 判別不能 / PR を作れない / 対象 8 が追跡済み） | 何もしない |

### Step 3: 点検

判断軸 1 に基づき、AI 開発の設定とドキュメントの冗長・無駄を**読み取りのみ**のサブエージェントで点検する。Step 2 と並行して実行してよい。**点検結果はファイルに保存しない**（会話に提示するだけ）。

#### 3a. 点検範囲

Step 1 で記録した「本体か導入先か」で切り替える。領域ごとにサブエージェントを1体割り当てる。

| 対象 | 領域（`{{AREA}}`） | 対象ファイル（`{{TARGET_PATHS}}`） |
|---|---|---|
| enso 本体（3体） | スキル | `skills/`（各 `SKILL.md` と `references/` 等の同梱ファイル） |
| | hooks・スクリプト・設定 | `hooks/`、`scripts/`、`package.json`、`.claude-plugin/plugin.json`、`.github/workflows/`、`biome.json` 等の設定 |
| | ドキュメント | `CLAUDE.md`、`README.md`、`MANUAL.md`、`docs/dev/context.md` |
| 導入先（2体） | AI 開発の設定 | `.claude/`（`settings*.json`・`enso.json`・同梱したスキルや agents） |
| | ドキュメント | `CLAUDE.md`（ネストしたものを含む）、`docs/dev/`（`context.md` と `CLAUDE.md` の重複など。削除対象の表にあるものは除く）、`README.md` 等のドキュメント |

**導入先ではソースコードを点検しない。** 範囲は AI 開発の設定とドキュメントに限る。対象ファイルは Glob で存在を確かめ、存在するものだけを並べる。領域の対象が1件も無ければ、その領域のサブエージェントは起動しない。

#### 3b. 起動

1. このスキルの `references/audit-prompt-template.md` を Read する（サブエージェントはベースディレクトリを知らないため、メインが読んで埋め込む）
2. 領域ごとにプレースホルダを置換する。`{{PROJECT_ROOT}}` は `<MAIN>`、`{{CRITERIA}}` は本ファイルの「### 1. 整頓と無駄の排除」の箇条書き、`{{DELETE_TARGETS}}` は「削除対象」表の「対象」列
3. Agent ツール（`subagent_type: general-purpose`）で、**全領域を1メッセージで並列に起動する**。起動後、結果を待つ間に Step 2 を進めてよい

#### 3c. 集約

- 各サブエージェントの最終メッセージ（出力契約どおりの要約）だけを使う。**メインで対象ファイルを読み直さない**
- `AUDIT_FAILED` の領域、または結果マーカーが無い領域は「点検できなかった」として Step 7 で報告する（再実行はしない）
- 領域をまたいで同じ箇所を指す指摘は1件にまとめ、全指摘に通し番号（`#1`, `#2` …）を振る
- 指摘を「対応する」と「見送り」に分ける。削除候補（表に無いもの）は別に並べる

### Step 4: 確認（唯一のゲート）

Step 2 と Step 3 の結果がそろってから、削除と点検を**1回の AskUserQuestion にまとめて**確認する。**地の文で確認して応答を終えてはならない。**

| 状況 | 動作 |
|---|---|
| 削除候補（追跡済み＋未追跡）が0件 かつ「対応する」指摘が0件 | 確認を出さない。スキップ一覧・見送りの指摘・表に無い削除候補があれば並べ、「整頓する項目はありません」と伝えて終了 |
| 削除候補だけ1件以上 | 質問 1 だけを出す |
| 「対応する」指摘だけ1件以上 | 質問 2 だけを出す |
| 両方1件以上 | 質問 1 と質問 2 を同じ AskUserQuestion に入れる |

質問の前に、地の文で次を提示する。

- **削除**: 区分ごとの件数表と候補パスの一覧（区分ごとに対象 # を添える）、スキップ一覧（理由つき）。追跡済みがあれば作る PR（計画名 `tidy-YYYY-MM-DD`、base `<base>`）とマージは `dev-cleanup` の確認を経ること。未追跡の削除は取り消せないこと（別セッションが `tmp/` 配下を使って実行中なら「いいえ」を選ぶよう添える）
- **点検**: 「対応する」指摘の一覧（`#番号 [優先度] ファイル:行 — 内容 / 対処案`）、見送りの指摘の一覧（理由つき）、表に無い削除候補の一覧（**削除しない。人が判断する材料として並べるだけ**）

質問 1（削除）:

| 項目 | 内容 |
|---|---|
| question | 蓄積ファイルを削除しますか？ |
| header | 削除確認 |
| 選択肢 | 「はい — 削除する」→ Step 5 へ / 「いいえ — 何もしない」→ **削除について何もしない**（Step 5 を飛ばす） |

質問 2（直す指摘。`multiSelect: true`）:

| 項目 | 内容 |
|---|---|
| question | dev-plan に引き継いで直す指摘を選んでください |
| header | 点検の指摘 |
| 選択肢 | 「対応する」指摘が4件以下なら1件1選択肢（label は `#番号 [優先度] ファイル`）。5件以上なら優先度単位（「P0 すべて（N件）」「P1 すべて（N件）」「P2 すべて（N件）」）にまとめ、個別に選びたいときは自由入力で番号を書いてもらう |

- **見送り判定の指摘は選択肢に含めない**（既定で外す）。直したい場合は自由入力で番号を書いてもらう
- 何も選ばれなければ Step 6 を飛ばす

削除だけ・点検だけの実行はこの確認で決まる。どちらも選ばれなければ Step 7 へ進む。

### Step 5: 削除 PR

#### 5a. 未追跡の削除（本体で、worktree に入る前に）

1パスずつ実行する。**glob を使わない。** 各コマンドの直前に次の3つを確認し、1つでも満たさなければそのパスはスキップにする。

- Step 2 で「未追跡」に分類したパスそのものである
- 相対パスが「削除対象」表のパターンに一致し、`..` を含まない
- 組み立てた絶対パスが `<MAIN>/` で始まる

```bash
rm -rf <MAIN>/<パス>
```

**追跡済みの候補が0件（または PR 不可）ならここで終わり、Step 6 へ進む。**

#### 5b. worktree に入る

計画名を `tidy-YYYY-MM-DD` とする。`test -e <MAIN>/docs/dev/plans/tidy-YYYY-MM-DD` が成功するか `git -C <MAIN> branch --list worktree-tidy-YYYY-MM-DD` に出力があれば、末尾に `-2`、`-3` … を付けて空いている名前にする。以下 `<name>`。

`EnterWorktree` を `name: <name>` で呼ぶ。ブランチは `worktree-<name>`。切り替え後の worktree の絶対パスを `<WT>` とし、以降のコマンドで直接書く。**失敗したら中断する**（本体の `<base>` 上で削除をコミットしないため）。

**ここから `dev-cleanup` の `ExitWorktree` までは worktree セッション中。Bash は単一の単純なコマンドに限る**（「ルール・制約」参照）。

#### 5c. 削除のコミット

```bash
git -C <WT> rm -r -- <追跡済みパス1> <追跡済みパス2> ...
git -C <WT> commit -m "chore(tidy): 蓄積ファイルを削除"
git -C <WT> push -u origin worktree-<name>
```

パスが多いときは `git rm` を複数回に分ける（1回は単一のコマンドのまま）。

#### 5d. PR の作成

本文を Write で `<WT>/tmp/tidy-pr-body.md` に作る。

- 件数表（追跡済み / 未追跡 / スキップ）
- 区分ごとのパス一覧（各50件まで。超えた分は「ほか N 件」）。未追跡は「ローカルで削除済み」と明記する
- スキップ一覧（理由つき）

```bash
gh pr create --base <base> --title "tidy: 蓄積ファイルの削除 (YYYY-MM-DD)" --body-file <WT>/tmp/tidy-pr-body.md
rm <WT>/tmp/tidy-pr-body.md
```

**Draft にしない。`gh pr ready` も使わない。** 本文ファイルは作成後すぐ消す（残すと `dev-cleanup` が未追跡の変更として worktree の削除を skip する）。出力された URL の末尾が PR 番号。

#### 5e. loop-state.yaml

`dev-cleanup` とマージ承認の hook をそのまま使うため、Write で `<WT>/docs/dev/plans/<name>/loop-state.yaml` を作る。**フラットなスカラーだけを書く**（hooks はネストを読まない）。

```yaml
plan_name: <name>
status: shipped
branch: worktree-<name>
worktree: <WT>
pr_number: <N>
pr_url: <URL>
task_range: null
```

```bash
git -C <WT> add docs/dev/plans/<name>/loop-state.yaml
git -C <WT> commit -m "chore(<name>): loop-state を追加"
git -C <WT> push
```

`plan.md` / `tasks/` は作らない（hooks・`dev-cleanup` とも読まない）。このディレクトリは次回の実行で対象 1 として削除される。

#### 5f. dev-cleanup への引き継ぎ

Skill ツールで `enso:dev-cleanup`（引数 `<name>`）を**メインコンテキストで**起動する。**マージしてよいかを自分で聞かない。** マージの是非は `dev-cleanup` Step 3 で1回だけ問われる。

### Step 6: dev-plan への引き継ぎ

**Step 4 で選ばれた指摘が0件なら起動せず Step 7 へ進む。**

起動するタイミング:

- Step 5 で削除 PR を作った場合は、`dev-cleanup` が終わり worktree を出て本体に戻ったあと（削除 PR の worktree の中で計画を作らないため）
- 削除 PR を作らなかった場合（削除なし・未追跡のみ・PR 不可）は、Step 4（または 5a）のあとすぐ

計画名は `tidy-fixes-YYYY-MM-DD` とし、5b と同じ方法で既存の計画・ブランチと重なれば `-2`、`-3` … を付ける。

要件テキストは次の形でまとめる。優先度単位で選ばれた場合は、その優先度の「対応する」指摘をすべて含める。

```text
enso-tidy の点検で見つかった冗長・無駄を直す（YYYY-MM-DD）。

方針:
- 第一優先は整頓と無駄の排除。ただし直すことで手順・分岐・判定が複雑になる項目は見送り、理由を残す
- 挙動を変えない（消してよいのは読まれない・同じ内容が他にある・再生成できるものだけ）
- 行番号は点検時点のもの。着手前に該当箇所を読み直して確かめる

指摘:
1. [P0] <ファイル>:<行> — <何が冗長・無駄か>
   対処案: <どう直すか>（規模: <小・中・大>）
2. ...
```

Skill ツールで `enso:dev-plan` を引数 `tidy-fixes-YYYY-MM-DD "<要件テキスト>"` で**メインコンテキストから**起動する。以降は `dev-plan` の手順に従う（Draft PR を作って停止する）。

### Step 7: 完了報告

| 項目 | 内容 |
|---|---|
| 削除したもの | 未追跡（ローカル）のパス、削除 PR の URL とマージ結果 |
| スキップしたもの | パスと理由 |
| 見送ったもの | 判断軸 1 で「複雑になる」などの理由で行わなかったこと |
| 点検の結果 | 引き継いだ指摘と `dev-plan` の計画名、表に無い「削除候補」 |

削除も点検の指摘も無ければ「整頓する項目はありません」とだけ伝える。

## ルール・制約

- **「削除対象」表に無いものは自動で削除しない。** 条件を満たしそうでも、点検結果の「削除候補」として提示し、人が判断する
- **「最新」はファイル名の辞書順で決める。** mtime や `git log` で判定しない
- **Step 4 の AskUserQuestion を必ず経由する。** 「いいえ」なら削除について何もしない。削除候補が0件なら worktree も PR も作らない
- **Step 5 の順序を守る**: 未追跡の削除（本体）→ `EnterWorktree` → `git rm` → commit → push → PR → `loop-state.yaml` → `dev-cleanup`
- **未追跡の削除は1パスずつ `rm -rf <MAIN>/<パス>` で行う。** glob を使わず、直前に分類・パターン一致・`<MAIN>/` 配下を確認する
- 追跡済みのディレクトリを `git rm -r` したあとに本体に残る未追跡ファイルは消さない
- **削除 PR を Draft にしない。`gh pr ready` を使わない**
- **`dev-cleanup` はメインコンテキストで起動する。** `ExitWorktree` でセッションの作業ディレクトリを移すため、サブエージェント経由では動かない。マージの確認を自分で出さない
- **`dev-plan` もメインコンテキストで起動する**（worktree と PR を作るため）
- gh が使えない・origin が無い場合もエラー終了しない。対象 1 と追跡済みの候補をスキップにして続行する
- **点検結果をファイルに保存しない。** 新たな蓄積ファイルを作らないため
- Bash コマンドは絶対パスを使う
- **worktree セッション中（5b の `EnterWorktree` から `dev-cleanup` の `ExitWorktree` まで）の Bash は「単一の、単純なコマンド」に限る。** コマンドの連結（`&&` / `;`）・パイプ・ヒアドキュメント・コマンド置換（`$(...)`）は worktree 隔離ガードに拒否される。ファイルの作成・編集は Write / Edit ツールを使う

## 追加リソース

### リファレンスファイル

- **`references/audit-prompt-template.md`** — Step 3 の点検サブエージェントに渡すプロンプトと出力契約

### 関連スキル

| スキル | 関係 |
|---|---|
| `dev-cleanup` | 削除 PR のマージと後始末。本スキルが `loop-state.yaml` を置いて引き継ぐ |
| `dev-plan` | 点検で選ばれた指摘を計画にする。`loop-state.yaml` の形式の出典 |
| `enso-policy` | `enforce.baseBranch` の設定。削除 PR の base を決める |

### 出力元スキル（削除対象のパス形式の出典）

| # | スキル |
|---|---|
| 1 | `dev-plan` / `dev-loop` |
| 2 | `dev-verify`（`verify-YYYY-MM-DD.md`）/ `dev-loop` から出す `ipa-security-check` |
| 3・8 | `ipa-security-check`（`lib/orchestrator.md` Step 7） |
| 4・5・8 | `dev-webtest` / `dev-webtest-plan` |
| 6 | `uat-test-design` |
| 7 | `edgecase-analysis` |
| 8 | `dev-screen-spec` |
