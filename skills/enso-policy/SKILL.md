---
name: enso-policy
description: This skill should be used when the user asks to "enso-policy", "enso を強制", "強制モード", "ensoの強制設定", "worktree を強制", "PR を強制", "enforce enso", "enforcement mode", "enso.json を作成", "強制モードを無効化". プロジェクトごとに enso の強制モード（worktree/PR ガード、dev-* フローの経由強制、セキュリティチェック強制）を .claude/enso.json で設定する。
argument-hint: '[init|show|enable|disable]'
---

# Enso Policy

プロジェクトごとに enso の強制モードを設定する。設定は `<project>/.claude/enso.json` に保存され、enso プラグインの hooks がこれを読んで動作する。

## 前提知識

### 強制モードの仕組み

enso は user スコープ（`~/.claude/skills/enso`）に置かれ、全プロジェクトから使える。しかし**スキルはモデルが自律的に選ぶもの**なので、スキル定義だけでは「必ず経由させる」ことはできない。そこでハーネス側で確実に効く hooks を使う。

```
ユーザーの発話
  └─ UserPromptSubmit: policy-context.mjs
       → 強制対象スキル・現在のブランチ・loop-state の状況を毎ターン注入

ファイル変更（Edit / Write / NotebookEdit）
  └─ PreToolUse: guard-edit.mjs
       → worktree の外 / 保護ブランチ上なら deny

Bash（git commit / push / gh pr create / gh pr ready / worktree 削除）
  └─ PreToolUse: guard-bash.mjs
       → 同じ判定 + セキュリティチェック未実施の ready をブロック
```

**`.claude/enso.json` が無い、または `enforce.enabled` が `true` でないプロジェクトでは、すべての hook が無出力で終了する。** 設定していないプロジェクトの挙動は一切変わらない。

### 設定スキーマ

| キー | 既定値 | 意味 |
|---|---|---|
| `enabled` | `false` | 強制モード全体の ON/OFF。`true` でなければ全 hook が no-op |
| `mode` | `"deny"` | 違反時の挙動。`deny`（ブロック） / `ask`（確認を出す） / `warn`（通すが警告） |
| `worktree` | `true` | コード変更・コミット・push・PR 作成を worktree 内の非保護ブランチに限定する |
| `flow` | `true` | dev-plan → 承認 → dev-loop → dev-cleanup を経由させる指示を毎ターン注入する |
| `security` | `true` | `gh pr ready` の前に ipa-security-check のレポートを要求する |
| `skills` | `["dev-plan", "dev-loop", "ipa-security-check"]` | 経由を強制するスキル。注入文に列挙される |
| `baseBranch` | `"main"` | `gh pr create --base` に使うブランチ。dev-plan と `scripts/sync-after-merge.sh` が参照する |
| `mergeMethod` | `"merge"` | `gh pr merge` に渡す方式。`merge` / `squash` / `rebase`。dev-cleanup が参照する（hook は参照しない） |
| `protectedBranches` | `["main", "master", "develop"]` | ここに載るブランチ上での変更を拒否する。マージ後の後始末スクリプト（enso の `scripts/sync-after-merge.sh`）はここに載るブランチを削除対象から除外する |
| `exclude` | `["docs/**", "*.md", ".claude/**", ".gitignore"]` | ガード対象外のパス glob |

`.claude/enso.json` 自身と `docs/dev/**` は `exclude` の設定に関わらず**常に許可**される（設定変更と計画作成を自分でブロックしないため）。

### 反映のタイミング

**hooks はセッション開始時に読み込まれる。** 設定を作成・変更したあとは Claude Code の再起動が必要で、これを案内しないとユーザーは「設定したのに効かない」と誤解する。

## ワークフロー

### init: 強制モードを有効にする

1. `git rev-parse --show-toplevel` でプロジェクトルートを取得する。git リポジトリでない場合は「worktree ガードは git リポジトリでのみ機能する」と伝えて確認を取る
2. 既に `.claude/enso.json` がある場合は内容を提示し、上書きしてよいか確認する
3. AskUserQuestion で設定を決める（既定値をそのまま使うなら1問で済ませてよい）
   - 違反時の挙動（`mode`）: deny / ask / warn
   - 強制する対象: worktree・PR ガード / dev-* フローの経由 / セキュリティチェック
   - 保護ブランチ（既定 `main, master, develop` でよいか）
   - ベースブランチ（`gh pr create --base` に使う。既定 `main`）
   - マージ方式（`mergeMethod`。dev-cleanup が `gh pr merge` に渡す）: merge / squash / rebase。既定 `merge`
4. `references/enso.json.template` を雛形に `.claude/enso.json` を生成する
5. `.gitignore` に `.claude/worktrees/` が無ければ追記する（worktree が未追跡ファイルとして見えて `git status` が汚れるため）
6. **設定ファイルを git 追跡下に置き、PR を作る**（下記「init が作る PR」に従う）
7. **再起動が必要なことを伝える**。あわせて、有効化後に何がブロックされるかを具体的に提示する

#### init が作る PR

未追跡のままだと `git worktree add` で複製されない。リポジトリの外に worktree を作った場合、`loadPolicy` の上方向探索が親の設定に届かず、**強制モードが無言で無効になる**。追跡しておけば worktree にチェックアウトされ、この偶然に依存しなくなる。

**6-1. 作業環境を判定する**

`enable` / `disable` や設定値の手編集はこの手順を通さない。PR を作るのは `init` だけである。

| 現在の状態 | 作業環境 | 理由 |
|---|---|---|
| git リポジトリでない | 何もしない（ファイル生成のみで終了） | ブランチも PR も作れない |
| `.claude/enso.json` が無かった / `enabled: false` | **ブランチを切るだけ** | ガードがまだ効いていないので worktree は過剰 |
| 既に `enabled: true` かつ `worktree: true` | **`EnterWorktree` で worktree に入る** | 保護ブランチ上・worktree 外のコミットは deny される |
| 既に `enabled: true` かつ `worktree: false` | ブランチを切るだけ | worktree ガードが無効 |

hooks はセッション開始時に読み込まれるため、**初回の `init` では強制モードはまだ効いていない**。worktree が要るのは、既に有効なプロジェクトで `init` をやり直す場合だけ。

**6-2. ブランチを用意する**

`chore/enso-policy-init` を使う。同名が既にあれば `-2`, `-3` と連番を付けて衝突を避ける。

**6-3. 追跡下に置いてコミットする**

プロジェクトルートから1コマンドずつ実行する。

```bash
git add .claude/enso.json .gitignore
git commit -m "chore(enso-policy): 強制モードの設定を追加"
```

**add の対象はこの2つだけ。** `.claude/` をディレクトリごと add しない（`settings.local.json` など個人設定を巻き込む）。

**6-4. push して PR を作る**

base は Step 3 で決めた `baseBranch`、無ければ `main`。Draft にはしない（設定変更はレビュー後すぐマージできる性質のもので、`dev-plan` の Draft PR とは目的が違う）。PR 本文には設定内容と、**マージして Claude Code を再起動するまで反映されない**ことを書く。

**6-5. 到達点を伝える**

**どの段階で止まっても中断しない。** 到達できたところまでを伝え、残りの手順を案内する。

| 不足しているもの | 到達点 |
|---|---|
| git リポジトリでない | ファイル生成のみ |
| リモートが無い / `gh` 未認証 | コミットまで（PR は作らず手順を案内） |
| すべて揃っている | PR 作成まで |

**`dev-plan` は経由しない。** 設定変更に計画とタスク分解は要らず、`init` は強制モードをこれから有効にする場面なので、経由を要求すると循環する。

### show: 現在の設定を確認する

1. `.claude/enso.json` を読む。無ければ「このプロジェクトでは強制モードは無効です」と伝えて `init` を案内する
2. 設定値の表と、それが実際に何をブロックするかを対応づけて提示する
3. 現在のブランチと worktree の内外、`docs/dev/plans/*/loop-state.yaml` の status を併せて示し、いま何ができる状態かを明らかにする

### enable / disable: 一時的に切り替える

1. `.claude/enso.json` の `enforce.enabled` だけを書き換える（他のキーは保持する）
2. ファイルが無い状態で `enable` を求められた場合は `init` に誘導する
3. 再起動が必要なことを伝える

## エスカレーション条件

次の場合は自動で進めず、ユーザーに確認する。

- git リポジトリでないディレクトリで `init` を求められた（worktree ガードが機能しない）
- 既存の `.claude/enso.json` に、このスキルが知らないキーが含まれている（手で編集された可能性があるため、上書きせず差分を提示する）
- `mode: "deny"` を有効にしようとしていて、かつ現在のブランチが保護ブランチである（再起動後、そのままでは編集できなくなることを先に伝える）

## ルール・制約

- **`.claude/enso.json` は git 管理下に置く。** worktree にも複製され、チームで共有できる。**これは `init` の Step 6 が自動で行う**（未追跡だと worktree に複製されず、リポジトリ外の worktree で強制モードが無言で無効になるため）
- **PR を作るのは `init` だけ。** `enable` / `disable` は従来どおり `.claude/enso.json` を書き換えるだけで、コミットも PR もしない。追跡下のファイルを書き換えるので作業ツリーに差分が出る点に注意する
- `enabled: false` とファイル削除は等価だが、**設定を残したまま無効化できる `disable` を優先する**（再度有効にするときに設定を作り直さずに済む）
- Bash コマンドはプロジェクトルートの **絶対パス** を使う。worktree セッション中はコマンド置換（`$(...)`）で組み立てず、確定済みの絶対パスを直接書く
- すべてのファイルは 500 行以内

## 追加リソース

- `references/enso.json.template`: 設定ファイルの雛形（全キーを既定値で列挙）
- hooks の実体: `hooks/hooks.json`、`hooks/policy-context.mjs`、`hooks/guard-edit.mjs`、`hooks/guard-bash.mjs`、`hooks/lib/policy.mjs`
