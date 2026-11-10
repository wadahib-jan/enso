# Plan: retire-commands

## Requirements Summary

`commands/` に残る13ファイルを全廃し、enso を **スキルのみのプラグイン**にする。rev-* 4本は PR #20 で `skills/rev-docs/` に統合済みで、残りはすべて既存スキルで代替できるか、現在の dev-* フロー・強制モードと噛み合わない。

削除方針（ユーザー確定済み）:

| コマンド | 方針 | 代替 |
|---|---|---|
| `auto-debug` / `build-fix` / `env-fix` | 単純削除 | `dev-debug`（カテゴリ別診断がすでにカバー） |
| `flaky-fix` / `timeout-fix` / `test-optimization-patterns` | 固有ノウハウを `skills/dev-debug/references/` へ退避してから削除 | `dev-debug` + 新 references |
| `refine-plan` / `refine-execute` | 単純削除 | `dev-plan`(Lightweight) + `dev-impl`(クイック) + `dev-loop` |
| `orchestrate` | 単純削除 | `dev-run` |
| `task-exec` | 単純削除 | `dev-plan` → `dev-loop`（task-exec は自前の worktree 運用で強制モードと衝突する） |
| `help` | 単純削除 | スキル一覧は Claude Code 側で参照可能。困りごと検索は `dev-navigate` |
| `adr-rubber-duck` | 単純削除 | （運用していないため廃止） |
| `tech-stack` | 単純削除 | `dev-init` / `dev-context` が生成する `docs/dev/context.md` |

加えて `commands/` ディレクトリごと削除し、`.claude-plugin/plugin.json` から `"commands": "./commands/"` を外す。

## Design Overview

### 1. dev-debug への吸収（情報を失わない部分）

`dev-debug` のカテゴリ表には「テスト失敗」「環境・設定」「依存関係」はあるが、**flaky（不安定テスト）とテストタイムアウト**のカテゴリが無い。この2つと `test-optimization-patterns` の743行のパターン集だけが「dev-debug に無い固有ノウハウ」なので references に退避する。

```
skills/dev-debug/
├── SKILL.md                                   # カテゴリ2行と参照リンクを追記（変更）
└── references/                                # 新規
    ├── flaky-tests.md                         # ← commands/flaky-fix.md:28-115
    ├── test-timeouts.md                       # ← commands/timeout-fix.md:28-133
    └── test-optimization-patterns.md          # ← commands/test-optimization-patterns.md（frontmatter 除去）
```

`auto-debug` / `build-fix` / `env-fix` の内容は dev-debug のワークフローと重複するため退避しない（🔵 `skills/dev-debug/SKILL.md:39-49` のカテゴリ表と Step 1-3 に同等の手順が定義済み）。

### 2. 参照の付け替え

削除するコマンド名を参照している既存スキル・ドキュメントを、対応するスキルへ書き換える。`docs/dev/plans/` 配下の過去計画は履歴なので触らない。

| ファイル | 現在の参照 | 付け替え先 |
|---|---|---|
| `skills/performance-analysis/SKILL.md:29-33` | timeout-fix / flaky-fix / test-optimization-patterns | `dev-debug` とその references |
| `skills/impact-analysis/SKILL.md:27` | refine-plan | `dev-plan`（Lightweight） |
| `skills/feature-rubber-duck/SKILL.md:32` | adr-rubber-duck | 記述削除 |
| `skills/enso-issue-fix/SKILL.md:211`, `skills/enso-issue-fix/references/plan-request-template.md:44` | `commands/**` を対象パスに含む | 列から除去 |
| `skills/enso-issue-report/SKILL.md:81` | 発生箇所の選択肢「コマンド（`commands/`）」 | 選択肢から除去 |
| `skills/ipa-security-check/SKILL.md:170`, `skills/ipa-security-check/lib/orchestrator.md:46` | `commands/` 前提の記述 | 実態に合わせて修正 |
| `README.md` / `MANUAL.md` / `CLAUDE.md` / `docs/dev/context.md` | コマンド一覧・`commands/` の構造説明 | 削除・スキル前提に書き換え |

### 3. マニフェスト

```json
{
  "name": "enso",
  "version": "1.0.0",
  "description": "...",
  "skills": "./skills/"
}
```

`commands` キーを外す。`claude plugin validate .` が通ること、および既知警告 `commands/tech-stack.md: No frontmatter block found` が消えることを確認する。

## Task Dependency Graph

```
001 (dev-debug references 追加)
      │
      ▼
002 (commands/ 削除 + plugin.json)
      │
      ├─→ 003 (スキル内の参照修正)
      └─→ 004 (README / MANUAL / CLAUDE.md / context.md 更新)
```

001 を先に済ませることで、退避元ファイルを消す 002 のあとに「あの内容どこへ行った」が起きない。003 と 004 は 002 のあとなら順不同。

## Cross-Plan Dependencies

- `rev-docs`（PR #20, shipped）— rev-* 4本の統合・削除は完了済み。本 Plan は残り13本を扱う
- `dcs-to-skills`（PR #8, shipped）— `commands/dcs/` の廃止。本 Plan はその最終段階にあたる
