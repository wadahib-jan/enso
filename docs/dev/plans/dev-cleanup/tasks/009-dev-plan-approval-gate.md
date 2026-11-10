---
id: "009"
title: "dev-plan の承認待ちを yes/no の選択形式にする"
status: done
priority: 2
dependencies: []
estimated_complexity: medium
---

# Task: dev-plan の承認待ちを yes/no の選択形式にする

## Goal

`dev-plan` の Phase 5e が自由入力（「確認した」と伝える）待ちになっている。`dev-loop` の後始末ゲート（タスク 003）と同じ AskUserQuestion の yes/no に揃える。

## Interfaces

現在の Phase 5e: 🔵

```
計画を PR にしました: <pr_url>
内容を確認したら「確認した」と伝えてください。実装（dev-run → dev-verify）を開始します。
```

変更後: 🔵

PR の URL とタスク件数を提示したうえで、AskUserQuestion で問う。

| 選択肢 | 動作 |
|---|---|
| はい — 実装を開始する | `dev-loop` を起動する |
| いいえ — あとで確認する | PR の URL を提示して終了する。後から「確認した」でも `dev-loop` が拾える |

**「いいえ」を選んでも `loop-state.yaml` は `awaiting-approval` のまま**にする。後から `dev-loop` を起動できる経路を残す。

### enso-issue-fix との整合（重要）🔵

`enso-issue-fix` は Step 5 で `dev-plan` を呼び、Step 6 で自前の停止メッセージ（「Issue のどの記述をどう解釈したか」を含む）を出す設計になっている。`dev-plan` にゲートが入ると、**`dev-plan` のゲートが先に出て Step 6 に到達しない**。

**ゲートは `dev-plan` に一本化する。**

| 変更前 | 変更後 |
|---|---|
| `dev-plan` は自由入力待ちで終了 → `enso-issue-fix` Step 6 が停止メッセージを出す | `dev-plan` のゲートが唯一の停止点。`enso-issue-fix` Step 6 は自前提示をやめる |

`enso-issue-fix` Step 4 の引き渡し内容に「**停止時の提示に『Issue のどの記述をどう解釈したか』を含めること**」を追加し、`dev-plan` 側でその文言を出させる。

## Test Strategy

- [ ] `skills/dev-plan/SKILL.md` の Phase 5e が AskUserQuestion による yes/no になっている
- [ ] 「はい」で `dev-loop` を起動することが書かれている
- [ ] 「いいえ」で PR の URL を提示して終了し、**`loop-state.yaml` は `awaiting-approval` のまま**であることが書かれている
- [ ] 「いいえ」の後でも「確認した」で `dev-loop` が拾えることが書かれている
- [ ] PR を作らなかった場合（`pr_number` が `null`）の扱いが書かれている
- [ ] `skills/enso-issue-fix/SKILL.md` の Step 6 から自前の停止メッセージが削除され、`dev-plan` のゲートに委ねる旨に置き換わっている
- [ ] `skills/enso-issue-fix/SKILL.md` の Step 4（引き渡し内容）に「停止時の提示に解釈の対応関係を含めること」が追加されている
- [ ] `skills/enso-issue-fix/references/plan-request-template.md` にも同じ指示が反映されている
- [ ] 異常系: `dev-plan` が worktree 作成に失敗しローカル完結になった場合もゲートが機能する
- [ ] エッジケース: **ゲートが二重に出ない**（`enso-issue-fix` 経由でも停止点は1つだけ）
- [ ] `dev-loop` を**サブエージェント経由で起動しない**旨が `dev-plan` 側にも書かれている（Task のネスト不可）
- [ ] 両 `SKILL.md` が 500 行以内

## Implementation Notes

- 参照すべき既存コード:
  - `skills/dev-plan/SKILL.md` の「Phase 5: コミットと Draft PR」の 5e
  - `skills/dev-loop/SKILL.md` の起動条件（`status: awaiting-approval` の計画が無ければ何もしない）
  - `skills/enso-issue-fix/SKILL.md` の Step 4〜6
  - タスク 003 で `dev-loop` に追加する後始末ゲート — **同じ体裁に揃える**
- `dev-loop` の起動条件は `loop-state.yaml` の `status` なので、「いいえ」でも状態を変えなければ後から拾える。**この性質を壊さないこと**
- `dev-plan` は `dev-loop` をメインコンテキストで起動する必要がある（`dev-run` が Task サブエージェントを使うためネスト不可）
- これで承認ゲートが2箇所（`dev-plan` 後 / `dev-loop` 後）に揃い、**開発サイクル全体が yes/no の2回だけで回る**ことになる

## Files

- 変更: `skills/dev-plan/SKILL.md`
- 変更: `skills/enso-issue-fix/SKILL.md`
- 変更: `skills/enso-issue-fix/references/plan-request-template.md`
