# Plan: issue-24-approval-gate-record

対象 Issue: [#24](https://github.com/yukimnb/enso/issues/24) — dev-loop / dev-cleanup: 承認ゲートの AskUserQuestion を記述だけで強制できず、飛ばしても検出できない（#18 の再発）

## Requirements Summary

承認ゲート（`dev-cleanup` Step 3 のマージ確認）は現在スキル定義の記述だけで拘束されており、モデルが飛ばしても誰も検出できない。#18 の案 A（記述の強化）では再発を防げないことが実証された。

**「AskUserQuestion を呼ばなかったこと」は PreToolUse で捕まえられない**（ツール呼び出しではないため）。そこで検出対象を**ゲートの先にある不可逆操作（`gh pr merge`）**へずらし、承認の事実を `loop-state.yaml` に記録させ、**記録が無ければ `gh pr merge` を deny する**。

やること:

1. `dev-cleanup` Step 3 で「はい」が選ばれたら `loop-state.yaml` に `merge_approved_at: <ISO8601>` を書く
2. PreToolUse の Bash ガードが `gh pr merge` を検査し、対象 PR の `loop-state.yaml` に有効な `merge_approved_at` が無ければ deny する
3. deny メッセージで `dev-cleanup` Step 3 のゲートへ誘導する
4. 補助案として、承認記録の**鮮度検査**（既定 24 時間）と、`dev-plan` Phase 5e の `impl_approved_at`（監査用の記録のみ）を併せて入れる

やらないこと（Issue のスコープ外）:

- `impl_approved_at` を根拠にした新しい deny の追加（Issue は記録＝監査性までしか求めていない）
- 承認ゲートそのものの文言・選択肢の変更（#18 で対応済み）

## Design Overview

### 中心となる考え方

承認記録は**承認時に書くもの**であり、計画作成時に書くものではない。したがって「既存の（フィールドを持たない）計画ファイル」の互換性問題は原理的に発生しない — 過去の `shipped` 計画も、今日 `dev-cleanup` Step 3 を通せばその場で `merge_approved_at` が書かれる。Issue が「要検討」としていた点は、**フィールドの書き込みタイミングを承認時に置くことで解消する**。

代わりに互換性の論点は「`gh pr merge` の対象 PR に対応する `loop-state.yaml` がそもそも見つからない場合」に移る。enso の計画と無関係な PR を手でマージする正当なケースがあるため、ここは **deny ではなく `ask`** に落とす。

| 状況 | 判定 |
|---|---|
| 対象 PR の `loop-state.yaml` が見つかり、有効な `merge_approved_at` がある | 通す |
| 見つかったが `merge_approved_at` が無い | **deny**（ゲート未通過） |
| 見つかったが `merge_approved_at` が古い（既定 24h 超）/ 解釈不能 | **deny**（承認の使い回し防止） |
| 対象 PR に対応する `loop-state.yaml` が無い | `ask`（enso 管理外の PR を締め出さない） |

### 判定の位置づけ

新ガードは `enforce.flow === true` を条件にする。`flow`（dev-* フローの経由強制）は現在 `policy-context.mjs` のコンテキスト注入にしか効いておらず、「承認フローを経由させる」という意味に最も近い。`worktree` / `security` とは独立に切れる。

### インターフェース設計

`hooks/lib/policy.mjs`（共有ロジック。hooks とスクリプトで解釈を一本化する既存方針を維持）

```js
// 既存 LOOP_STATE_FIELDS に承認フィールドを追加する 🔵
const LOOP_STATE_FIELDS = [
  "plan_name", "status", "branch", "worktree", "pr_number", "pr_url",
  "merge_approved_at",   // dev-cleanup Step 3 で「はい」が選ばれた時刻（ISO8601）
  "impl_approved_at",    // dev-plan Phase 5e で「はい」が選ばれた時刻（ISO8601）
];

/**
 * PR 番号 / ブランチ名から対応する loop-state を1件返す。見つからなければ null。 🟡
 * pr_number 一致を優先し、無ければ branch 一致で探す。
 */
export function findLoopStateForPr(projectRoot, { prNumber, branch }) // → state | null

/**
 * 承認記録の有効性を判定する。 🟡
 * @returns {"ok"|"missing"|"stale"|"invalid"}
 */
export function approvalStatus(isoString, { maxAgeHours = 24, now = Date.now() } = {})
```

`hooks/guard-bash.mjs`

```js
/** `gh pr merge [<number>|<url>|<branch>]` の対象を取り出す。 🟡 */
function mergeTarget(segment) // → { prNumber: string|null, branch: string|null } | null
```

### 承認記録の書き込み（`dev-cleanup`）

**記録は書いたうえで commit / push してからマージする。** 未コミットのまま残すと、Step 6 の後始末が「未コミットの変更が残る worktree は削除せず skip する」に該当して worktree が片付かなくなる。Step 3（承認）と Step 4（マージ）の間に記録の書き込み・コミット・push を挟む。この時点ではまだ worktree の中にいる（`ExitWorktree` は Step 5）ため、worktree ガードにも抵触しない。

### データフロー

```
dev-cleanup Step 3（AskUserQuestion）
   └─ 「はい」→ loop-state.yaml に merge_approved_at を書く → commit → push
        └─ Step 4: gh pr merge
             └─ PreToolUse(Bash) → guard-bash.mjs
                  ├─ enforce.flow !== true → 素通り
                  ├─ 対象 PR の loop-state を探す（policy.mjs）
                  ├─ merge_approved_at が有効 → 通す
                  ├─ 無い / 古い → deny（Step 3 へ誘導）
                  └─ loop-state 自体が無い → ask
```

## Task Dependency Graph

```
001 (policy.mjs: 承認記録の読み取り基盤)
 └─ 002 (guard-bash.mjs: gh pr merge ガード)
      └─ 005 (README / MANUAL の deny 一覧)
003 (dev-cleanup: 承認記録の書き込み)  ─┐
004 (dev-plan / dev-loop: 状態ファイル仕様) ─┴─ 005
```

- 001 → 002 は実装依存（002 が 001 のヘルパを使う）
- 003 は 002 の deny を通過できるようにする対（**002 だけ入れて 003 を入れないとマージが常に deny される**）
- 005 は 002・003・004 の確定後

## Cross-Plan Dependencies

なし。

## 未確定事項

- 🟡 鮮度の既定値を 24 時間とした（Issue の例示どおり）。設定可能にはせず定数で持つ。設定項目を増やすのは Issue の要求範囲を超えるため
- 🟡 新ガードを `enforce.flow` に紐づけた。Issue はどのフラグに載せるか指定していない
