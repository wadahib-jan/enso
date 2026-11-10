# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

EnsoはAI駆動開発フレームワークです。`~/.claude/skills/enso` に配置して user スコープで使用し、要件定義から実装までのAI支援開発プロセスを提供します。マーケットプレイスでの配布は行いません。

利用者向けのインストール手順とスキル一覧は [README.md](./README.md)、各スキルの詳細は [MANUAL.md](./MANUAL.md) にあります。本ファイルは **Enso本体を開発する** ときの指示書です。

## プロジェクト構造

- **`skills/`**: スキル定義（`SKILL.md`）。enso はスキルのみで構成され、`commands/` は持ちません
- **`hooks/`**: 強制モードの hooks（`hooks.json` は plugin.json への宣言不要で自動検出される）
- **`.claude-plugin/plugin.json`**: ローダーが読むマニフェスト。**これが無いとスキルは一切読み込まれない**
- **`scripts/install-local.sh`**: `~/.claude/skills/enso` への同期スクリプト
- **`book/`**: 開発ガイドとドキュメント
- **`claude_docker/`**: sandbox実行のサンプル（プラグインとしては扱わない）

## 読み込みの仕組み

Claude Code がプラグインを探索するのは `.claude/skills/*` のみです。それ以外のディレクトリ名に置いても読み込まれません。Enso は user スコープの `~/.claude/skills/enso` に置くため、**全プロジェクトから利用でき、プロジェクト側の設定は不要**です。

1. `~/.claude/skills/*`（user スコープ）と `<project>/.claude/skills/*`（project スコープ）の各ディレクトリで `.claude-plugin/plugin.json` を探す
2. マニフェストの `skills` が指すディレクトリを登録する
3. `/enso:` プレフィックス付きでスキルを使用可能にする

`claude plugin list` で状態を確認できます。project スコープに置く場合のみ、初回はワークスペースの信頼が必要です。

**制約**: `skills/` は直下1階層のみで、**ネストしたディレクトリは読み込まれません**（`skills/<name>/references/` のようにスキル内部でファイルを分けるのは問題ありません）。

`hooks/hooks.json` はマニフェストに書かなくてもプラグインルートから自動検出され、スクリプトは `${CLAUDE_PLUGIN_ROOT}` で参照します。hooks は**セッション開始時に読み込まれる**ため、編集後は投入に加えて Claude Code の再起動が必要です。

## スキルの2層構造

スキルは「人が明示的に呼ぶもの（Entry）」と「他スキルから呼ばれるもの（Internal）」に分かれます。`skills/` は直下1階層しか読み込まれないためディレクトリでは分離できず、**`description` の書式が唯一の実効的なスイッチ**です。

| 層 | `description` の書式 | 挙動 |
|---|---|---|
| Entry | `This skill should be used when the user asks to "<name>", "<日本語トリガー>", ... . <説明>` | ユーザーの発話で自動発火する |
| Internal | `<呼び出し元> から呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。<説明>` | 自動発火せず、呼び出し元と `/enso:<name>` の明示指定でのみ動く |

Internal は8つです。呼び出し元は「そのスキルの手順内で内部実行されるもの」だけを書きます。**「修正は dev-debug へ引き継ぐ」のような案内は呼び出しに数えません。**

| スキル | 呼び出し元 |
|---|---|
| `dev-context` | `dev-plan` / `dev-impl` / `dev-run` / `dev-screen-spec` / `dev-webtest-plan` |
| `dev-impl` | `dev-run` |
| `dev-run` | `dev-loop` |
| `dev-verify` | `dev-run` / `dev-loop` |
| `dev-debug` | `dev-run` |
| `dev-webtest-plan` | `dev-webtest` |
| `ipa-security-check` | `dev-loop` |
| `task-breakdown` | `dev-plan`（インライン適用） |

これ以外はすべて Entry です。全スキルの一覧は [README.md](./README.md#スキル一覧) にあります。

`dev-run/references/*-prompt-template.md` は dev-impl / dev-debug / dev-verify の手順をサブエージェント向けに写したものです。片方を変えたらもう片方も更新します。

**新しいスキルを追加するとき**は、まずどちらの層かを決めてから `description` を書きます。他スキルのワークフローの一部としてしか意味をなさないなら Internal、ユーザーが「〜したい」と言ったときの入口になるなら Entry です。**迷ったら Internal にします。** トリガー語列を持つスキルが増えるほど、無関係な発話での誤発火が増えるためです。

機能の説明文（後半）は Internal でも省略しません。`/enso:<name>` で明示実行されたときの動作理解と、呼び出し元スキルが役割を把握するために必要です。

**Internal スキルは、前提が揃わないときにユーザーを突き返してはいけません。** 「`/dev-context` を実行してください」と案内して終了すると、Entry スキルを呼んだユーザーが一度弾かれることになります。前提は呼び出し元が内部実行して揃えます。

## 整頓の判断軸

enso を整頓するときの基準は `skills/enso-tidy/SKILL.md` の「判断軸」が正本です。要点は次の2つです。

- **整頓と無駄の排除を第一優先にする。** ただし、消す・まとめることで手順・分岐・判定が複雑になるなら行わず、見送った理由を残す。挙動を変えない。迷ったら残す
- **定期的に削除してよいのは、後で読む処理が無く、進行中の作業に使われず、失っても作り直せる（または git 履歴から戻せる）ファイルだけ。** 自動で消すのは enso-tidy の削除対象の表にパスと削除条件を明示したものに限る

**新しいスキルがファイルを出力するとき**は、実行のたびに増えるかを先に決めます。増えるなら、固定名で上書きできないかを検討し、できないなら enso-tidy の削除対象の表に「パス・削除条件・残すもの」を追加します。後で読む処理がある場合は、読まれる版（最新・open など）を残す条件にします。

## 強制モード（hooks）

`hooks/` は、プロジェクトごとに enso の経由を強制する仕組みです。`<project>/.claude/enso.json` に `enforce.enabled: true` がある場合のみ動作し、**設定が無いプロジェクトでは全 hook が無出力で exit 0 します**（＝挙動が一切変わらない）。

| ファイル | イベント | 役割 |
|---|---|---|
| `hooks/policy-context.mjs` | UserPromptSubmit | 強制対象スキル・ブランチ・`loop-state.yaml` の状況を注入 |
| `hooks/guard-edit.mjs` | PreToolUse (Edit/Write/NotebookEdit) | worktree 外・保護ブランチ上の変更を deny |
| `hooks/guard-bash.mjs` | PreToolUse (Bash) | commit/push/PR 作成の同判定 + セキュリティ未実施の `gh pr ready` を deny |
| `hooks/lib/policy.mjs` | - | 設定探索・git 状態・glob 判定・出力ヘルパ |

設定ファイルの作成・変更は `skills/enso-policy` が担当します。

hook を編集するときの原則:

- **`jq` に依存しない。** stdin の JSON は Node でパースします（Biome の lint 対象にもなります）
- **必ず exit 0 で終える。** `runHook()` が例外を握り潰します。hook のバグでセッションが止まるのが最悪のシナリオです
- **内容の基準は `git rev-parse --show-toplevel`**（`gitState().topLevel`）。設定ファイルの位置ではありません。worktree の中では両者がずれ、パス判定を誤ります

## 開発コマンド

```bash
pnpm install                # 依存関係のインストール
pnpm prepare                # pre-commitフック（simple-git-hooks）のセットアップ。worktree では skip される

pnpm secretlint             # 機密情報の検査
pnpm check                  # Biome: フォーマット・Lintの検査（書き込みなし）
pnpm check:fix              # Biome: 検出した問題を自動修正
pnpm format                 # Biome: フォーマットのみ適用
pnpm lint                   # Biome: Lintのみ実行
```

Biome の対象は JSON と JS/TS です。**Markdown は対象外**なので、スキル定義（`.md`）の整形には関与しません。

必要な環境: Node.js 24 / pnpm 11（CI の `.github/workflows/ci.yml` に準拠。pnpm のバージョンは `package.json` の `packageManager` が正）

## 開発ワークフロー

### ブランチ戦略

- `main`: 安定版
- 機能開発: `feature/機能名`
- バグ修正: `bugfix/バグ名`

### コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/) 形式を使用します。

- `feat:` 新機能 / `fix:` バグ修正 / `docs:` ドキュメント変更
- `refactor:` リファクタリング / `test:` テスト / `chore:` ツール・ビルド変更

### 変更を反映する流れ

```bash
pnpm secretlint && pnpm check   # 品質ゲートを通してから
./scripts/install-local.sh      # ~/.claude/skills/enso へ同期
```

Claude Code を再起動（または `/reload-plugins`）すると反映されます。

コピー方式なので、リポジトリを編集しただけでは反映されません。**投入は全プロジェクトに即座に効く**ため、壊れた状態を入れないよう投入前に品質ゲートを通してください。差分だけ見たい場合は `--dry-run` を使います。

### PR をマージしたあと

マージ後の後始末は1コマンドにまとめてあります。

```bash
./scripts/sync-after-merge.sh            # main を最新にして投入まで
./scripts/sync-after-merge.sh --dry-run  # 何が起きるかだけ表示
```

`main` の更新（ff-only pull）→ マージ済みブランチと worktree の削除 → 品質ゲート → `install-local.sh` を順に行います（リモートに残ったマージ済みブランチも削除します）。**未マージのブランチには触りません。** 未コミットの変更（**未追跡ファイルを含む**）が残る worktree は削除せず、警告して skip します。

マージ判定の基準と各処理の理由（`--force`・削除失敗時の回収・リモート削除）は `scripts/sync-after-merge.sh` のコメントにあります。

ベースブランチと保護ブランチ（削除対象から除外するブランチ）は `.claude/enso.json` の `enforce.baseBranch` / `enforce.protectedBranches` から読みます。設定の解釈は `hooks/lib/policy.mjs` の `resolveEnforce()` に一本化してあるので、**hooks とスクリプトで値がずれることはありません**。設定が無い・壊れている・Node が使えない場合は既定値（`main` / main・master・develop）にフォールバックし、警告を出して処理は続けます。

`rsync` が必要です（`install-local.sh` が使う）。コンテナ内で動かす場合は、イメージに rsync が入っているか確認してください。

## 品質管理

Pre-commitフックで `pnpm secretlint && pnpm check`（機密情報検査と Biome）が自動実行されます。同じ2つを CI（`.github/workflows/ci.yml`）でも実行しています。

スキル定義（`.md`）を修正する際は、機密情報が含まれていないことを確認してからコミットしてください。JSON を編集して整形エラーになった場合は `pnpm check:fix` で修正できます。

**注意**: フックは `node_modules` を必要とします。クローン直後は `pnpm install && pnpm prepare` を実行してください。

**worktree での挙動**: `pnpm prepare` は worktree の中では**何もせずに終了します**（`scripts/setup-git-hooks.mjs` が `--git-dir` と `--git-common-dir` の比較で検出して skip する）。worktree の `.git` はディレクトリではなく gitdir へのポインタファイルなので、simple-git-hooks が `<worktree>/.git/hooks` を作れず `ENOTDIR` になるためです。**`node_modules` があっても設置はできません。**

skip して構わないのは、git の hooks が worktree ごとではなく common dir で共有されるからです（`git rev-parse --git-path hooks` は worktree の中でもメインの `.git/hooks` を指す）。**メインのチェックアウトで一度 `pnpm prepare` を通してあれば、worktree でも pre-commit フックは効きます。**

**注意**: `pnpm-workspace.yaml` の `allowBuilds` を消さないでください。pnpm 11 は未承認の build script（`simple-git-hooks` の postinstall）があると install を exit 1 で終わらせます。`pnpm <script>` は実行前に auto-install を走らせるため、これが無いと `pnpm secretlint` / `pnpm check` が検査に到達する前に落ちます（Issue #10）。

マニフェストを変更したときは `claude plugin validate .` で検証できます。
