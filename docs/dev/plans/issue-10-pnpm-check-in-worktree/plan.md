# Plan: issue-10-pnpm-check-in-worktree

## Requirements Summary

Issue [#10](https://github.com/yukimnb/enso/issues/10) を解消する。

worktree の中で `pnpm secretlint` / `pnpm check` が exit 1 で落ち、pre-commit フック（`pnpm secretlint && pnpm check`）も通らないため、`--no-verify` なしにコミットできない。副作用として未追跡の `pnpm-workspace.yaml` が毎回生成される。

Issue に書かれていない改善は含めない。

### 調査で判明した真因（Issue の記述との差分）🔵

本 worktree で実測して切り分けた結果、**Issue が挙げている原因（`prepare` / simple-git-hooks の失敗）は exit 1 の原因ではなかった**。

| 事象 | 実測結果 |
|---|---|
| `prepare`（`simple-git-hooks`）が worktree で `ENOTDIR` エラーを出す | **事実**。`.git` がファイル（gitdir ポインタ）なので `<worktree>/.git/hooks` を mkdir できない |
| その `prepare` の失敗が exit 1 の原因である | **誤り**。`./node_modules/.bin/simple-git-hooks` は当該エラーをログに出しても **exit 0** で終わる |
| 実際に exit 1 を起こしているもの | **`ERR_PNPM_IGNORED_BUILDS`**。pnpm 11 は未承認の build script（`simple-git-hooks@2.13.1` の postinstall）があると install を exit 1 で終了し、判断待ちの `pnpm-workspace.yaml`（`allowBuilds: simple-git-hooks: set this to true or false`）を生成する。`pnpm <script>` は実行前に auto-install（`runDepsStatusCheck`）を走らせるため、これが `secretlint` / `check` に到達する前に落ちる |

検証手順と結果:

1. `prepare` を no-op に差し替えても `pnpm check` は exit 1 のまま（残る失敗は `ERR_PNPM_IGNORED_BUILDS` のみ）
2. `pnpm-workspace.yaml` に `allowBuilds: simple-git-hooks: true` を置くと、`prepare` を元に戻しても `pnpm check` は **exit 0**（`biome check .` が実行され `Checked 12 files`）

もう1つの前提も確認した。**git の hooks は worktree ごとではなく共有される**（`git rev-parse --git-path hooks` → `/workspace/enso/.git/hooks`）。したがって worktree で hooks を再設置する必要はなく、`prepare` を worktree で skip しても pre-commit フックは効いたままになる。

## Design Overview

2つの独立した変更で構成する。**修正の主役は 001 であり、002 は Issue が対応案として挙げたノイズ除去である。**

### 001: `pnpm-workspace.yaml` を追跡下に置き `allowBuilds` を明示する 🔵

```yaml
# pnpm-workspace.yaml（新規・追跡下に置く）
allowBuilds:
  simple-git-hooks: true
```

- `ERR_PNPM_IGNORED_BUILDS` による exit 1 が解消する（実測確認済み）
- 未追跡ファイルが毎回生成される副作用も同時に消える（ファイル自体が追跡下に入り、内容が確定するため）
- `true` にする理由: `simple-git-hooks` の postinstall は hooks 設置が目的で、メインのチェックアウトでは実際に必要。worktree では `ENOTDIR` を吐くが exit 0 で終わるためインストールは失敗しない

### 002: `prepare` を worktree でガードする 🔵

`package.json` の `prepare` を、worktree 内では simple-git-hooks を呼ばない形にする。

```
prepare: node scripts/setup-git-hooks.mjs
```

```
scripts/setup-git-hooks.mjs（新規）
  git rev-parse --git-dir と --git-common-dir を比較する
    異なる → worktree なので skip（理由を1行出して exit 0）
    同じ   → simple-git-hooks を実行する
  git が無い / 判定に失敗した場合も exit 0（install を壊さない）
```

- 機能上は必須ではない（001 だけで exit 0 になる）。**目的は、今回の誤診の原因になった `[ERROR] ... ENOTDIR` というログを worktree で出さないこと**
- hooks は common dir 共有なので、worktree で skip しても pre-commit フックは有効なまま
- ガードは `.git` がファイルか否かではなく `--git-dir` / `--git-common-dir` の比較で行う（enso の hooks 実装と同じ「git に聞く」原則）
- なお `allowBuilds: true` により simple-git-hooks 自身の postinstall も走るため、この経路のログは残る。`prepare` 側のガードで消えるのは重複した1回分である 🟡

### 003: ドキュメントの是正 🔵

- `CLAUDE.md:118` の「**注意**: フックは `node_modules` を必要とします。クローン直後は `pnpm install && pnpm prepare` を実行してください。」を是正する。`node_modules` があっても worktree では `prepare` が hooks を設置できないこと、hooks は共有されるため worktree での設置が不要であることを追記する
- `docs/dev/context.md`（L18 / L122 の Git Hooks・`pnpm prepare` の記述）にも同じ前提を反映する

### 採用しなかった案

`core.hooksPath` を共有ディレクトリに向ける案（Issue の対応案の2つ目）は採らない。hooks は既に common dir で共有されており（実測済み）、`core.hooksPath` を導入しても解決する問題が無いうえ、simple-git-hooks の設置先とリポジトリ設定の二重管理になるため。

## Task Dependency Graph

```
001（allowBuilds の明示 / 真因の解消）
  └─ 002（prepare の worktree ガード / ノイズ除去）
        └─ 003（ドキュメント是正）
```

001 は単独で Issue の症状を解消する。002・003 は 001 を前提に、Issue が挙げた対応案とドキュメントのずれを片付ける。

## Cross-Plan Dependencies

なし。
