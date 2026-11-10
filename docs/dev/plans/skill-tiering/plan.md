# Plan: skill-tiering

## Requirements Summary

enso のスキルを **Entry（人が明示的に呼ぶ）** と **Internal（他スキルから呼ばれる）** の2層に分離する。あわせて `dev-navigate` を廃止し、`dev-context` を Internal 化したうえで「context.md が無ければ突き返す」挙動を解消する。ドキュメント（README / MANUAL / CLAUDE.md）も新しい区分に合わせて再編する。

### 制約

`skills/` は直下1階層しか読み込まれないため、ディレクトリによる物理分離はできない。分離手段は次の2つに限られる。

1. `SKILL.md` frontmatter の `description` の書式 — 自動発火を制御する唯一の実効的なスイッチ
2. README / MANUAL の章立て — 人間向けの提示

スキル本体の処理ロジック（ワークフロー・Step 定義）は変更しない。変更するのは frontmatter の1行と、context.md 不在時のフォールバック、およびドキュメントである。

### 確定した分類

**Entry（トリガー語列を維持）— 18スキル**

`dev-init` / `dev-plan` / `dev-loop` / `dev-cleanup` / `dev-screen-spec` / `dev-webtest` / `feature-rubber-duck` / `enso-issue-fix` / `enso-issue-report` / `enso-policy` / `bug-analysis` / `impact-analysis` / `edgecase-analysis` / `performance-analysis` / `sequence-diagram-analysis` / `state-transition-analysis` / `rev-docs` / `uat-test-design`

**Internal（トリガー語列を削除）— 9スキル**

| スキル | 呼び出し元 |
|---|---|
| `dev-context` | `dev-plan` / `dev-impl` / `dev-run` / `dev-verify` / `dev-screen-spec` / `dev-webtest-plan` |
| `dev-impl` | `dev-run` / `dev-loop` |
| `dev-run` | `dev-loop` |
| `dev-verify` | `dev-run` / `dev-loop` |
| `dev-debug` | `dev-run` / `dev-loop` / `ipa-security-guide` |
| `dev-webtest-plan` | `dev-plan` |
| `ipa-security-check` | `dev-loop` / `enso-issue-fix` |
| `ipa-security-guide` | `ipa-security-check` の後段 |
| `task-breakdown` | `dev-plan` |

**廃止 — 1スキル**: `dev-navigate`

## Design Overview

### インターフェース: description の2書式 🔵

description は Claude Code がスキルを自動発火させるかどうかを決める唯一の入力である。したがって層の分離は「トリガー語列を書くか書かないか」に還元される。

**Entry 書式（現状維持）**

```yaml
description: This skill should be used when the user asks to "<name>", "<日本語トリガー>", ... . <機能の説明>
```

**Internal 書式（新規）**

```yaml
description: <呼び出し元スキル> から呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。<機能の説明>
```

- トリガー語列（`This skill should be used when the user asks to ...` の日英列挙）を丸ごと削除し、冒頭の1文に置き換える
- **機能の説明文はそのまま残す** — `/enso:<name>` で明示指定されたときの動作理解と、呼び出し元スキルが参照するために必要
- `argument-hint` は変更しない
- `name` は変更しない（リネームすると全参照の書き換えが発生し、変更範囲に見合わない）

この書式なら Internal スキルは自動発火しなくなり、`/enso:<name>` の明示指定でのみ起動する。呼び出し元スキルからの参照は SKILL.md 本文のパス参照で行われており、description には依存しないため影響しない。

### dev-context の突き返し解消 🔵

現状 6スキル（`dev-plan` / `dev-impl` / `dev-run` / `dev-verify` / `dev-screen-spec` / `dev-webtest-plan`）が `docs/dev/context.md` 不在時に「`/dev-context` の実行を案内して終了」する。これは Entry スキルであるはずの `dev-plan` がユーザーを一度突き返す設計であり、`dev-context` を Internal 化する以上は成立しない。

これらを **「context.md が存在しない場合は `dev-context` を内部実行して生成し、そのまま続行する」** に統一する。`dev-init` の「出力フォーマットは dev-context と完全互換」という記述は維持する（新規プロジェクト向けの対話生成という役割は変わらない）。

あわせて各 SKILL.md 冒頭のワークフロー図の先頭から `dev-context →` を外す。`dev-context` は前段の手順ではなく、必要時に自動生成される中間成果物になるためである。

### 履歴ドキュメントの扱い 🟡

完了条件は「`dev-navigate` への参照がリポジトリ内に残っていないこと」だが、`docs/dev/plans/<過去の plan>/` 配下（`dcs-to-skills` / `dev-cleanup` / `issue-skills` / `merge-gate-dedupe` / `retire-commands`）には、その時点の作業記録として `dev-navigate` への言及が多数ある。**これらは書き換えない。** 過去の計画・検証レポートは「そのとき何をしたか」の記録であり、現在の構成に合わせて書き換えると記録として成立しなくなる。

したがって参照掃除の対象は次に限定し、完了確認の grep も同じ範囲で行う。

- `skills/` 配下
- `README.md` / `MANUAL.md` / `CLAUDE.md`
- `docs/dev/context.md`（enso 自身のコンテキストファイル。現在の構成を表すため更新対象）

`scripts/` と `book/` には `dev-navigate` / `dev-context` への参照が無いことを確認済み。

### ドキュメント再編方針 🔵

**README.md**: 「Dev Skills」テーブルを Entry / Internal の2テーブルに分割する。分析スキル・Issue 連携・リバースエンジニアリングは全て Entry なので構成を維持し、「ユーティリティスキル」からは `dev-navigate` を削除して `enso-policy` のみにする。クイックスタートの「既存プロジェクト」フローから `dev-context` と `dev-navigate` の手順を削除する。

**MANUAL.md**: ワークフロー図から `dev-navigate` の枝を削除し、`dev-context` を図の起点から「必要時に自動生成」の注記へ移す。Dev Skills 章を「Entry スキル」「内部スキル」の2グループに再編し、各グループ内で採番し直す。`### 3. dev-navigate` の節は削除する。

**CLAUDE.md**: 「スキルの2層構造」節を新設し、区分の定義・現在の所属・新規スキル追加時にどちらの書式で description を書くかの規約を記載する。

## Task Dependency Graph

```
001 dev-navigate の廃止と参照掃除
002 Internal 9スキルの description 書き換え
003 context.md 不在時のフォールバック変更とワークフロー図の修正
         │
         ├─ 001, 002, 003 は互いに独立（触るファイルが重複しない）
         ▼
004 README.md の再編          （001, 002 に依存）
005 MANUAL.md の再編          （001, 002, 003 に依存）
006 CLAUDE.md に2層構造の規約を追記（002 に依存）
```

`001` / `002` / `003` は並行可能。ドキュメント3件（`004` / `005` / `006`）は分類とスキル側の変更が確定してから行う。

## Cross-Plan Dependencies

なし。既存スキルの frontmatter とドキュメントのみを変更し、hooks・scripts には影響しない。
