---
id: "003"
title: "古いフロー図・食い違う記述・旧呼び出し表記を整理する"
status: done
priority: 2
dependencies: []
estimated_complexity: medium
---

# Task: 古いフロー図・食い違う記述・旧呼び出し表記を整理する

## Goal

実際のフロー（dev-plan → 人間 → dev-loop → dev-run）と合わない「スキルフロー内の位置」図を呼び出し元1行に置き換え、スキル間で食い違う記述と、実装の無い機能の説明、`/enso:` の無い旧呼び出し表記を揃える。

## Interfaces

```text
Internal スキルの冒頭 : 呼び出し元: `<caller>`（CLAUDE.md の表と一致させる）  🔵
Entry スキルの冒頭   : 図を削除し、役割を1行で書く                          🔵
呼び出し例           : `/enso:<name>`                                         🔵 README/MANUAL と同じ
```

## Test Strategy

- [ ] dev-impl / dev-verify / dev-debug / dev-run / dev-webtest-plan の冒頭に図が無く、呼び出し元が CLAUDE.md の表と一致する
- [ ] dev-webtest / dev-screen-spec / dev-init から `dev-plan → dev-impl → dev-verify` 型の図が消えている
- [ ] `visual-check-criteria.md` の判定表に「修正」を行うアクション列が無い
- [ ] `grep -rnE '`/dev-[a-z-]+' skills` が 0 件（`/enso:dev-` のみ）
- [ ] `grep -rn 'docs/rule' MANUAL.md README.md skills` が 0 件
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- フロー図:
  - dev-impl:13-19 → `呼び出し元: `dev-run`（Plan のタスクを1件ずつ実装）`
  - dev-verify:13-19 → `呼び出し元: `dev-run` / `dev-loop``
  - dev-debug:13-24 → `呼び出し元: `dev-run`。`webtest` モードは dev-webtest の検出結果に対して `/enso:dev-debug webtest` で明示実行する`
  - dev-run:13-21 → `呼び出し元: `dev-loop`。impl / debug / verify のサブエージェントを起動する`
  - dev-webtest-plan:13-24 → `呼び出し元: `dev-webtest``
  - dev-webtest:13-23 → 図を削除し `Web 画面の動作確認に使う。検出した問題の修正は dev-debug（`webtest` モード）で行う。`
  - dev-screen-spec:15-31 → 図を削除し `出力した画面仕様の差分は dev-webtest-plan の差分更新モードの入力になる。`
  - dev-init:21-23 の図3行を削除、:27 を `後続の dev-* スキルがそのまま参照可能` に
  - 現状で正しい dev-plan / dev-loop / dev-cleanup / rev-docs / dev-context は変更しない
- enso-issue-fix:282 のセキュリティチェック条件の食い違いは、タスク 007 で Step 7 ごと削除して解消する（ここでは触らない）
- dev-webtest/references/visual-check-criteria.md:8-11 → 「アクション」列を削除（SKILL.md Step 7「本スキルでは修正を行わない」に揃える）
- `/dev-X` → `/enso:dev-X`: dev-webtest-plan（SKILL.md 複数箇所, references/lightweight-inference-guide.md:202）、dev-run:25,44,258、dev-debug:29-31,71,233、dev-screen-spec:35-40,227,228,392,463,467-469,496、dev-verify:23,142,143、dev-impl:33,69,151,233、dev-plan:33-34
- MANUAL.md:7-25（`### プロジェクト固有のルール設定` の節）を削除
- 対象外（振る舞いが変わるため別件）: dev-run / dev-webtest-plan が「`/dev-plan` を案内して終了」している点（Internal は突き返さない原則との不一致）、dev-screen-spec:468 / dev-webtest-plan:241 の案内先が dev-impl である点。表記のプレフィックスのみ揃える

## Files

- 変更: skills/{dev-impl,dev-verify,dev-debug,dev-run,dev-webtest-plan,dev-webtest,dev-screen-spec,dev-init,dev-plan}/SKILL.md
- 変更: skills/dev-webtest/references/visual-check-criteria.md, skills/dev-webtest-plan/references/lightweight-inference-guide.md
- 変更: MANUAL.md
