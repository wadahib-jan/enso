# Plan: policy-context-shipped-nudge

## Requirements Summary

`hooks/policy-context.mjs` の `nextAction()` が `status: shipped` と `status: failed` を分岐せず、後始末や対応が必要な計画があっても汎用文にフォールバックする問題を直す。

### 背景

承認ゲートの強制力を検証した際、仕組み側の穴として見つかった。

`nextAction()` は `awaiting-approval` と `running` だけを分岐し、それ以外は汎用文（「実装・修正の依頼であれば、dev-plan →（ユーザーの承認）→ dev-loop の順で進めてください」）に落ちる。そのため **`shipped`（`dev-loop` が PR を ready にし、マージ待ちの状態）のとき `dev-cleanup` へ誘導する一文が出ない。**

実際に、`dev-loop` 完了後に `dev-cleanup` を起動せず地の文で確認して停止するという逸脱が起きた。注入内容には `shipped` の計画が一覧に載っていたが、「次にすべきこと」は汎用文だったため引き戻す力が働かなかった。

`MANUAL.md` が明記しているとおり、「確認を出さなかった」ことはツール呼び出しではないためフックでは検出できない。ゲートの提示そのものは強制できないが、**UserPromptSubmit での誘導は強化できる。** これは enso が既に採っている「不可逆操作（`gh pr merge`）を `guard-bash.mjs` で拘束する」多層防御の、手前の層を1枚足すことにあたる。

### 判別材料（設計の要）

**`status === "shipped"` だけでは判定できない。** マージ済みの過去計画も `loop-state.yaml` が `shipped` のまま `docs/dev/plans/` に残り続ける。このリポジトリには現在 **16 件すべてが `shipped`** で存在しており、素朴に促すと毎ターン 16 件を並べるノイズになる。

調査で確認した判別材料:

| 候補 | 使えるか | 根拠 |
|---|---|---|
| `merge_approved_at` の有無 | **使えない** | 16 件中 2 件しか持たない。マージゲート機能の導入前に作られた計画には無い |
| **worktree ディレクトリの実在** | **使える** | マージ済みの計画は `dev-cleanup` / `sync-after-merge.sh` が worktree を削除するため残らない。実測でも現存するのは作業中の1件のみ |

よって判定条件は `status が対象 && loop-state.yaml の worktree フィールドが指すディレクトリが実在する`。

### スコープ

- `shipped` の分岐を追加し、後始末が済んでいない計画があれば `dev-cleanup` を促す
- `failed` の分岐も追加する（同じ関数の同じ穴。誘導先は `dev-cleanup` ではなく「残存問題の確認」）
- 複数カテゴリが同時に存在しうるため、**該当するものをすべて提示する**（後述）

## Design Overview

### インターフェース

`hooks/lib/policy.mjs` に述語を1つ追加する。`existsSync` は同ファイルで import 済み、`worktree` は `LOOP_STATE_FIELDS` に含まれ読み取り済みのため、追加の依存は無い。

```js
/**
 * loop-state が指す worktree がまだ実在するか。
 *
 * 後始末（dev-cleanup / sync-after-merge.sh）が済むと worktree は削除されるため、
 * 「status は shipped だがまだ片付いていない」計画をこれで見分ける。
 * merge_approved_at は判別に使えない（マージゲート導入前の計画が持たないため）。
 *
 * @param {{worktree?: string}} state
 * @returns {boolean}
 */
export function hasLiveWorktree(state) // 🔵
```

- 値が無い / 空文字 / 文字列でない場合は `false` を返す（古い `loop-state.yaml` や壊れた値でも例外を投げない）🔵
- 相対パス解決は行わない。`dev-plan` Phase 5d が絶対パスを記録するため 🔵

`hooks/policy-context.mjs` の `nextAction()` を、単一の文字列を返す優先順位チェーンから **該当するものをすべて集めて返す** 形に変える。

```js
function nextAction(states, git, enforce) // 戻り値は string のまま（複数時は改行区切り）🟡
```

### 複数カテゴリを併記する理由

現状は最初に一致した1つだけを返すため、「A は shipped で未マージ、B は awaiting-approval」という状況で A の誘導が消える。**今回のバグ自体が「フォールバックで情報が隠れた」ことなので、隠れる経路を塞ぐ。**

| 件数 | 描画 |
|---|---|
| 1件 | `次にすべきこと: <文>`（現状と同じ） |
| 2件以上 | `次にすべきこと:` の次行から `- <文>` の箇条書き |

これにより既存の見え方を壊さずに、複数状態のときだけ情報量が増える。

### 提示の優先順位

| 順 | 状態 | 文面の趣旨 |
|---|---|---|
| 1 | `awaiting-approval` | ユーザーが承認を伝えたら `dev-loop`（既存・変更しない） |
| 2 | `running` | 中断の可能性。再開してよいか確認（既存・変更しない） |
| 3 | `failed` + worktree 実在 | 中断した計画がある。残存問題を確認する |
| 4 | `shipped` + worktree 実在 | **後始末が済んでいない。`dev-cleanup` を実行する** |

既存2つの順序は変えない。追加分は「サイクルの終端」なので後ろに置く。`failed` を `shipped` より前にするのは、問題を抱えた計画の方が放置の害が大きいため。🟡

### 変更しないもの

- `describeState()` の一覧表示（全 `loop-state.yaml` を status 付きで列挙する現状の挙動は有用なので維持）
- `guard-bash.mjs` / `guard-edit.mjs`（本件と無関係）
- `findLoopStates()` / `LOOP_STATE_FIELDS`（`worktree` は既に読まれている）

### 検証方法

テストフレームワークを持たないリポジトリのため、**hook を直接実行して注入内容を確認する**。動作確認済みの手順:

```bash
echo '{"cwd":"<projectRoot>"}' | node hooks/policy-context.mjs
```

JSON（`hookSpecificOutput.additionalContext`）が標準出力に出て exit 0 になる。状態ごとの検証にはスクラッチパッドに fixture（`docs/dev/plans/<name>/loop-state.yaml` と `.claude/enso.json` を持つ最小ディレクトリ）を作って `cwd` に渡す。

**このリポジトリ自体が実データの検証材料になる。** 16 件すべて `shipped` かつ worktree は作業中の1件だけなので、修正後もこの16件が促されないことを確認できる。

## Task Dependency Graph

```
001 (policy.mjs に hasLiveWorktree を追加)
        ↓
002 (nextAction に failed / shipped の分岐と複数併記を実装)
        ↓
003 (fixture と実データで4状態を検証)
        ↓
004 (ドキュメント整合の確認と品質ゲート)
```

直列。002 は 001 の述語に依存し、003 は 002 の実装を検証する。

## Cross-Plan Dependencies

なし。`hooks/` 配下の変更のみで、スキル定義には影響しない。
