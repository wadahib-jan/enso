---
id: "005"
title: "MANUAL.md の Dev Skills 章を Entry / Internal に再編する"
status: done
priority: 3
dependencies: ["001", "002", "003"]
estimated_complexity: medium
---

# Task: MANUAL.md の Dev Skills 章を Entry / Internal に再編する

## Goal

MANUAL.md のワークフロー図とスキル解説を新しい2層構造に合わせる。`dev-navigate` の節を削除し、`dev-context` を図の起点から外し、各スキル解説がどちらの層かを読者が判別できるようにする。

## Interfaces

**変更 A: ワークフロー図** 🔵（`MANUAL.md:118-141`）

```diff
- dev-init（新規向け）  ─┐
-                       ├→ docs/dev/context.md
- dev-context（既存向け）┘
-         │
-         ▼
-     dev-plan ──→ worktree + Draft PR + ...
+ dev-init（新規プロジェクトの初期化）
+         │
+         ▼
+     dev-plan ──→ worktree + Draft PR + ...
```

```diff
-         └──→ dev-navigate（やりたいことからスキルを選択）
```

図の下に `docs/dev/context.md` は `dev-plan` などが必要時に `dev-context` を内部実行して生成する旨の注記を1文加える。図中の `dev-impl` / `dev-run` / `dev-verify` / `dev-debug` / `dev-webtest-plan` は内部スキルであることが分かる印（枝の注記など）を付ける。

**変更 B: 章構成の再編** 🔵（`MANUAL.md:158-548`）

現行の `### 1. dev-init` 〜 `### 13. dev-webtest` を2グループに分ける。

```
## Dev Skills
### ワークフロー
### 承認ゲート一覧

### 人が呼ぶスキル
  1. dev-init
  2. dev-plan
  3. dev-loop
  4. dev-cleanup
  5. dev-screen-spec
  6. dev-webtest

### 内部スキル
  各節の冒頭に「呼び出し元: <スキル名>」を明記する
  1. dev-context
  2. dev-impl
  3. dev-run
  4. dev-verify
  5. dev-debug
  6. dev-webtest-plan
```

- `### 3. dev-navigate`（`MANUAL.md:201-217`）は節ごと削除する
- 各節の本文（用途・実行方法・特徴・出力）は移動するだけで内容を変えない。ただし内部スキルの節では「実行方法」に、通常は呼び出し元から自動的に起動され、`/enso:<name>` で明示実行もできる旨を添える
- `### 2. dev-context` の「既存プロジェクトのコンテキストを分析します」という用途説明を、内部スキルとしての位置づけに合わせて調整する

**変更 C: 承認ゲート一覧** 🔵（`MANUAL.md:143-156`）

内容は変更しない。ゲートは `dev-plan` Phase 5e と `dev-cleanup` Step 3 の2つのままで、どちらも Entry スキルにあるため影響しない。

**維持** 🔵: 「分析スキル」章（`MANUAL.md:550-`）以降は全て Entry のため変更しない。

## Test Strategy

- [ ] `grep -n "dev-navigate" MANUAL.md` が 0 件
- [ ] `## Dev Skills` の下に `### 人が呼ぶスキル` と `### 内部スキル` の2見出しが存在する
- [ ] 人が呼ぶスキル側に6節（dev-init / dev-plan / dev-loop / dev-cleanup / dev-screen-spec / dev-webtest）がある
- [ ] 内部スキル側に6節（dev-context / dev-impl / dev-run / dev-verify / dev-debug / dev-webtest-plan）があり、各節に呼び出し元が明記されている
- [ ] 各グループ内の節番号が 1 から連番になっており、欠番・重複がない
- [ ] ワークフロー図の起点が `dev-init` / `dev-plan` になっており `dev-context` から始まっていない
- [ ] 承認ゲート一覧の2行（実装承認 / マージ確認）が変更されていない
- [ ] エッジケース: 移動した節の本文（実行方法のコマンド例・出力パスなど）が欠落・重複していない
- [ ] エッジケース: README.md からのアンカーリンク `#dev-skills` / `#分析スキル` / `#issue-連携` が解決する

## Implementation Notes

- 参照すべき既存コード: `MANUAL.md:114-548`（Dev Skills 章）
- 節の移動が中心のため、内容を書き直すのではなく順序の入れ替えと見出しの採番変更で行う。差分を最小に保つと検証しやすい
- 004 と見出し名を揃える（README からのリンク先が `## Dev Skills` のままであること）

## Files

- 変更: `MANUAL.md`
- テスト: なし（grep と目視による確認）
