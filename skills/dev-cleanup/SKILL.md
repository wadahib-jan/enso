---
name: dev-cleanup
description: This skill should be used when the user asks to "dev-cleanup", "マージして片付けて", "後始末", "PR をマージ", "掃除", "cleanup", "merge and cleanup", "ブランチを片付けて", "worktree を掃除". dev-loop が ready にした PR をマージし、main の更新・マージ済み worktree とブランチの削除まで後始末する。dev-* サイクルの終端。
argument-hint: '[plan-name（省略可）]'
---

# Dev Cleanup（マージと後始末）

`dev-loop` が PR を ready にしたあとの「マージ → 後始末」を担当する。**確認は yes/no のゲート1つだけ**で、yes なら最後まで走り切る。

## 前提知識

### dev-* スキルフロー内の位置

```
dev-plan → 【yes/no】→ dev-loop →（引き継ぎ）→ [dev-cleanup] → 【yes/no】
                                                                                   ├─ PR マージ
                                                                                   └─ 後始末
```

サイクルの終端。`dev-loop` から**確認なしで**繋がるほか、単独起動もできる。マージの是非を問うゲートは本スキルの Step 3 だけで、`dev-loop` 側には無い。

### enso 専用ではない

**enso を使う全プロジェクトで動く。** プロジェクト固有の後始末（enso なら `install-local.sh` による投入）は、後述の委譲で吸収する。

### CI ステータスの取得手段

権限によって取得可否が変わるため、**取れる手段から順に使い、取れなければ明示する**。

| 手段 | 必要権限 | 用途 |
|---|---|---|
| `gh pr view --json mergeable,mergeStateStatus` | 不要 | **主判定** |
| `gh run list --branch <branch> --limit 5` | Actions: Read | 詳細の提示 |
| `gh pr checks` | Checks: Read | **使わない** |

**`gh pr checks` を使ってはならない。** fine-grained PAT のリポジトリ権限に `Checks` は存在せず（GitHub Apps にはあるがユーザー PAT には無い）、原理的に通らない。`gh pr checks` は内部で check-runs を読む GraphQL `statusCheckRollup` に依存している。

**権限が揃っていてもフォールバックを省かない**（トークンの権限は人や時期で変わり、CI が無いリポジトリもあるため）。

### 未コミット変更の判定

**判定基準は対象によって違う。** 判定を通過したものは実際に処理できなければならないので、基準はその対象に対して行う操作に合わせる。

| 対象 | 判定 | この後に行う操作 |
|---|---|---|
| 本体チェックアウト | `git -C "$MAIN" status --porcelain --untracked-files=no` | fetch / ff-only pull / ブランチ削除 |
| worktree | `git -C "<path>" status --porcelain`（未追跡を含む） | `git worktree remove --force` |

本体で `--untracked-files=no` を付けるのは、これを付けないと gitignore 漏れの未追跡ファイル1件で後始末全体が止まるため。fetch / ff-only pull / ブランチ削除はいずれも**未追跡ファイルを失わせない**ので、判定に含める理由がない。

worktree で付けないのは、削除に使う `--force` が**未追跡ファイルごと消す**ため。ユーザーが一度も見ていない差分を握り潰さないための歯止めになる。`node_modules` / `.venv` のような**無視対象は `status --porcelain` に現れない**ので、生成物が理由で skip されることはない。

## ワークフロー

### Step 1: 対象の特定

`loop-state.yaml` を次の順で探索し、`status: shipped` のものを候補にする。

1. カレントの `docs/dev/plans/*/loop-state.yaml`
2. `git worktree list --porcelain` で列挙した各 worktree 配下の同パス

| 件数 | 動作 |
|---|---|
| 0件 | **何もせず終了する。**「後始末が必要な計画が見つかりませんでした」とだけ伝える |
| 1件 | それを対象にする |
| 2件以上 | AskUserQuestion で選ばせる（引数の plan-name があればそれを優先） |

`pr_number` が `null`（ローカル完結の構成）なら、マージ工程（Step 2〜4）を飛ばして Step 5 へ進む。

### Step 2: マージ可否と二重実行の判定

```bash
gh pr view <N> --json state,isDraft,mergeable,mergeStateStatus,url,headRefName
```

**まず PR の状態で分岐する。**

| `state` | 追加条件 | 動作 |
|---|---|---|
| `MERGED` | worktree / ローカルブランチが残っている | マージを飛ばして Step 5 へ |
| `MERGED` | 何も残っていない | 「既に片付いています」と伝えて**終了** |
| `CLOSED` | — | **中断。** マージされずに閉じられている |
| `OPEN` | — | 下の `mergeStateStatus` 判定へ |

**`mergeStateStatus` の扱い。**

| 値 | 動作 |
|---|---|
| `CLEAN` | そのまま Step 3 へ |
| `UNSTABLE` | **警告してから** Step 3 へ（マージ可能だが必須でないチェックが失敗している） |
| `BLOCKED` / `DIRTY` / `BEHIND` | **中断。** 理由を提示する |
| `DRAFT` | **中断。** `dev-loop` が ready にしていない |
| `UNKNOWN` | GitHub が計算中。少し待って再取得し、それでも不明なら Step 3 で明示して委ねる |

**CI の詳細を添える。**

```bash
gh run list --branch <headRefName> --limit 5
```

取得できたら結果を提示する。403 などで取得できなかった場合は、**「CI の詳細は取得できませんでした（トークンに Actions: Read が無い可能性があります）」と明示する。** 黙ってマージも、これを理由に中断もしない。判断材料が欠けていることを伝えたうえで Step 3 に進む。

### Step 3: 確認（唯一のゲート）

AskUserQuestion で確認する。**このステップを飛ばしてはならない。地の文で確認して応答を終えてはならない。** マージは外向きで取り消しにくい操作である。

**飛ばしても先に進めない。** 強制モード（`enforce.flow`）が有効なプロジェクトでは、`loop-state.yaml` に有効な `merge_approved_at` が無い `gh pr merge` は PreToolUse フックで deny される。記録を書くのは次の Step 3.5 だけであり、そこへ来るには本ステップの「はい」が要る。

| 項目 | 内容 |
|---|---|
| question | マージして後始末しますか？ |
| header | マージ確認 |

提示する内容:

- PR の番号・タイトル・URL
- `mergeStateStatus` と、CI の詳細（取得できた場合）／取得できなかった旨
- マージ方式（`mergeMethod`）
- 後始末で**何が削除されるか**（worktree のパス、ローカルブランチ名、リモートブランチ名）

| 選択肢 | 動作 |
|---|---|
| はい — マージして後始末する | Step 3.5 へ |
| いいえ — 何もしない | **何もせず終了する**（記録も書かない） |

### Step 3.5: 承認の記録

Step 3 で「はい」が選ばれた**直後**、マージの前に `loop-state.yaml` へ承認時刻を書き、コミットして push する。

```yaml
merge_approved_at: 2026-09-08T12:34:56Z   # ISO8601 / UTC
```

```bash
WT="<loop-state.yaml がある worktree の絶対パス>"
git -C "$WT" add "docs/dev/plans/<plan-name>/loop-state.yaml"
git -C "$WT" commit -m "chore(<plan-name>): マージ承認を記録"
git -C "$WT" push
```

- **必ずコミットする。** 未コミットのまま残すと Step 6 の後始末が「未コミットの変更が残る worktree は削除せず skip する」に該当し、片付けが完了しない
- ここはまだ Step 5（`ExitWorktree`）より前なので worktree の中にいる。worktree ガードにも保護ブランチガードにも抵触しない
- 既に `merge_approved_at` がある場合は**新しい時刻で上書きする**。古い承認の使い回しはフック側が弾く
- `pr_number` が `null` の構成では Step 2〜4 ごと飛ばすため、記録も書かない

### Step 4: マージ

マージ方式を `.claude/enso.json` の `enforce.mergeMethod` から読む。**設定ファイルが無ければ `merge` を使う。**

| 値 | フラグ |
|---|---|
| `merge`（既定） | `--merge` |
| `squash` | `--squash` |
| `rebase` | `--rebase` |

```bash
gh pr merge <N> --merge
```

**`--delete-branch` を付けない。** ローカルブランチが worktree にチェックアウトされていると削除に失敗しうる。リモートブランチの削除は Step 5 の最後に行う。

マージが失敗したら中断し、エラーをそのまま提示する。

### Step 5: worktree からの離脱

**後始末より先に必ず行う。** 後始末はマージ済み worktree を削除するため、セッションがその中にいると**自分が立っているディレクトリを消すことになる**。

現在のディレクトリが削除対象の worktree 配下なら `ExitWorktree` を `action: "keep"` で呼ぶ。削除は Step 6 の後始末が担当するので `keep` にする。

### Step 6: 後始末

```bash
test -x scripts/sync-after-merge.sh
```

| 条件 | 動作 |
|---|---|
| 存在する | **委譲する。** `./scripts/sync-after-merge.sh` を実行し、出力をそのまま提示する |
| 存在しない | 下の汎用手順を実行する |

プロジェクト固有の後始末を二重管理しないための分岐。**委譲先が汎用手順と同じ範囲（リモートブランチの削除を含む）をカバーしているかは、委譲先の責任**とする。enso の `sync-after-merge.sh` はカバーしている。

#### 汎用手順

**本体チェックアウトに対して行う。** `git worktree list --porcelain` の最初のエントリが本体。`--show-toplevel` は worktree 内だと worktree 自身を指すので使わない。

```bash
MAIN="$(git worktree list --porcelain | sed -n '1s/^worktree //p')"
```

1. **本体に未コミットの変更が無いことを確認する**（追跡済みのみ）

```bash
git -C "$MAIN" status --porcelain --untracked-files=no
```

出力があれば中断し、退避してから再実行するよう伝える。

2. **main を最新にする**

```bash
git -C "$MAIN" fetch --prune origin
git -C "$MAIN" switch "<baseBranch>"      # 既に居ればスキップ
git -C "$MAIN" pull --ff-only origin "<baseBranch>"
```

`--ff-only` にするのは、意図しないマージコミットを黙って作らないため。

3. **マージ済みブランチと worktree を削除する**

マージ判定は `merge-base --is-ancestor`。squash マージでは祖先にならないため、その場合のみ `gh` に問い合わせる。

```bash
git -C "$MAIN" merge-base --is-ancestor <branch> <baseBranch>
gh pr list --state merged --head <branch> --limit 1 --json number
```

worktree にチェックアウトされているブランチは、worktree を消さないと削除できない。**未コミットの変更が残る worktree は削除せず、警告して skip する**（判定基準は「前提知識 > 未コミット変更の判定」）。

```bash
git -C "<path>" status --porcelain    # 出力があれば skip。未追跡を含む
```

```bash
git -C "$MAIN" worktree remove --force <path>
git -C "$MAIN" branch -d <branch>      # squash マージなら -D
git -C "$MAIN" worktree prune
```

##### 削除に失敗したとき

`git worktree remove` は**失敗しても管理エントリだけ解除されることがある**。「失敗＝何も起きていない」と仮定した手順は書けないので、必ず実状を確認してから次を決める。

```bash
git -C "$MAIN" worktree list --porcelain | grep -F "worktree <path>"
```

| 確認結果 | 動作 |
|---|---|
| ヒットする（エントリが残っている） | skip して警告する。次回の後始末で再試行できる。**`rm -rf` しない** |
| ヒットしない（孤立している） | 下の回収手順に進む |

```bash
git -C "$MAIN" worktree prune
rm -rf <path>          # 失敗したら1度だけ再試行する
```

`rm -rf` の前に **`<path>` が `$MAIN/.claude/worktrees/` 配下の絶対パスであること**を確認する。パスの取り違えで無関係なディレクトリを消さないための前提条件であり、本スキルで唯一の非可逆な直接削除になる。

1度だけ再試行するのは、virtiofs のような遅延のあるファイルシステムで1回目が `Directory not empty` になり2回目で成功する事例があるため。それでも残る場合はパスを提示して手作業を案内する。

`locked` な worktree は `worktree list` に出るので孤立ではない。ロックは意図的に付けられたものなので**強制解除には踏み込まず**、skip して警告する。

4. **リモートブランチを削除する**

```bash
git -C "$MAIN" push origin --delete <branch>
```

既に無ければ無視する。リポジトリの `delete_branch_on_merge` が有効なら不要だが、無効な環境では残り続けるため試みる。

### Step 7: 完了報告

| 項目 | 内容 |
|---|---|
| マージした PR | 番号・URL・マージ方式 |
| base ブランチ | 更新前後のコミット |
| 削除したもの | worktree・ローカルブランチ・リモートブランチ |
| 回収したもの | 孤立していたディレクトリ（`prune` + `rm -rf` で片付けたパス） |
| skip したもの | 未コミット変更が残る worktree、`locked` な worktree、手作業が必要なパス（いずれも理由つき） |

**enso 自身を更新した場合のみ**、最後に再起動を案内する。

```
反映には Claude Code の再起動（または /reload-plugins）が必要です。
```

**再起動は自動化できない。** `/reload-plugins` は CLI が受け取るコマンドで、Bash から実行できない。案内するにとどめる。

## ルール・制約

- **Step 3 の yes/no を必ず経由する。** マージは外向きで取り消しにくい。省略も既定 yes も認めない
- **Step 3 は AskUserQuestion で出す。地の文で確認して応答を終えてはならない**
- **承認記録（Step 3.5）を書かずに `gh pr merge` へ進まない。** 強制モードでは記録の無いマージがフックで deny される
- **承認記録は Step 3 で「はい」が選ばれた場合にのみ書く。** マージを通すために先回りして書くのは、ゲートそのものの無効化にあたる
- **`gh pr checks` を使わない。** fine-grained PAT に `Checks` 権限が存在しないため通らない。詳細取得は `gh run list`
- **CI の詳細が取得できないことを理由に中断しない。** 取得できなかった旨を明示して Step 3 の判断に委ねる
- **未コミットの判定基準は本体と worktree で異なる**（「前提知識 > 未コミット変更の判定」）
- **Step 5（`ExitWorktree`）を Step 6 より先に行う。** 飛ばすと自分がいるディレクトリを消す
- `ExitWorktree` は `action: "keep"` で呼ぶ。削除は後始末が担当する
- `gh pr merge --delete-branch` を使わない。リモート削除は後始末の最後に行う
- 後始末は**本体チェックアウト**に対して行う。`git worktree list --porcelain` の最初のエントリが本体
- **未マージのブランチには触らない**
- 未コミットの変更が残る worktree は削除せず、警告して skip する
- worktree の削除は `worktree remove --force` で行う。付けないと gitignore 対象の生成物ひとつで失敗する
- **削除に失敗したら `worktree list` で実状を確認してから次の手を決める。** 失敗してもエントリだけ消えることがあり、「失敗＝何も起きていない」とは仮定できない
- 孤立ディレクトリの `rm -rf` は `.claude/worktrees/` 配下であることを確認してから行う
- 一度に扱う計画は**1件のみ**
- Bash コマンドは絶対パスを使う
- **worktree セッション中（Step 5 の `ExitWorktree` より前）の Bash は「単一の、単純なコマンド」に限る。** コマンドの連結（`&&` / `;`）・ヒアドキュメント・コマンド置換は worktree 隔離ガードに拒否される。ファイルの作成・編集は Write / Edit ツールを使う。**worktree を出たあとの後始末（本体チェックアウトに対する汎用手順）にはこの制約は適用されない**

## 追加リソース

### 関連スキル

| スキル | 関係 |
|---|---|
| `dev-loop` | 実装・検証・PR ready。本スキルの入口。確認を出さず、そのまま本スキルに引き継ぐ |
| `dev-plan` | 計画・worktree・Draft PR の作成。ここで作られた `loop-state.yaml` を本スキルが読む |
| `enso-policy` | `enforce.mergeMethod` の設定。`gh pr merge` の方式を決める |

### プロジェクト固有の後始末

`scripts/sync-after-merge.sh` があるプロジェクトでは、後始末をそのスクリプトに委譲する。enso 自身の場合、このスクリプトが `~/.claude/skills/enso` への投入まで行う。
