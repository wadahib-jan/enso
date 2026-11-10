---
id: "003"
title: "context.md 不在時のフォールバックを自動生成に変更する"
status: done
priority: 2
dependencies: []
estimated_complexity: medium
---

# Task: context.md 不在時のフォールバックを自動生成に変更する

## Goal

`docs/dev/context.md` が無いときにユーザーを突き返していた6スキルを、`dev-context` を内部実行して続行する挙動に変更する。あわせて各 SKILL.md のワークフロー図の先頭から `dev-context →` を外し、`dev-context` を「前段の手順」から「必要時に自動生成される中間成果物」へ位置づけ直す。

## Interfaces

**変更 A: 突き返しの解消** 🔵

現行の記述（6スキル・計11箇所）を統一形式に置き換える。

```diff
- 1. `docs/dev/context.md` の存在を確認する。存在しない場合は `/dev-context` の実行を案内して終了する
+ 1. `docs/dev/context.md` の存在を確認する。存在しない場合は `dev-context` を内部実行して生成し、そのまま続行する
```

```diff
- - context.md が存在しない場合は `/dev-context` を案内して終了する
+ - context.md が存在しない場合は `dev-context` を内部実行して生成してから続行する
```

対象箇所:

| ファイル | 行 | 種別 | 確信度 |
|---|---|---|---|
| `skills/dev-plan/SKILL.md` | 23-24 | 前提条件 | 🔵 |
| `skills/dev-plan/SKILL.md` | 355 | ルール・制約 | 🔵 |
| `skills/dev-impl/SKILL.md` | 232 | ルール・制約 | 🔵 |
| `skills/dev-run/SKILL.md` | 43 | 手順 | 🔵 |
| `skills/dev-run/SKILL.md` | 257 | ルール・制約 | 🔵 |
| `skills/dev-screen-spec/SKILL.md` | 100, 391 | 手順 | 🔵 |
| `skills/dev-screen-spec/SKILL.md` | 491, 522 | エラー処理 / ルール | 🔵 |
| `skills/dev-webtest-plan/SKILL.md` | 99, 298 | 手順 | 🔵 |
| `skills/dev-webtest-plan/SKILL.md` | 271, 484, 503 | エラー処理 / ルール | 🔵 |

`dev-verify` は context.md をテスト・ビルドコマンドの取得に使うが不在時の分岐を持たないため、変更対象外（行番号は実装時に再確認する）。

**変更 B: ワークフロー図の起点修正** 🔵

各 SKILL.md 16行目付近のワークフロー図から先頭の `dev-context → ` を削除する。

```diff
- dev-context → [dev-plan] → （人間が PR を確認）→ dev-loop → dev-run → dev-verify
+ [dev-plan] → （人間が PR を確認）→ dev-loop → dev-run → dev-verify
```

対象: `dev-plan` / `dev-impl` / `dev-debug` / `dev-verify` / `dev-loop` / `dev-cleanup` / `dev-run` / `dev-webtest` / `dev-webtest-plan`

`skills/dev-context/SKILL.md` 自身の「dev-*スキル全体像」の図と「本スキルはワークフローの最初のステップ」という記述も、内部スキルとしての位置づけに書き換える。

**維持する記述** 🔵

`skills/dev-init/SKILL.md` の「出力フォーマットは `dev-context` と完全互換」「既存プロジェクトの自動分析には `dev-context` を使用する」は変更しない。`dev-init` は Entry のままで、新規プロジェクト向けの対話生成という役割は変わらないため。

## Test Strategy

- [ ] `grep -rn "案内して終了" skills/` の結果に context.md 関連の行が含まれない
- [ ] `grep -rn "/dev-context` を案内" skills/` が 0 件
- [ ] 6スキルの該当箇所が「`dev-context` を内部実行して生成し、そのまま続行する」形式になっている
- [ ] `grep -rn "^dev-context → " skills/` が 0 件（ワークフロー図の起点から除去済み）
- [ ] `skills/dev-context/SKILL.md` に「ワークフローの最初のステップ」という記述が残っていない
- [ ] `skills/dev-init/SKILL.md` の `dev-context` 互換に関する記述が変更されていない
- [ ] エッジケース: `dev-screen-spec` / `dev-webtest-plan` は同一の記述が複数箇所（手順・エラー処理・ルール）にあり、そのすべてが変更されている
- [ ] エッジケース: context.md が既に存在する場合の挙動（そのまま読み込んで続行）は変更されていない

## Implementation Notes

- 参照すべき既存コード: 各 SKILL.md の「前提条件」「ルール・制約」「エラー処理」節と、冒頭の「dev-*スキルフロー内の位置」節
- 行番号は 002 の frontmatter 変更で1行もずれないが、他タスクとの並行編集後は再 grep してから置換する
- 「内部実行」とは、スキル本文の手順として `dev-context` の生成処理を起動することを指す。ユーザーへの案内で止めないことが要点

## Files

- 変更: `skills/dev-plan/SKILL.md`
- 変更: `skills/dev-impl/SKILL.md`
- 変更: `skills/dev-run/SKILL.md`
- 変更: `skills/dev-verify/SKILL.md`
- 変更: `skills/dev-debug/SKILL.md`
- 変更: `skills/dev-loop/SKILL.md`
- 変更: `skills/dev-cleanup/SKILL.md`
- 変更: `skills/dev-webtest/SKILL.md`
- 変更: `skills/dev-webtest-plan/SKILL.md`
- 変更: `skills/dev-screen-spec/SKILL.md`
- 変更: `skills/dev-context/SKILL.md`
- テスト: なし（grep による確認）
