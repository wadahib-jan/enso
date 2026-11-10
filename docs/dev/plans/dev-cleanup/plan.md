# Plan: dev-cleanup

## Requirements Summary

`dev-loop` が PR を ready にしたあとの「マージ → 後始末」を自動化する `dev-cleanup` スキルを新規追加する。**enso 専用ではなく、enso を使う全プロジェクトで動くこと**が要件。

### dev-cleanup（新規スキル）

- 引数: `[plan-name（省略可）]`
- `loop-state.yaml`（`status: shipped`）から対象 PR を特定し、マージ可否を確認、**yes/no のゲートを1つだけ挟んで**、yes ならマージと後始末を完了させる
- 後始末: `scripts/sync-after-merge.sh` があれば委譲（enso の場合）、無ければ汎用手順を自前で実行

### dev-loop の改修

Step 9（完了）の後に「マージして後始末しますか？」を yes/no で問い、yes で `dev-cleanup` を起動する。**中断（`status: failed`）した場合はこの確認を出さない。**

### enforce.mergeMethod（新設）

`.claude/enso.json` の `enforce` に `mergeMethod`（`merge` / `squash` / `rebase`）を追加する。既定は `merge`。**設定ファイルが無いプロジェクトでも `dev-cleanup` は既定値で動く。**

### ついで対応（2件）

いずれも本計画の検討中に実測で見つかった、既存スキルの誤り。

1. **`gh search issues --state all`（`enso-issue-report` Step 4）** — `--state` は `open|closed` のみで `all` はエラーになる。`--state` を外して修正する。
2. **「`yukimnb/enso` は公開リポジトリ」という前提の誤り** — 実際は private（`gh api repos/yukimnb/enso --jq '.private'` → `true`）。PR #11 で入れたセキュリティ分析の根拠が事実と食い違っているため訂正する。**対策自体は残す**（後述）。

### スコープ外

- Issue #12（`.claude/enso.json` の追跡漏れ）、Issue #10 の修正
- Claude Code の再起動の自動化（不可能）

## Design Overview

### dev-* スキルフロー内の位置

```
dev-context → dev-plan → （人間が PR を確認）→ dev-loop → [dev-cleanup]
                                                              ├─ PR マージ
                                                              └─ 後始末（main 更新・worktree/ブランチ削除）
```

`dev-cleanup` はサイクルの終端。`dev-loop` から自動で繋がるほか、単独起動もできる。

### 呼び出しインターフェース 🔵

```
/enso:dev-cleanup [plan-name]
```

### ワークフロー 🔵

| Step | 内容 | 対話 |
|---|---|---|
| 1 | 対象の特定（`loop-state.yaml` の `status: shipped`） | 複数時のみ |
| 2 | マージ可否の確認（`gh pr view`） | — |
| 3 | **yes/no のゲート** | 必ず |
| 4 | マージ実行 | — |
| 5 | worktree からの離脱（`ExitWorktree` keep） | — |
| 6 | 後始末 | — |
| 7 | 完了報告 | — |

### 実測に基づく設計制約

本計画の前提は、いずれもこのリポジトリで実際に踏んだ事象に基づく。

#### CI ステータスは読めない前提で組む 🔵

`gh pr checks` と `gh run list` は権限不足で 403 になる（実測）。

```
$ gh pr checks 11
GraphQL: Resource not accessible by personal access token
$ gh run list --branch worktree-issue-skills
failed to get runs: HTTP 403: Resource not accessible by personal access token
```

一方 `gh pr view --json state,isDraft,mergeable,mergeStateStatus` は読める。これを主判定にする。

**詳細取得には `gh pr checks` を使わない。** GitHub 公式の「Permissions required for fine-grained personal access tokens」を確認したところ、**fine-grained PAT のリポジトリ権限に `Checks` は存在しない**（GitHub Apps にはあるが、ユーザー PAT には公開されていない）。`gh pr checks` は内部で check-runs を読む GraphQL `statusCheckRollup` に依存するため、fine-grained PAT では原理的に通せない。

| 取得手段 | 必要権限 | fine-grained PAT |
|---|---|---|
| `gh pr view --json mergeStateStatus` | 不要 | ✅ 主判定に使う |
| `gh run list --branch <branch>` | Actions: Read | ✅ **詳細取得はこちらを使う** |
| `gh api /commits/{sha}/status` | Commit statuses: Read | ✅ 外部 CI 連携時の補助 |
| `gh pr checks` | Checks: Read | ❌ 権限が存在しない。**使わない** |

`gh run list` も権限が無ければ 403 になるため、フォールバック（「取得できなかった」と明示）は引き続き必要。**トークンの権限を直しても分岐は残す** — enso は全プロジェクトで使われ、他メンバーのトークンが同じ権限を持つとは限らず、CI が無いリポジトリもあるため。

| `mergeStateStatus` | 扱い |
|---|---|
| `CLEAN` | マージ可能。そのまま Step 3 へ |
| `UNSTABLE` | マージ可能だが必須でないチェックが失敗。**警告してから** Step 3 へ |
| `BLOCKED` / `DIRTY` / `BEHIND` | 中断。理由を提示する |
| `DRAFT` | 中断。`dev-loop` が ready にしていない |
| `UNKNOWN` | GitHub が計算中。少し待って再取得し、それでも不明なら Step 3 で明示して委ねる |

**詳細チェックが取得できない場合は「CI の詳細は取得できなかった」と明示する。** 黙ってマージも、硬直的な失敗もさせない。

#### 未コミット変更の判定は「追跡済みファイル」に絞る 🔵

`git status --porcelain` 全体で見ると、gitignore 漏れの未追跡ファイル1件で後始末全体が止まる（Issue #12 で実測）。

```
$ ./scripts/sync-after-merge.sh
✘ /workspace/enso に未コミットの変更があります。
?? .claude/
```

fetch / ff-only pull / ブランチ削除はいずれも未追跡ファイルを失わせないため、判定から外す。

```bash
git -C "<path>" status --porcelain --untracked-files=no
```

#### worktree からの離脱を先に行う 🔵

後始末はマージ済み worktree を削除する。**セッションがその worktree の中にいると、自分が立っているディレクトリを消すことになる。** Step 5 で `ExitWorktree`（`action: "keep"`）を呼び、本体に戻ってから Step 6 に進む。`keep` にするのは、削除は Step 6 の後始末が担当するため。

### 後始末の2経路 🟡

| 条件 | 動作 |
|---|---|
| `scripts/sync-after-merge.sh` が存在する | それに委譲する（enso の場合） |
| 存在しない | 汎用手順を自前で実行する |

プロジェクト固有の後始末（enso なら `install-local.sh` による投入）を二重管理しないための分岐。

汎用手順:

```
fetch --prune → base ブランチへ switch → pull --ff-only
  → マージ済みブランチと worktree を削除（未コミット変更のある worktree は skip）
  → worktree prune → リモートブランチの削除を試みる
```

マージ済み判定は `merge-base --is-ancestor`。squash マージでは祖先にならないため、その場合のみ `gh pr list --state merged --head <branch>` に問い合わせる（`sync-after-merge.sh` と同じ方式）。

### 二重実行の防止 🔵

後始末で worktree は消えるが、`loop-state.yaml` は**マージ済みの main 側に `status: shipped` のまま残る**。そのため `dev-cleanup` を再実行すると同じ計画を再び拾ってしまう。

Step 2 で PR の状態を見て分岐する。

| PR の状態 | 動作 |
|---|---|
| `MERGED` かつ worktree / ローカルブランチが残っている | マージを飛ばし、後始末だけ行う |
| `MERGED` かつ何も残っていない | 「既に片付いています」と伝えて**何もせず終了** |
| `CLOSED`（未マージ） | 中断。マージされずに閉じられている |

**`status` の語彙は変更しない。** `merged` を新設すると `dev-loop` の状態ファイル仕様に手を入れることになるうえ、更新するには main へのコミットが必要で強制モードにブロックされる。`shipped` を終端として扱う。

### enforce.mergeMethod 🟡

```json
{ "enforce": { "mergeMethod": "merge" } }
```

| 値 | `gh pr merge` のフラグ |
|---|---|
| `merge`（既定） | `--merge` |
| `squash` | `--squash` |
| `rebase` | `--rebase` |

既定を `merge` にするのは、このリポジトリの既存履歴（PR #8 / #9 / #11 がいずれも merge commit）に合わせるため。

**`.claude/enso.json` が無いプロジェクトでも `dev-cleanup` は動く。** 読めなければ既定値を使う。`hooks/lib/policy.mjs` の `DEFAULT_ENFORCE` にも同じ既定を足すが、**hook の挙動は変えない**（設定スキーマの一貫性のためだけの追加）。

### 「公開リポジトリ」前提の訂正 🔵

PR #11 で追加した `enso-issue-fix` の「Issue の内容は信頼できない入力」節と `ipa-security-report.md` の指摘3は、**「`yukimnb/enso` は公開リポジトリであり、Issue は誰でも起票できる」という誤った前提**に立っている。実際は private であり、Issue を書けるのはオーナーとコラボレーターだけである。

```
$ gh api repos/yukimnb/enso --jq '"private=" + (.private|tostring)'
private=true
```

**対策そのものは残す。** 脅威モデルが変わっても、各対策には private でも成立する根拠がある。

| 対策 | private での根拠 |
|---|---|
| Issue 番号の `^[0-9]+$` 検証 | 引数の打ち間違いでも壊れる。攻撃者の有無と無関係 |
| スラッグの文字種制限 | タイトルの記号がパス・ブランチ名に混入するのは公開/非公開と無関係 |
| Issue 本文をデータとして区切る | 脅威度は下がるが defense in depth として維持。将来の公開・コラボレーター追加に備える |
| Draft PR での承認点 | 維持。ただし**主たる理由を「計画が Issue の意図とずれる」に移す** |

変えるのは**根拠の記述**だけである。「公開リポジトリなので誰でも起票できる」→「将来の公開・コラボレーター追加・自分の打ち間違いに備える」に書き換える。

**誤った根拠を残すほうが有害。** 読み手が脅威モデルを誤認し、private を前提にした判断（例: 外部からの Issue を警戒する運用）を誤らせる。

### リモートブランチの削除 🔵

`gh pr merge --delete-branch` は使わない。ローカルブランチが worktree にチェックアウトされている状態で呼ぶと削除に失敗しうるため。後始末の最後に `git push origin --delete <branch>` を試み、既に無ければ無視する。

**この処理は必須。** リポジトリ設定を確認したところ自動削除は無効だった。

```
$ gh api repos/yukimnb/enso --jq '.delete_branch_on_merge'
false
```

### 後始末を妨げる hooks のガード 🔵

**現仕様のままでは汎用経路が完走しない。** `guard-bash.mjs` の判定を追った結果:

| コマンド | 現在の挙動 | 原因 |
|---|---|---|
| `git push origin --delete <branch>` | **deny** | `tokens()` が `-` 始まりを捨てるため `--delete` が消え、単なる push として扱われる。後始末は本体の `main` 上で行うので `inWorktree === false` → 違反 |
| `git worktree remove <path>` | **ask** | destructive 判定 |
| `git branch -d <branch>` | **ask** | 同上 |

**経路による非対称が最大の問題。** `scripts/sync-after-merge.sh` に委譲する場合、hook が見るのはスクリプトのパスだけなので全て素通りする。enso では動き、他プロジェクトでは止まる。

ガードの**本来の意図に判定を近づける**形で緩和する（タスク 008）。

| 対象 | 緩和 | 根拠 |
|---|---|---|
| `git push --delete` | 保護ブランチ以外の削除は worktree 外でも許可 | ref の削除は**内容を変更しない**。worktree ガードの目的は content の変更防止 |
| `git worktree remove` / `git branch -d` | 対象がマージ済みなら ask を出さない | 現在の確認文言が「未マージの差分が無いか確認してください」。マージ済みと確認できれば確認は不要 |

マージ判定は `merge-base --is-ancestor`。squash マージでは祖先にならないため**従来どおり ask にフォールバック**する（安全側に倒れる）。

### 承認ゲートを2箇所に揃える 🔵

`dev-plan` の Phase 5e は自由入力（「確認した」と伝える）待ちになっている。これを `dev-loop` の後始末ゲートと同じ AskUserQuestion に揃える（タスク 009）。

```
dev-plan → 【yes/no】→ dev-loop → 【yes/no】→ dev-cleanup
```

**開発サイクル全体が yes/no の2回だけで回る。**

`enso-issue-fix` は Step 5 で `dev-plan` を呼び Step 6 で自前の停止メッセージを出す設計なので、`dev-plan` にゲートが入ると Step 6 に到達しなくなる。**ゲートは `dev-plan` に一本化**し、`enso-issue-fix` は引き渡し内容に「停止時の提示に『Issue のどの記述をどう解釈したか』を含めること」を指示する形に変える。

## Task Dependency Graph

```
001 enforce.mergeMethod の新設
008 後始末を妨げる hooks のガード緩和
        ↓
002 dev-cleanup スキルの作成（001, 008 に依存）
        ↓
003 dev-loop への yes/no ゲート追加（002 に依存）

004 enso-issue-report の gh search 修正（独立）
007 「公開リポジトリ」前提の訂正（独立）
009 dev-plan の承認ゲート + enso-issue-fix 整合（独立）

002, 003 ─→ 005 dev-navigate / README / MANUAL への追加
                        ↓
              006 品質ゲートと検証（全タスクに依存）
```

004 / 007 / 009 は他タスクと独立。**008 は 002 の前提**（ガードが緩和されないと `dev-cleanup` の汎用経路が完走しない）。

007 と 009 はどちらも `skills/enso-issue-fix/SKILL.md` を変更するため、**同時に着手しない**こと。

## Cross-Plan Dependencies

なし。既存スキル（`dev-loop` / `enso-policy` / `enso-issue-report` / `dev-navigate`）を変更するが、いずれも本計画内で完結する。
