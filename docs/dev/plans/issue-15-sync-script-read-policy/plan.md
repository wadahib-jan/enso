# Plan: issue-15-sync-script-read-policy

対象 Issue: [#15](https://github.com/yukimnb/enso/issues/15) — `sync-after-merge.sh` の保護ブランチ除外が `enso.json` の `protectedBranches` を読んでいない

## Requirements Summary

`scripts/sync-after-merge.sh` は削除対象から除外するブランチを `PROTECTED_BRANCHES=("main" "master" "develop")` としてハードコードし、ベースブランチも `BASE_BRANCH="main"` に固定している。一方 `.claude/enso.json` には `enforce.protectedBranches` / `enforce.baseBranch` があり、hooks（`hooks/lib/policy.mjs`）はそちらを読む。**同じ概念が2箇所で管理されている**。

現状の既定値は一致しているため実害はないが、設定に `release` / `staging` を足す、`develop` を外す、`baseBranch` を変える、のいずれかで乖離する。`sync-after-merge.sh` は PR #13 以降**リモートブランチも削除する**ため、乖離時の影響が大きい。

ゴール: `sync-after-merge.sh` が `.claude/enso.json` の `enforce.baseBranch` / `enforce.protectedBranches` を読み、設定が無い・壊れている・Node が使えない場合は現在の固定値にフォールバックすること。設定の解釈は `hooks/lib/policy.mjs` に一本化し、二重管理そのものを解消する。

**スコープ外**（Issue に書かれていない改善は含めない）:

- `install-local.sh` など他スクリプトの設定対応
- `enso.json` のスキーマ追加・バリデーション強化
- hooks 側の挙動変更（`loadPolicy` の呼び出し結果は現状と完全に同じであること）

## Design Overview

Issue の案 A（Node でパースする）を採用する。`jq` を増やさず、`hooks/lib/policy.mjs` の既存の設定探索・`DEFAULT_ENFORCE` マージをそのまま再利用できる。

### 課題: `loadPolicy` はそのままでは流用できない

`loadPolicy()` は `enforce.enabled !== true` のとき `null` を返す。しかし `sync-after-merge.sh` は**強制モードが無効なプロジェクトでも動くべき**スクリプトであり、`enabled` に関係なく `baseBranch` / `protectedBranches` の値が欲しい。

そこで「設定を探して既定値とマージする」層を `resolveEnforce()` として切り出し、`loadPolicy()` はその上に `enabled` チェックを乗せるだけの薄い関数にする。**設定の解釈は引き続き1箇所**に留まる。

```
resolveEnforce(cwd)  ← 新設。常に完全な enforce オブジェクトを返す（探索失敗時は DEFAULT_ENFORCE）
        ├── loadPolicy(cwd)          ← 既存。enabled !== true なら null（hooks 用・挙動不変）
        └── sync-after-merge.sh      ← 新規の利用者。enabled を見ない
```

### データフロー

```
scripts/sync-after-merge.sh
  │  MAIN=<本体チェックアウトの絶対パス>   ← 既存ロジック（worktree から実行されても本体を指す）
  ▼
node --input-type=module -e '<10行程度>' "$REPO/hooks/lib/policy.mjs" "$MAIN"
  │    ├─ 引数はすべて argv 経由（スクリプト本文に文字列を埋め込まない）
  │    └─ resolveEnforce("$MAIN") → { enforce, configPath, ... }
  ▼
stdout（行指向・TAB 区切り。bash 側で JSON を解釈しない）
    base-branch<TAB>main
    protected<TAB>main
    protected<TAB>master
    protected<TAB>develop
  ▼
BASE_BRANCH / PROTECTED_BRANCHES を上書き。1行も得られなければ固定値のまま
```

- 読み取り対象は**本体チェックアウト（`$MAIN`）の `.claude/enso.json`**。モジュールは実行中のスクリプトと同じリポジトリ（`$REPO`）のものを読む
- `BASE_BRANCH` の確定を `MAIN` 決定後（現在の 45 行目以降）に移動する。現状は 28 行目で先に代入しているため、そのままでは設定を読む前に使われる
- ブランチ名に改行は含められないので行指向で十分。JSON を bash に持ち込まない

### フォールバック（すべて非致命）

| 状況 | 挙動 |
|---|---|
| `.claude/enso.json` が無い | `DEFAULT_ENFORCE` の値（＝現在の固定値と同じ） |
| JSON が壊れている | `policy.mjs` が stderr に警告、既定値で継続 |
| `node` が無い / `policy.mjs` が無い / 実行が失敗 | 警告を1行出して固定値で継続。**スクリプトは止めない** |
| `protectedBranches: []` | 設定どおり空。ただし `BASE_BRANCH` 自身は既存ループが常に `continue` するので保護される |

`set -euo pipefail` 下でコマンド置換の失敗がスクリプト全体を落とさないよう、取得は `|| true` を挟んで行う。

### 信号機

- 🔵 `resolveEnforce` の切り出しと `loadPolicy` の再実装（既存の探索・マージ処理をそのまま移す）
- 🔵 `node --input-type=module -e` + `pathToFileURL` での動的 import（`hooks/*.mjs` と同じ ESM 前提）
- 🟡 stdout の行フォーマット（TAB 区切り）— 既存の前例が無いため設計判断。ブランチ名に TAB / 改行は入らないので安全側
- 🟡 `$MAIN` を設定の探索起点にする（worktree から実行しても本体の設定を読むため）

## Task Dependency Graph

```
001 (policy.mjs: resolveEnforce を切り出す)
  └── 002 (sync-after-merge.sh: 設定を読む)
        └── 003 (ドキュメント整合)
```

| ID | タイトル | 複雑度 | 依存 |
|---|---|---|---|
| 001 | policy.mjs に resolveEnforce を切り出す | low | — |
| 002 | sync-after-merge.sh が enso.json を読むようにする | medium | 001 |
| 003 | 二重管理を前提とした記述を更新する | low | 002 |

## Cross-Plan Dependencies

- #12（`.claude/enso.json` を追跡下に置く）は PR #14 で解決済み。設定ファイルがリポジトリに存在することを前提にできる
- `skills/dev-cleanup` は `scripts/sync-after-merge.sh` があれば後始末を委譲する。スクリプトの引数・出力形式は変えないため、dev-cleanup 側の変更は不要
