# Plan: issue-25-worktree-remove-force

対象 Issue: [#25](https://github.com/yukimnb/enso/issues/25) — `dev-cleanup`: worktree に gitignore 対象の生成物が残ると `worktree remove` が失敗し、孤立ディレクトリが残る

## Requirements Summary

`dev-cleanup` Step 6（後始末）および `scripts/sync-after-merge.sh` は、マージ済み worktree を `git worktree remove`（`--force` なし）で削除している。`node_modules` / `.venv` / ビルド成果物のような **gitignore 対象の生成物**が worktree に残っていると、この呼び出しは `Directory not empty` で失敗する。

さらに git は**失敗しても管理エントリだけ解除する**ため、ディレクトリが孤立して `git worktree list` に現れなくなる。この状態では `worktree remove --force` で再試行しても `is not a working tree` となり、手作業の `rm -rf` でしか回収できない。

ゴール:

1. 削除可否の**判定基準と実行手段を噛み合わせる**（判定を通ったら実際に削除できる状態にする）
2. 削除に失敗した場合の**孤立ディレクトリ回収手順**を定義に持つ
3. スキル定義（`skills/dev-cleanup/SKILL.md`）とスクリプト（`scripts/sync-after-merge.sh`）で**同じ挙動**にする

スコープ外: Issue に書かれていない後始末の改善（削除対象の拡大、確認 UI の変更など）。

## Design Overview

### 判定基準と実行手段の対応

| 対象 | 判定 | 実行 |
|---|---|---|
| 本体チェックアウト | `git status --porcelain --untracked-files=no`（追跡済みのみ） | 削除しない。fetch / pull / branch 削除のみ |
| worktree | `git status --porcelain`（**未追跡を含む**。無視対象は元々出力されない） | `git worktree remove --force` |

**worktree 側の判定は未追跡を含める。** `--force` は未追跡ファイルも消すため、ユーザーが一度も見ていない差分を握り潰さないための歯止めが要る。一方 gitignore 対象（`node_modules` / `.venv`）は `status --porcelain` に**現れない**ので、判定を通過したうえで `--force` が消してくれる。これで「判定を通ったのに削除が失敗する」経路が消える。

> 🟡 Issue の提案 A は「追跡済みの変更がゼロであることを確認したうえで `--force`」としているが、本計画は worktree 側だけ**未追跡も含める**（より安全側）。`scripts/sync-after-merge.sh` の現行実装が既にこの判定であり、スキル定義の側をそれに合わせる形になる。判定を追跡済みのみに緩めると、gitignore 漏れの手作業ファイルが警告なしに消える。

### 削除に失敗したときの回収

`git worktree remove` は失敗してもエントリだけ解除されうるので、「失敗＝何も起きていない」と仮定した手順は書けない。失敗後は必ず `git worktree list` で実状を確認してから次の手を決める。

```
remove 失敗
  ↓
git worktree list でエントリの有無を確認
  ├─ エントリが残っている → skip して警告（次回また試せる）
  └─ エントリが消えている（孤立） → worktree prune → rm -rf <path>
                                      失敗したら1度だけ再試行（virtiofs の遅延対策）
                                      それでも残ればパスを提示して手作業を案内
```

**孤立ディレクトリの `rm -rf` は `.claude/worktrees/` 配下であることを確認してから行う。** パスの取り違えで無関係なディレクトリを消さないための前提条件。

### 変更対象

| ファイル | 変更内容 |
|---|---|
| `skills/dev-cleanup/SKILL.md` | Step 6 汎用手順 3 の `--force` 化、worktree 判定基準の明記、回収手順の追加、「ルール・制約」の更新 |
| `scripts/sync-after-merge.sh` | `worktree remove` の `--force` 化、失敗時の回収処理、コメントの修正 |
| `CLAUDE.md` | `sync-after-merge.sh` の説明を実装に合わせる |

## Task Dependency Graph

```
001 (dev-cleanup: --force と判定基準)
  └─ 002 (dev-cleanup: 孤立ディレクトリの回収手順)
        └─ 003 (sync-after-merge.sh: --force と回収処理)
              └─ 004 (CLAUDE.md の記述整合)
```

001→002 は同一ファイルの連続編集。003 は 001/002 で確定した方針をスクリプトに反映するため後続。004 は 003 の実装を文書化する。

| ID | タイトル | 複雑度 |
|---|---|---|
| 001 | dev-cleanup の worktree 削除を --force 化し判定基準を揃える | low |
| 002 | dev-cleanup に孤立ディレクトリの回収手順を追加する | medium |
| 003 | sync-after-merge.sh の worktree 削除を --force 化し回収処理を入れる | medium |
| 004 | CLAUDE.md の後始末の記述を実装に合わせる | low |

## Cross-Plan Dependencies

なし。`dev-cleanup` は `docs/dev/plans/*/loop-state.yaml` を読むが、そのフォーマットは変更しない。

## Issue の記述とタスクの対応

| Issue の記述 | 解釈 | タスク |
|---|---|---|
| 「判定基準と実行手段が噛み合っていない」 | 判定を通過したら実際に削除できるようにする。提案 A を採用（ただし worktree 側の判定は未追跡を含める安全側に倒す） | 001 / 003 |
| 提案 C「孤立したときの回収手順」 | remove 失敗後は `worktree list` で実状確認 → prune → rm -rf の手順を定義に持つ | 002 / 003 |
| 「1回目は Directory not empty で失敗し、2回目で成功（virtiofs の遅延）」 | `rm -rf` は1度だけ再試行する | 002 / 003 |
| 「過去の worktree ディレクトリが 2 つ残っていた（locked 状態）」 | 回収手順が既存の孤立ディレクトリにも使えるようにする（locked は `worktree list` に出るため remove 前の確認対象） | 002 |
| 「enso commit 取得できず」「pnpm + uv のモノレポ」 | 環境情報。修正対象ではない | — |
