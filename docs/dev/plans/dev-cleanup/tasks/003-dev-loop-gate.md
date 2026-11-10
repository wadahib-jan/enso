---
id: "003"
title: "dev-loop に後始末の yes/no ゲートを追加する"
status: done
priority: 2
dependencies: ["002"]
estimated_complexity: low
---

# Task: dev-loop に後始末の yes/no ゲートを追加する

## Goal

`dev-loop` が PR を ready にしたあと、「マージして後始末しますか？」を yes/no で問い、yes なら `dev-cleanup` を起動する。ユーザーが GitHub 上で手動マージしなくて済むようにする。

## Interfaces

`skills/dev-loop/SKILL.md` の Step 9（完了）への追加: 🔵

```
### Step 10: 後始末の確認

AskUserQuestion で確認する。

| 選択肢 | 動作 |
|---|---|
| はい — マージして後始末する | dev-cleanup を起動する |
| いいえ — PR は残す | PR の URL を提示して終了する |
```

**確認を出さない条件**: 🔵

- `dev-loop` が中断した（`loop-state.yaml` の `status` が `failed`）
- `pr_number` が `null`（PR を作っていないローカル完結の構成）

## Test Strategy

- [ ] Step 9 の後に後始末の確認ステップが追加されている
- [ ] 選択肢が yes / no の2つで、yes で `dev-cleanup` を起動することが書かれている
- [ ] no を選んだ場合は現状どおり PR の URL を提示して終了することが書かれている
- [ ] **中断時（`status: failed`）にはこの確認を出さない**ことが明記されている
- [ ] `pr_number` が `null` のときは確認を出さないことが書かれている
- [ ] 「dev-* スキルフロー内の位置」の図に `dev-cleanup` が追加されている
- [ ] 既存の Step 1〜9 と中断条件・エスカレーション条件が壊れていない
- [ ] エッジケース: `dev-cleanup` を**サブエージェント経由で起動しない**旨が書かれている（`dev-cleanup` は `ExitWorktree` を使うため、セッション自体の作業ディレクトリを動かす必要がある）
- [ ] `SKILL.md` が 500 行以内

## Implementation Notes

- 参照すべき既存コード: `skills/dev-loop/SKILL.md` の Step 9（完了）、「dev-* スキルフロー内の位置」の図、「ルール・制約」
- Step 9 の「worktree は**削除しない**。マージ後にユーザーが判断する」という記述は、`dev-cleanup` に委ねる形に更新する必要がある。ただし **`ExitWorktree` はユーザーが明示的に依頼したときだけ使う**という原則は `dev-cleanup` 側で守られる（yes を選ぶことが明示的な依頼にあたる）
- `dev-loop` はメインコンテキストで動く前提なので、そこから起動される `dev-cleanup` も同じコンテキストで動く。この連鎖を崩さないこと

## Files

- 変更: `skills/dev-loop/SKILL.md`
