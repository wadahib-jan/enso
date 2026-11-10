---
id: "001"
title: "init が enso.json を追跡下に置き PR を作るようにする"
status: done
priority: 1
dependencies: []
estimated_complexity: medium
---

# Task: init が enso.json を追跡下に置き PR を作るようにする

## Goal

`skills/enso-policy/SKILL.md` の `init` ワークフローに、生成した `.claude/enso.json` を git 追跡下に置き、コミットして PR まで作成する手順を追加する。ルール・制約「`.claude/enso.json` は git 管理下に置く」との食い違い（Issue #12 の本体）を解消する。

## Interfaces

変更後の `init` ワークフローの構造。

```
### init: 強制モードを有効にする

1. プロジェクトルートを取得                              （現状維持）🔵
2. 既存 .claude/enso.json の上書き確認                   （現状維持）🔵
3. AskUserQuestion で設定を決める                        （現状維持）🔵
     ※ mergeMethod の確認項目を含む。ここは触らない
4. references/enso.json.template を雛形に生成            （現状維持）🔵
5. .gitignore に .claude/worktrees/ を追記               （現状維持）🔵
6. ★ 追跡下に置き、コミットして PR を作成する              （新規）  🔵
7. 再起動が必要なことを伝える                            （現状の 6）🔵
```

新規 Step 6 の手順（**`SKILL.md` 本文に直接書く。`references/` には切り出さない**）:

```
6-1. 作業環境の判定                                        🟡
       git リポジトリでない            → 書き換えのみで終了
       enso.json が無かった / enabled:false → ブランチを切るだけ
       既に enabled:true かつ worktree:true → EnterWorktree で worktree に入る
       既に enabled:true かつ worktree:false → ブランチを切るだけ

6-2. ブランチ名                                            🟡
       chore/enso-policy-init
       既存なら -2, -3 と連番を付けて衝突を避ける

6-3. 追跡下に置いてコミット                                🔵
       add の対象は .claude/enso.json と .gitignore だけ
       .claude/ をディレクトリごと add しない

6-4. push + PR 作成                                        🔵
       base は Step 3 で決めた baseBranch、無ければ main
       PR 本文に設定内容と、反映には merge 後の再起動が要ることを書く

6-5. 到達点をユーザーに提示                                🔵
```

> 信号機:
> - 🟡 6-1 の判定 — `worktreeViolation` の条件から導いた設計。レビュー要
> - 🟡 6-2 のブランチ名 — 命名規約はこのリポジトリに前例が無い
> - 🔵 6-3〜6-5 — `dev-plan` Phase 5 と同じ流れ

### 段階的縮退

**どの場合も中断しない。** 到達できたところで止めて残りを案内する。

| 不足 | 到達点 |
|---|---|
| git リポジトリでない | ファイル書き換えのみ |
| リモートが無い / `gh` 未認証 | コミットまで。PR は作らず手順を案内 |
| すべて揃っている | PR 作成まで |

### 初回実行では worktree は要らない

`init` の初回実行時は設定ファイルがまだ無く、hooks はセッション開始時に読み込まれるため**強制モードは効いていない**。よって worktree は過剰で、ブランチを切るだけでよい。worktree が要るのは、既に `enabled: true` のプロジェクトで `init` をやり直す場合だけ。

## Test Strategy

- [ ] `### init:` セクションに、追跡下に置いてコミットし PR を作成する手順が存在する
- [ ] その手順が `.gitignore` 追記（現 Step 5）より後、再起動案内（現 Step 6）より前に置かれている
- [ ] 4つの作業環境パターン（git 外 / 設定無しまたは `enabled:false` / `enabled:true`+`worktree:true` / `enabled:true`+`worktree:false`）の分岐が表または箇条書きで明示されている
- [ ] `enabled:true` かつ `worktree:true` のケースで `EnterWorktree` を使うと書かれており、その理由（`worktreeViolation` が `inWorktree` を要求する）が添えられている
- [ ] 段階的縮退の3段（書き換えのみ / コミットまで / PR 作成まで）が定義され、**いずれの場合も中断しない**と明記されている
- [ ] リモート無し・`gh` 未認証のときに PR を飛ばしてコミットで止まることが読み取れる
- [ ] `git add` の対象が `.claude/enso.json` と `.gitignore` に限定され、`.claude/` をディレクトリごと add しないと明記されている
- [ ] `.gitignore` の変更が設定ファイルと同じコミットに入ると読み取れる
- [ ] ブランチ名の衝突回避（連番付与）が定義されている
- [ ] PR の base が Step 3 で決めた `baseBranch` → 無ければ `main` の順で決まると書かれている
- [ ] 「マージされるまで設定は反映されない」「反映には Claude Code の再起動が必要」の2点が書かれている
- [ ] 追跡が必要な理由（worktree に複製されない / リポジトリ外 worktree で強制モードが無言で無効になる）が書かれている
- [ ] `dev-plan` を経由しないことと、その理由（`init` は強制モードをこれから有効にする場面なので循環する）が書かれている
- [ ] ルール・制約の1項目目（`.claude/enso.json` は git 管理下に置く）と矛盾する記述が残っておらず、`init` がそれを行うと対応づいている
- [ ] `SKILL.md` が 500 行以内に収まっている（現状 100 行程度。本タスクの追加は 40 行前後を見込む）
- [ ] `references/` に新規ファイルを作っていない

## Implementation Notes

- 参照すべき既存コード:
  - `skills/enso-policy/SKILL.md` の `### init:` セクションと ルール・制約
  - `hooks/lib/policy.mjs` の `worktreeViolation` — `git.inWorktree && !onProtected` が commit/push/PR の通過条件。**6-1 の判定の根拠**
  - `hooks/lib/policy.mjs` の `ALWAYS_ALLOWED` — `.claude/enso.json` の編集自体は保護ブランチ上でも通る。ブロックされるのは commit 以降だけ
  - `hooks/guard-bash.mjs` — `commit` / `push` / `gh ... create` が判定対象。PR #13 の改修後も**この3つの判定は健在**
  - `dev-plan` の Phase 5 — コミット → push → PR の既存の書き方。文体と粒度を揃える
- 実装のヒント:
  - 既存 Step 5 が `.gitignore` を扱う1文の形なので、同じ文体（日本語・目的を添える）で続ける
  - PR は Draft にしない。設定変更はレビュー後すぐマージできる性質のもので、`dev-plan` の Draft PR とは目的が違う 🟡
  - **手順を `references/` に切り出さない。** 呼び出し元が `init` だけなので、別ファイルにすると参照の往復が増えるだけで利点が無い
- 注意事項:
  - **hooks は変更しない。** ガードを迂回するのではなく、ガードが通る場所で作業する設計にする
  - enso 以外のプロジェクトでも動く必要がある。enso 固有のパス（`scripts/`, `docs/dev/plans/`）に依存しない
  - `.claude/worktrees/` は `.gitignore` 済みのため、worktree を作っても追跡対象に混ざらない
  - `enable` / `disable` / 設定値の変更は**本タスクの対象外**。従来どおりファイルを書き換えるだけで、PR は作らない
  - Biome は `.md` を対象にしないため、この変更で `pnpm check` の結果は変わらない

## Files

- 変更: `skills/enso-policy/SKILL.md`
- 新規: なし
- テスト: なし（テストランナー未導入）
