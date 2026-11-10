---
id: "002"
title: "dev-cleanup スキルを作成する"
status: done
priority: 1
dependencies: ["001", "008"]
estimated_complexity: high
---

# Task: dev-cleanup スキルを作成する

## Goal

PR のマージと後始末を、yes/no のゲート1つだけで完了させるスキルを新規作成する。enso 専用ではなく、enso を使う全プロジェクトで動くこと。

## Interfaces

呼び出し: 🔵

```
/enso:dev-cleanup [plan-name]
```

frontmatter: 🔵

```yaml
name: dev-cleanup
description: This skill should be used when the user asks to "dev-cleanup", "マージして片付けて", "後始末", "PR をマージ", "掃除", "cleanup", "merge and cleanup", "ブランチを片付けて", "worktree を掃除". dev-loop が ready にした PR をマージし、main の更新・マージ済み worktree とブランチの削除まで後始末する。dev-* サイクルの終端。
argument-hint: '[plan-name（省略可）]'
```

外部コマンドの契約: 🔵

```bash
gh pr view <N> --json state,isDraft,mergeable,mergeStateStatus,url,headRefName
gh pr merge <N> --merge     # mergeMethod に応じて --merge / --squash / --rebase
git status --porcelain --untracked-files=no    # 未コミット判定（追跡済みのみ）
git merge-base --is-ancestor <branch> <base>
gh pr list --state merged --head <branch> --limit 1    # squash マージの判定
```

ワークフロー: 🔵

| Step | 内容 | 対話 |
|---|---|---|
| 1 | 対象の特定（`loop-state.yaml` の `status: shipped`） | 複数時のみ |
| 2 | マージ可否の確認と二重実行の判定 | — |
| 3 | **yes/no のゲート** | 必ず |
| 4 | マージ実行 | — |
| 5 | `ExitWorktree`（keep）で本体に戻る | — |
| 6 | 後始末 | — |
| 7 | 完了報告 | — |

CI 詳細の取得手段: 🔵

| 手段 | 必要権限 | 使うか |
|---|---|---|
| `gh pr view --json mergeStateStatus` | 不要 | ✅ 主判定 |
| `gh run list --branch <branch> --limit 5` | Actions: Read | ✅ 詳細取得 |
| `gh pr checks` | Checks: Read | ❌ **使わない**。fine-grained PAT に `Checks` 権限は存在しない |

`mergeStateStatus` の扱い: 🔵

| 値 | 動作 |
|---|---|
| `CLEAN` | そのまま Step 3 へ |
| `UNSTABLE` | 警告してから Step 3 へ |
| `BLOCKED` / `DIRTY` / `BEHIND` | 中断 |
| `DRAFT` | 中断（`dev-loop` が ready にしていない） |
| `UNKNOWN` | 再取得し、不明なら Step 3 で明示して委ねる |

二重実行の判定: 🔵

| PR の状態 | 動作 |
|---|---|
| `MERGED` かつ worktree / ブランチが残存 | マージを飛ばし後始末だけ |
| `MERGED` かつ残存なし | 「既に片付いています」と伝えて終了 |
| `CLOSED`（未マージ） | 中断 |

## Test Strategy

- [ ] frontmatter の `name` が `dev-cleanup` で、ディレクトリ名 `skills/dev-cleanup/` と一致する
- [ ] `description` が既存スキルと同じ「トリガーワード列挙 → 日本語の機能説明」形式になっている
- [ ] 本文が `## 前提知識` → `## ワークフロー` → `## ルール・制約` → `## 追加リソース` の構成になっている
- [ ] Step 3 の yes/no ゲートが「唯一の確認点」であり省略できないことが本文とルール・制約の両方に書かれている
- [ ] `mergeStateStatus` の5値それぞれの扱いが表として書かれている
- [ ] **CI の詳細が取得できない場合に「取得できなかった」と明示する**指示があり、黙ってマージも硬直的な失敗もしないことが書かれている
- [ ] CI 詳細の取得に `gh run list` を使っており、**`gh pr checks` を使っていない**（`grep -n "gh pr checks" skills/dev-cleanup/SKILL.md` が 0 件、または「使わない」文脈のみ）
- [ ] `gh pr checks` を使わない理由（fine-grained PAT に `Checks` 権限が存在しない）が書かれている
- [ ] トークンの権限を直してもフォールバックを残す理由（他プロジェクト・他メンバーのトークン、CI が無いリポジトリ）が書かれている
- [ ] 未コミット判定に `--untracked-files=no` を使うことと、その理由（未追跡ファイルは fetch / pull / ブランチ削除で失われない）が書かれている
- [ ] Step 5 の `ExitWorktree`（`action: "keep"`）が Step 6 より前にあり、飛ばすと自分のいるディレクトリを消すことになる旨が書かれている
- [ ] `scripts/sync-after-merge.sh` があれば委譲し、無ければ汎用手順を実行する分岐が書かれている
- [ ] 汎用手順に fetch --prune / switch / pull --ff-only / ブランチ・worktree 削除 / prune / リモートブランチ削除 が含まれている
- [ ] squash マージ時に `merge-base --is-ancestor` が失敗するため `gh pr list --state merged --head` に問い合わせる旨が書かれている
- [ ] `mergeMethod` を `.claude/enso.json` から読み、無ければ `merge` を使うことが書かれている
- [ ] 異常系: PR が既に `MERGED` / `CLOSED` のときの3分岐が書かれている
- [ ] 異常系: `pr_number` が `null`（ローカル完結）のときマージを飛ばして後始末だけ行うことが書かれている
- [ ] 異常系: `status: shipped` の計画が0件のとき何もせず終了することが書かれている
- [ ] エッジケース: 未コミット変更のある worktree は削除せず skip して警告することが書かれている
- [ ] `SKILL.md` が 500 行以内

## Implementation Notes

- 参照すべき既存コード:
  - `scripts/sync-after-merge.sh` — 汎用手順の実装を写す元。`worktree_of()` / `merged_via_gh()` の判定方式をそのまま踏襲する
  - `skills/dev-loop/SKILL.md` — 状態ファイル仕様、`loop-state.yaml` の探索方法（カレント → 各 worktree）
  - `skills/enso-policy/SKILL.md` — 設定の読み方
- **後始末は本体チェックアウトに対して行う。** `git worktree list --porcelain` の最初のエントリが本体（`sync-after-merge.sh` と同じ方式）。`--show-toplevel` は worktree 内だと worktree 自身を指すため使わない
- `gh pr merge --delete-branch` は使わない。ローカルブランチが worktree にチェックアウトされていると削除に失敗しうる。リモート削除は後始末の最後に `git push origin --delete <branch>` を試み、既に無ければ無視する
- 再起動の案内は完了報告に含めるが、**自動化はできない**（`/reload-plugins` は CLI が受け取るコマンド）
- スキルは `skills/dev-cleanup/SKILL.md` の1階層構成。ネストしたディレクトリは読み込まれない

## Files

- 新規: `skills/dev-cleanup/SKILL.md`
