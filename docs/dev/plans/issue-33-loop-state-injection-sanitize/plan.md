# Plan: issue-33-loop-state-injection-sanitize

## Requirements Summary

Issue [#33](https://github.com/yukimnb/enso/issues/33) を解消する。

`hooks/policy-context.mjs` は `loop-state.yaml` から読んだ `plan_name` / `status` / `pr_url` を、検証せずに `<enso-enforcement>` ブロックへ埋め込んでいる（medium / CWE-74）。`loop-state.yaml` は git 追跡下にあるため、クローンしたリポジトリや受け取った PR から `</enso-enforcement>` と指示文を持ち込める。

**ゴール**: hook が注入する文脈に、git 追跡下のファイル由来の任意文字列が混入しないようにする。

**スコープ外**:

- Issue の「併せて検出された low 3件」（CWE-20 / CWE-400 / CWE-754）。承認者の判断で本 Plan から外した（2026-09-13）。必要になれば別 Issue で扱う
- `enforce.skills` の要素（`.claude/enso.json` 由来）が同じブロックへ無検証で入る経路（`policy-context.mjs:32-37`）。Issue に書かれていないため扱わない
- `pr_url` がカレントリポジトリを指すかの検証（毎プロンプトで `git remote` を呼ぶ必要があり、Issue の要求を超える）

## Design Overview

### Issue の記述の検証結果（Phase 2）

| Issue の記述 | 検証結果 |
|---|---|
| `describeState()` :55 / `nextActions()` :103-106 が無検証で埋め込む | 🔵 正しい。`</enso-enforcement>` が素通しになることを node で確認済み |
| 「改行＋指示文」を仕込める | 🟡 一部不正確。フィールド抽出の正規表現 `^field:\s*(.+?)\s*$`（`m` フラグ）は LF/CR/U+2028/U+2029 を捕捉しないため改行は入らない。ただし閉じタグ＋同一行の指示文は入る |
| `findLoopStates()` は guard-bash / guard-edit も使う | 🟡 一部不正確。guard-edit は使っていない。guard-bash は使っており、**`guard-bash.mjs:298` の `permissionDecisionReason` にも `plan_name` が入る**（Issue 未記載のもう1つのシンク）。`findLoopStates` で正規化すれば両方に効く |
| 推奨対応「不適合なら `plan_dir` にフォールバック」 | 🔴 それだけでは不十分。`plan_dir` は `readdirSync` のディレクトリ名で、これも git 追跡下の内容が決める（Linux では `<` `>` を含められる） |
| 推奨対応「`pr_url` は `https://github.com/` で始まるもののみ」 | 🔴 前方一致では不十分。`https://github.com/x</enso-enforcement>…` が通る。完全一致の正規表現にする |

### 正規化の置き場所

**`hooks/lib/policy.mjs` の `findLoopStates()` に一本化する**（🔵 Issue の推奨どおり）。戻り値の形は変えず、不適合なフィールドは**プロパティごと付けない**。これにより既存の `?? plan_dir` / `?? "unknown"` / `state.pr_url ? … : ""` がそのまま機能し、利用側（`policy-context.mjs` / `guard-bash.mjs`）の変更は不要になる。

```js
// hooks/lib/policy.mjs（モジュールスコープ）
const SAFE_TOKEN = /^[\w.-]{1,64}$/;                                              // 🔵 既存17計画すべてが一致
const PR_URL = /^https:\/\/github\.com\/[\w.-]{1,100}\/[\w.-]{1,100}\/pull\/\d{1,10}$/; // 🟡 完全一致＝<>・改行なし・長さ上限を内包
```

完全一致の正規表現が「`<` `>` と改行の除去・長さの切り詰め」を包含するため、別途サニタイズ関数は設けない。

### 🔴 未確定事項（推奨案を採用して計画化。レビュー時の論点）

| # | 論点 | 採用した案 |
|---|---|---|
| Q1 | `SAFE_TOKEN` に一致しないディレクトリ名の計画 | **一覧に残し、`plan_name` が無効なら表示名を固定値 `invalid-plan-name` で埋める**（2026-09-13 実装中に変更）。当初案の「計画ごと skip」は、ipa-security-check で「マージゲートが『計画なし』扱いになり deny → ask に弱まる」と判明したため、承認者の判断で撤回した。`plan_dir` は表示に使われなくなるので、パスの組み立て用に実名のまま返す |
| Q2 | `status` を列挙値に限定するか | **限定しない**（Issue の汎用正規表現どおり） |
| Q3 | `pr_url` がカレントリポジトリを指すか検証するか | **検証しない** |

### 挙動の変化（PR に明記する）

- 書式に合わない `loop-state.yaml` の値は表示されなくなる（`status=unknown` / `plan_dir` 表示 / PR URL 省略）
- ディレクトリ名が書式に合わない計画は `invalid-plan-name` と表示される。ガードの判定（`gh pr merge` の承認確認・`gh pr ready` のレポート確認）は PR 前と同じくその計画を対象にする

## Task Dependency Graph

```
001（loop-state フィールドの書式検証）
```

タスクは1件のみ。

## Cross-Plan Dependencies

なし。`policy-context-shipped-nudge`（PR #32, shipped）のセキュリティレポートが本 Issue の検出元だが、共有インターフェースは持たない。
