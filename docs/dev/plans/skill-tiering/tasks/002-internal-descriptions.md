---
id: "002"
title: "Internal 9スキルの description をトリガー語なし書式に書き換える"
status: done
priority: 1
dependencies: []
estimated_complexity: medium
---

# Task: Internal 9スキルの description をトリガー語なし書式に書き換える

## Goal

Internal に分類した9スキルの `SKILL.md` frontmatter から自動発火用のトリガー語列を削除し、内部スキルであることを明示する書式に統一する。これにより Internal スキルはユーザー発話で勝手に起動せず、`/enso:<name>` の明示指定と呼び出し元スキルからの起動でのみ動く。

## Interfaces

新しい description の書式 🔵

```yaml
description: <呼び出し元> から呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。<既存の機能説明をそのまま維持>
```

対象9スキルの書き換え後の冒頭文:

| ファイル | 冒頭に置く文 | 確信度 |
|---|---|---|
| `skills/dev-context/SKILL.md` | `dev-plan / dev-impl / dev-run / dev-verify / dev-screen-spec / dev-webtest-plan から呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。` | 🔵 |
| `skills/dev-impl/SKILL.md` | `dev-run / dev-loop から呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。` | 🔵 |
| `skills/dev-run/SKILL.md` | `dev-loop から呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。` | 🔵 |
| `skills/dev-verify/SKILL.md` | `dev-run / dev-loop から呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。` | 🔵 |
| `skills/dev-debug/SKILL.md` | `dev-run / dev-loop / ipa-security-guide から呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。` | 🔵 |
| `skills/dev-webtest-plan/SKILL.md` | `dev-plan から呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。` | 🔵 |
| `skills/ipa-security-check/SKILL.md` | `dev-loop / enso-issue-fix から呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。` | 🔵 |
| `skills/ipa-security-guide/SKILL.md` | `ipa-security-check の後段として呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。` | 🔵 |
| `skills/task-breakdown/SKILL.md` | `dev-plan から呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。` | 🔵 |

書き換え例（`dev-run`）:

```diff
-description: This skill should be used when the user asks to "dev-run", "自動実装", "タスクを一括実装", "auto implement", "run all tasks", "タスクを自動実行", "バッチ実装", "dev-run auth 001 005". Plan内の指定範囲のタスクをdev-impl/dev-verify/dev-debugのワークフローで自動実行するオーケストレーションスキル。
+description: dev-loop から呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。Plan内の指定範囲のタスクをdev-impl/dev-verify/dev-debugのワークフローで自動実行するオーケストレーションスキル。
```

`ipa-security-check` と `ipa-security-guide` は元々トリガー語列を持たないため、冒頭に1文を挿入するだけになる。

## Test Strategy

- [ ] Internal 9スキルの description に `This skill should be used when the user asks to` が1件も残っていない
- [ ] Internal 9スキルの description が `... から呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。` で始まる
- [ ] 各スキルの機能説明文（既存の後半部分）が欠落していない
- [ ] `argument-hint` を持つスキル（dev-impl / dev-run / dev-verify / dev-debug / dev-webtest-plan / ipa-security-guide）で `argument-hint` が変更されていない
- [ ] `name` フィールドが全スキルで変更されていない
- [ ] Entry 18スキルの description が変更されていない（`git diff --name-only skills/` に Entry スキルが現れない）
- [ ] エッジケース: frontmatter が YAML として壊れていない（`---` の対、description が1行に収まりコロン以降がクォート無しで解釈できる）
- [ ] エッジケース: `skills/uat-test-design/SKILL.md` の `allowed-tools` など他スキル固有のフィールドに影響していない

## Implementation Notes

- 参照すべき既存コード: 各 `skills/<name>/SKILL.md` の1〜5行目
- description は1行の YAML スカラー。既存も引用符なしで書かれているため、書き換え後も `:` の直後にスペース1つ、値は1行に収める
- SKILL.md 本文（`# <Skill Name>` 以降）は変更しない
- 呼び出し元スキル側の参照はパス指定（`skills/<name>/SKILL.md`）で行われており description に依存しないため、呼び出し元の修正は不要

## Files

- 変更: `skills/dev-context/SKILL.md`
- 変更: `skills/dev-impl/SKILL.md`
- 変更: `skills/dev-run/SKILL.md`
- 変更: `skills/dev-verify/SKILL.md`
- 変更: `skills/dev-debug/SKILL.md`
- 変更: `skills/dev-webtest-plan/SKILL.md`
- 変更: `skills/ipa-security-check/SKILL.md`
- 変更: `skills/ipa-security-guide/SKILL.md`
- 変更: `skills/task-breakdown/SKILL.md`
- テスト: なし（grep による確認）
