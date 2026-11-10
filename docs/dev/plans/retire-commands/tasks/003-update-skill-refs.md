---
id: "003"
title: "既存スキル内の削除済みコマンドへの参照を付け替える"
status: done
priority: 2
dependencies: ["002"]
estimated_complexity: medium
---

# Task: 既存スキル内の削除済みコマンドへの参照を付け替える

## Goal

`skills/` 配下に残る、削除したコマンド名および `commands/` ディレクトリ前提の記述を、実在するスキル・パスへ書き換える。読んだ利用者が存在しないコマンドを呼ぼうとする状態を無くす。

## Interfaces

書き換え対象と方針:

| ファイル:行 | 現状 | 変更後 |
|---|---|---|
| `skills/performance-analysis/SKILL.md:29-33` | 「timeout-fix」「flaky-fix」「test-optimization-patterns」との使い分け | `dev-debug`（テストのタイムアウト・flaky を含む）との使い分け。パターン集は `skills/dev-debug/references/test-optimization-patterns.md` として案内 🔵 001 で作成 |
| `skills/impact-analysis/SKILL.md:27` | 「**refine-plan** — 小規模修正向け。影響調査は…軽量版」 | `dev-plan`（Lightweight モード）との対比に書き換え |
| `skills/feature-rubber-duck/SKILL.md:32` | 「**adr-rubber-duck** — 単一のアーキテクチャ決定に絞った壁打ち」 | 行を削除（対比先が存在しなくなるため） |
| `skills/enso-issue-fix/SKILL.md:211` | パス抽出対象に `commands/**` を含む | `skills/**` / `hooks/**` / `scripts/**` / `*.md` に絞る |
| `skills/enso-issue-fix/references/plan-request-template.md:44` | 「変更対象は enso 本体（`skills/` / `hooks/` / `commands/` / `scripts/` / ドキュメント）」 | `commands/` を除去 |
| `skills/enso-issue-report/SKILL.md:81` | 発生箇所の選択肢に「コマンド（`commands/`）」 | 選択肢から除去（スキル / hooks・強制モード / ドキュメント / 分からない の4択にする） |
| `skills/ipa-security-check/SKILL.md:170` | ディレクトリ構造例に `commands/` | 実態に合わせて修正または除去 |
| `skills/ipa-security-check/lib/orchestrator.md:46` | 「`commands/ipa-security-check.md` に定義された引数を解釈する」 | `skills/ipa-security-check/SKILL.md` を指すよう修正 |

## Test Strategy

- [ ] `grep -rn "auto-debug\|build-fix\|env-fix\|flaky-fix\|timeout-fix\|test-optimization-patterns\|refine-plan\|refine-execute\|orchestrate\|task-exec\|tech-stack\|adr-rubber-duck" skills/` の結果が、`skills/dev-debug/references/test-optimization-patterns.md`（001 で作成したファイル自身とその参照）以外 0 件
- [ ] `grep -rn "commands/" skills/` が 0 件
- [ ] `skills/performance-analysis/SKILL.md` に「テストが遅いなら dev-debug、アプリが遅いなら本スキル」相当の使い分けが残っている（削除ではなく付け替えであること）
- [ ] `skills/impact-analysis/SKILL.md` に軽量な代替手段への言及が残っている
- [ ] `skills/enso-issue-report/SKILL.md` の質問2の選択肢が4つ以内で、AskUserQuestion の選択肢上限（4）を超えていない
- [ ] `skills/ipa-security-check/lib/orchestrator.md` が指すファイルパスが実在する（`test -f` で確認）
- [ ] 各 SKILL.md が500行以内のまま

## Implementation Notes

- 参照すべき既存コード: `skills/bug-analysis/SKILL.md` の「他スキルとの使い分け」節 — 使い分け記述の文体を合わせる
- 実装のヒント:
  - 単純な文字列置換で済むのは `plan-request-template.md:44` と `orchestrator.md:46` のみ。他は前後の文脈を読んでから書き換える
  - `enso-issue-report` の選択肢削除は、質問の選択肢数が変わるため前後の分岐（回答に応じた処理）も確認する
- 注意事項:
  - `docs/dev/plans/` 配下は過去計画の履歴なので**変更しない**（grep の対象からも除外する）
  - `skills/dev-init/references/tech-recommendations.md:265` の `commands/` は**一般的なプロジェクト構成例**であり enso の `commands/` ではないため変更しない

## Files

- 変更: `skills/performance-analysis/SKILL.md`, `skills/impact-analysis/SKILL.md`, `skills/feature-rubber-duck/SKILL.md`, `skills/enso-issue-fix/SKILL.md`, `skills/enso-issue-fix/references/plan-request-template.md`, `skills/enso-issue-report/SKILL.md`, `skills/ipa-security-check/SKILL.md`, `skills/ipa-security-check/lib/orchestrator.md`
- テスト: なし（受け入れ条件の grep で検証する）
