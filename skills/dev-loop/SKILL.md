---
name: dev-loop
description: dev-plan が作成した Draft PR をユーザーが確認したあと、実装から検証・レビュー依頼までを一気に完了させる。「確認した」「PR確認OK」「計画を承認」「approved」「実装を進めて」など承認を伝えられたときに使用する。**docs/dev/plans/*/loop-state.yaml に status:awaiting-approval の計画が存在する場合のみ動作し、無ければ何もしない。**
argument-hint: '[plan-name（省略可）]'
---

# Dev Loop

`dev-plan` → 人間の承認 → `dev-run` → `dev-verify` → PR にコミット追加 → レビュー依頼、というループの後半を担当する。

## 前提知識

### dev-* スキルフロー内の位置

```
dev-plan → 【yes/no】→ [dev-loop] →（引き継ぎ）→ dev-cleanup →【yes/no】→ マージと後始末
                                        ├─ dev-run（実装）
                                        └─ dev-verify（検証）
```

`dev-plan` が worktree・ブランチ・Draft PR・`loop-state.yaml` を用意した状態から始まる。

### 起動条件（重要）

**`loop-state.yaml` に `status: awaiting-approval` の計画が1件以上あることが必須。**

「確認した」のような発話は汎用的で無関係な文脈でも一致しうる。該当する計画が無ければ **何もせずに終了する**。これが誤発火に対する唯一の安全装置なので、省略してはならない。

### メインコンテキストで動かすこと

`dev-run` は Task サブエージェントを使う。サブエージェントは Task ツールを使えない（ネスト不可）ため、`dev-loop` 自身をサブエージェント経由で起動すると2段目のネストになり破綻する。**必ずメインコンテキストで実行する。**

## ワークフロー

### Step 1: 対象計画の特定

`loop-state.yaml` を次の順で探索する。

1. カレントの `docs/dev/plans/*/loop-state.yaml`（Glob）
2. `git worktree list --porcelain` で列挙した各 worktree 配下の同パス

`status: awaiting-approval` のものを候補とする。

| 件数 | 動作 |
|---|---|
| 0件 | **何もせずに終了する。**「承認待ちの計画が見つかりませんでした」とだけ伝える |
| 1件 | それを対象にする |
| 2件以上 | AskUserQuestion で選ばせる（引数で plan-name が指定されていればそれを優先） |

`status` が `running` のものが見つかった場合は中断された実行の可能性がある。ユーザーに再開してよいか確認する。

### Step 2: worktree への移動

`loop-state.yaml` の `worktree` が現在のディレクトリと異なる場合、`EnterWorktree` を `path: <worktree>` で呼び出してセッションを移動する。

移動しないと作業ディレクトリが元のリポジトリのままになり、**後続スキルが誤った場所に書き込む。**

### Step 3: 実行開始の記録

`loop-state.yaml` の `status` を `running` に更新する（この時点ではコミットしない）。

### Step 4: 実装（dev-run）

`task_range` の範囲で `dev-run` を実行する。

```
/enso:dev-run <plan-name> <from> <to>
```

`dev-run` は内部で impl→debug（各3サイクル）、verify→fix→re-verify（2サイクル）を回す。**このスキルで新しいループを重ねてはならない。** 結果は `dev-run` の最終レポートから読み取る。

### Step 5: 結果の判定

`dev-run` のレポートとマーカーを確認する。

| 状況 | 動作 |
|---|---|
| 全タスク成功・残存問題なし | Step 6 へ |
| `IMPL_FAILED` + `DEBUG_FAILED`（両方失敗） | **中断** |
| verify 2サイクル後も問題が残存 | **中断** |
| 🔴（AI推論補完・人間の判断が必須）が残っている | **中断** |

中断時の処理:

1. `loop-state.yaml` の `status` を `failed` に更新する
2. **PR は Draft のままにする**
3. 実装済みの差分はコミットして push する（作業を失わないため）
4. 残存問題と推奨アクションをユーザーに報告して終了する

**失敗したまま PR を ready にしてはならない。** ループが人間に嘘の完了報告をすることになる。

### Step 6: 検証（dev-verify）

```
/enso:dev-verify <plan-name>
```

テスト・カバレッジ・ビルド・Lint・500行ルールのゲートと信号機サマリを取得する。レポートは `docs/dev/plans/<plan-name>/reports/` に出力される。

検証で問題が見つかった場合は Step 5 の中断処理に従う。

### Step 7: コミットと push

`loop-state.yaml` の `worktree`（Step 2 で移動した先）を作業ディレクトリとして、1 コマンドずつ実行する。

```bash
git add -A
git commit -m "feat(<plan-name>): タスク <from>-<to> を実装"
git push
```

`dev-plan` が作った PR に実装コミットが積み上がる。検証レポートも成果物として含める。

### Step 8: レビュー依頼

`loop-state.yaml` の `pr_number` が `null` の場合はこの Step をスキップする（ローカル完結の構成）。

`.claude/enso.json` の `enforce.security` が `true` の場合、**`gh pr ready` の前に `/enso:ipa-security-check` を実行し、レポートをこの PR の計画の `docs/dev/plans/<plan-name>/reports/` に出力する**。この PR の計画の reports/ にレポートが無いと `gh pr ready` は PreToolUse フックで deny される（他の計画のレポートは数えない）。検出された脆弱性は PR コメントの検証サマリにも含める。

```bash
/enso:ipa-security-check --output docs/dev/plans/<plan-name>/reports/ipa-security-report.md,docs/dev/plans/<plan-name>/reports/ipa-security-report.sarif
```

出力先は固定名なので、再実行しても日付違いのレポートは増えず、前回のトリアージ状態を同じパスの既存レポートから引き継ぐ。

```bash
gh pr ready <pr_number>
gh pr comment <pr_number> --body "<検証サマリ>"
```

コメントに含める内容:

```markdown
## 実装完了

| 項目 | 結果 |
|---|---|
| タスク | X/Y 完了 |
| テスト | X passed, Y failed |
| カバレッジ | X/Y packages above threshold |
| ビルド | OK / NG / N/A |
| Lint | OK / NG / N/A |
| 500行ルール | OK / X files over |

### 🟡 要確認
- [ファイル] — [確認すべき点]

### 🔴 要判断
- （あれば。無ければ「なし」）
```

### Step 9: 完了

1. `loop-state.yaml` の `status` を `shipped` に更新し、コミットして push する
2. PR の URL と検証サマリをユーザーに提示する

**この時点では worktree を削除しない。** 削除は Step 10 で `dev-cleanup` に委ねる。

### Step 10: 後始末への引き継ぎ

**次の2つのいずれかに該当する場合は、`dev-cleanup` を起動しない。**

- 中断した（`loop-state.yaml` の `status` が `failed`）
- `pr_number` が `null`（PR を作っていないローカル完結の構成）

**どちらかに該当する場合は質問せず、PR の URL を提示して終了する。**（該当するのに聞くのも逸脱である）

**どちらにも該当しない場合は、質問せずそのまま `dev-cleanup` を起動する。** ここで「マージして後始末しますか？」を聞いてはならない。**マージの是非は `dev-cleanup` Step 3 のゲートで1回だけ問われる。** そちらは PR の状態・CI・削除対象（worktree / ローカルブランチ / リモートブランチ）を提示できるため、同じ判断を先にここで問うと材料の少ない確認を二重に出すことになる。

`dev-cleanup` Step 3 には「いいえ — 何もしない」があるので、**引き継いでもマージしない選択肢は失われない。**

`status` は `shipped` のままにする。`dev-cleanup` で「いいえ」を選んでも、後から `/enso:dev-cleanup` で拾える。

**`dev-cleanup` をサブエージェント経由で起動しない。** `dev-cleanup` は `ExitWorktree` でセッション自体の作業ディレクトリを移動するため、メインコンテキストで動かす必要がある。

## エスカレーション条件

以下は自動で進めず、ユーザーに判断を仰ぐ。

1. 承認待ちの計画が2件以上ある
2. `status: running` の計画が見つかった（前回の実行が中断されている）
3. `dev-run` が impl+debug 両方失敗した
4. `dev-verify` が 🔴 を報告した
5. push が失敗した（リモートの更新との衝突など）

## ルール・制約

- `loop-state.yaml` が無ければ **何もせず終了する**（誤発火防止）
- 新しいループを作らず、`dev-run` の既存ループを1周させるだけにする
- `gh pr ready` は検証を通過したときだけ実行する
- **Step 10 でマージの確認を出さない。** スキップ条件（`status: failed` / `pr_number: null`）に該当しない限り、質問せず `dev-cleanup` を起動する。マージのゲートは `dev-cleanup` Step 3 に一本化してある
- worktree の外で `dev-run` / `dev-verify` を起動しない
- サブエージェント経由で起動しない（Task のネスト不可）
- Bash コマンドは絶対パスを使う。worktree セッション中は `$(git rev-parse --show-toplevel)` のようなコマンド置換を使わず、`loop-state.yaml` の `worktree` に記録された確定した絶対パスを直接書く（ガードに拒否されるため）
- **worktree セッション中の Bash は「単一の、単純なコマンド」に限る。** コマンドの連結（`&&` / `;`）・ヒアドキュメント・コマンド置換は worktree 隔離ガードに拒否される。ファイルの作成・編集は Write / Edit ツールを使う

## 状態ファイル仕様

`docs/dev/plans/<plan-name>/loop-state.yaml`

```yaml
plan_name: auth
status: awaiting-approval    # awaiting-approval | running | shipped | failed
branch: worktree-auth
worktree: /path/to/project/.claude/worktrees/auth
pr_number: 12                # PR 未作成なら null
pr_url: https://github.com/<owner>/<repo>/pull/12
task_range: ["001", "005"]
impl_approved_at: 2026-09-08T10:00:00Z     # 任意。dev-plan Phase 5e で「はい」が選ばれた時刻
merge_approved_at: 2026-09-08T12:34:56Z    # 任意。dev-cleanup Step 3 で「はい」が選ばれた時刻
```

| status | 意味 | 次のアクション |
|---|---|---|
| `awaiting-approval` | 計画が PR になり、人間の確認待ち | `dev-loop` が拾う |
| `running` | 実装中 | 中断された可能性。再開確認 |
| `shipped` | 検証通過・レビュー依頼済み | ユーザーがマージ |
| `failed` | 中断。PR は Draft のまま | 残存問題の手動対応 |

### 承認フィールド

| フィールド | 書く場所 | 用途 |
|---|---|---|
| `impl_approved_at` | `dev-plan` Phase 5e で「はい」 | **監査のみ。** これを根拠にブロックされる操作は無い |
| `merge_approved_at` | `dev-cleanup` Step 3.5（Step 3 で「はい」） | `gh pr merge` の PreToolUse ガードが検査する。無い / 古い（既定 24 時間超）なら deny |

**どちらも任意で、承認時に初めて書かれる。** 無い＝未承認と読み、`dev-loop` は有無で挙動を変えない。
