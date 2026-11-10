---
id: "005"
title: "MANUAL のジャンル別一覧表を削除し役割分担を明記する"
status: done
priority: 3
dependencies: ["004"]
estimated_complexity: low
---

# Task: MANUAL のジャンル別一覧表を削除し役割分担を明記する

## Goal

MANUAL.md からスキル一覧表を取り除き、各スキルの詳細解説に専念させる。一覧の正本が README である状態を、両ファイルの冒頭で明示する。

## Interfaces

削除対象（🔵 README の統合一覧に吸収済み）:

```
MANUAL.md:1058 付近  "## 汎用スキル" 直下の一覧表（task-breakdown / uat-test-design の2行）
MANUAL.md:1099 付近  "## セキュリティチェックスキル" 直下の一覧表（あれば）
```

見出し自体（`## 汎用スキル` / `## セキュリティチェックスキル` と配下の `### task-breakdown` 等）は**残す**。README からアンカーリンクで参照されるため（🔵）。

追記する役割分担（MANUAL.md 冒頭 `:3`）:

```markdown
<!-- 🔵 現行の一文を、正本がどちらかまで踏み込んだ表現に置き換える -->
Enso の全スキルの詳細マニュアルです。**スキル一覧（人が呼ぶスキル / 内部スキル）の正本は [README.md](./README.md) です。** 本ファイルは各スキルの詳細解説のみを扱い、一覧表は持ちません。
```

README 側にも対の記述を置く（🟡 置き場所は統合一覧の直下を想定）:

```markdown
各スキルの詳細は [MANUAL.md](./MANUAL.md) を参照してください。**スキルを追加・削除したときは、この一覧の更新が必要です。**
```

## Test Strategy

- [ ] MANUAL.md にスキルの一覧表（複数スキルを行として並べた表）が存在しない
- [ ] `## 汎用スキル` / `## セキュリティチェックスキル` の見出しと配下の詳細解説が残っており、004 で張ったアンカーリンクが壊れていない
- [ ] MANUAL.md 冒頭に「一覧の正本は README」と読める記述がある
- [ ] README の統合一覧から MANUAL への導線が残っている
- [ ] エッジケース: MANUAL の「Dev Skills」節にある `### 人が呼ぶスキル` / `### 内部スキル` の見出しは残す（配下は各スキルの詳細解説であり一覧表ではないため）。ただし `#### 1. dev-context` の「**呼び出し元**:」行は 003 の確定値と一致させる
- [ ] エッジケース: MANUAL の「ワークフロー例」mermaid 図（`:1198` 付近）に `dev-context` などの呼び出し関係が描かれている場合、003 の確定値と矛盾しない
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- MANUAL.md `:1065` の `### task-breakdown`、`:1081` の `### uat-test-design`、`:1101` の `### ipa-security-check` は詳細解説なのでそのまま残す
- MANUAL `:403` の `#### 1. dev-context` にある「**呼び出し元**: `dev-plan / dev-impl / dev-run / dev-verify / dev-screen-spec / dev-webtest-plan`」は、003 で確定した 5 スキルに直す。他の内部スキルの「呼び出し元」行も同様に突き合わせる
- 004 と 005 の分割理由: 004 は README を書き、005 は MANUAL 側の重複を落とす。片方だけ入っても壊れないようにしている

## Files

- 変更: `MANUAL.md` / `README.md`（導線の一文のみ）
- テスト: なし（Markdown のみ）
