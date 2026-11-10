# Plan: merge-gate-dedupe

## Requirements Summary

`dev-loop` の完了後に「マージして後始末しますか？」を聞き、続けて起動する `dev-cleanup` が「PR #N をマージして後始末しますか？」を再び聞くため、**同じ判断を2回求められる**。この重複を解消する。

- **やること**: `dev-loop` Step 10 の AskUserQuestion ゲートを廃止し、スキップ条件に該当しない限り無条件で `dev-cleanup` へ引き継ぐ。マージ確認は `dev-cleanup` Step 3 の1回だけにする。
- **やらないこと**: `dev-cleanup` Step 3 のゲート自体は残す（マージは外向きで取り消しにくい操作であり、PR 状態・CI・削除対象を提示できるのはこちら）。`dev-plan` Phase 5e の実装承認ゲートは変更しない。
- **スキップ条件は維持**: `status: failed` / `pr_number: null` の場合、`dev-loop` は `dev-cleanup` を起動せず PR の URL を提示して終了する（従来の「質問しない条件」と同じ範囲）。
- **他スキルの冗長性調査（完了済み）**: 連鎖するゲートを全スキルで確認した結果、同一の判断を二重に問うのは `dev-loop` → `dev-cleanup` のみ。`dev-navigate` Step 4（起動確認）→ `dev-plan` Phase 0（モード選択）、`enso-issue-fix` Step 1b（条件付き続行確認）→ `dev-plan` Phase 5e、`dev-plan` Phase 5e → `dev-loop`（入口にゲート無し）はいずれも異なる判断であり重複しない。

## Design Overview

ゲートの責務を「判断材料を最も多く提示できる側」に一本化する。

| 変更前 | 変更後 |
|---|---|
| `dev-loop` Step 10: yes/no → `dev-cleanup` 起動 | `dev-loop` Step 10: 質問せず `dev-cleanup` を起動（引き継ぎ） |
| `dev-cleanup` Step 3: yes/no → マージ実行 | 変更なし（唯一のゲート） |

- 「マージしない」選択肢は `dev-cleanup` Step 3 の「いいえ — 何もしない」で保たれるため、ユーザーの選択肢は失われない。
- `dev-cleanup` を**サブエージェント経由で起動しない**制約は維持する（`ExitWorktree` がセッションの作業ディレクトリを動かすため）。
- 承認ゲートは開発サイクル全体で **2箇所**（実装承認 / マージ確認）になる。ドキュメント（MANUAL.md の承認ゲート一覧・フロー図、`dev-plan` の「承認ゲートの1つ目/2つ目」の記述）を同じ数え方に揃える。

## Task Dependency Graph

```
001 (dev-loop Step 10 の引き継ぎ化)
 ├─→ 002 (dev-cleanup / dev-plan の関連記述を整合)
 └─→ 003 (MANUAL.md・README.md のゲート一覧とフロー図を更新)
```

002 と 003 は 001 の確定内容に依存するが、互いには独立。

## Cross-Plan Dependencies

`issue-18-approval-gate-ask-question`（PR #19）で「各ゲートは AskUserQuestion で出す」規約を入れた。本 Plan はゲートを1つ減らすが、**残るゲートは引き続き AskUserQuestion で出す**という規約は維持する。
