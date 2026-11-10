# Verify Report: issue-12-track-enso-json

実行日: 2026-09-06 / 対象タスク: 001–005 / 対象 Issue: [#12](https://github.com/yukimnb/enso/issues/12)

## ゲート結果

| 項目 | コマンド | 結果 |
|---|---|---|
| 機密情報検査 | `secretlint` | ✅ exit 0（検出なし） |
| フォーマット・Lint | `biome check .` | ✅ 12 files checked / No fixes applied |
| シェル構文 | `bash -n scripts/sync-after-merge.sh` | ✅ 構文エラーなし |
| 500 行ルール | `wc -l skills/enso-policy/SKILL.md` | ✅ 149 行（上限 500） |
| テスト | — | N/A（このリポジトリに単体テストは存在しない） |
| カバレッジ | — | N/A |
| ビルド | — | N/A（ビルド工程を持たない） |

`pnpm secretlint` / `pnpm check` はラッパー経由だと worktree で失敗する（Issue #10: `simple-git-hooks` が `.git/hooks` を作れない）ため、`node_modules/.bin` のバイナリを直接実行した。**検査内容は同一。**

## Issue #12 の受入確認

| 確認項目 | 結果 |
|---|---|
| 再現手順の解消 | ✅ `git status --short --untracked-files=all -- .claude` が `?? .claude/enso.json` を出力しない（`A .claude/enso.json` = 追跡下） |
| ignore されていないこと | ✅ `git check-ignore -v .claude/enso.json` が無出力 |
| `.gitignore` の既存2行 | ✅ `.claude/settings.local.json` / `.claude/worktrees/` とも保持 |
| 個人設定の巻き込み | ✅ 追跡下に入ったのは `.claude/enso.json` のみ |

## タスク別の確認

### 001 — `init` が追跡下に置き PR を作る

- ✅ `### init:` に Step 6 を追加（`.gitignore` 追記の後、再起動案内の前）
- ✅ 作業環境の判定4パターンを表で明示。`enabled:true` + `worktree:true` で `EnterWorktree` を使う理由を記載
- ✅ 段階的縮退の3段を定義し、**どの段階でも中断しない**と明記
- ✅ `git add` の対象を `.claude/enso.json` と `.gitignore` に限定、`.claude/` ごとの add を禁止と明記
- ✅ ブランチ名 `chore/enso-policy-init` と連番による衝突回避
- ✅ base は `baseBranch` → 無ければ `main`
- ✅ 「マージして再起動するまで反映されない」を記載
- ✅ `dev-plan` を経由しない理由（循環する）を記載
- ✅ ルール・制約を「`init` が自動で行う」に対応づけ、食い違いを解消
- ✅ `references/` に新規ファイルを作っていない

### 002 — enso 本体の設定を追跡下に

- ✅ `.claude/enso.json` を追跡下に追加
- ✅ 既存9キーの値は現行のまま
- 🟡 `mergeMethod: "merge"` を追加（雛形とキー順を揃えた。`DEFAULT_ENFORCE` の既定値と同値のため**挙動は変わらない**）

### 003 — `sync-after-merge.sh` の判定

- ✅ 本体判定（51行目付近）を `--untracked-files=no` に変更。判定と表示の**両方**に適用
- ✅ worktree 判定（123行目）は**未変更**。`worktree remove` が未追跡ファイルごと消すため
- ✅ 変更理由をコメントで記載

### 004 — README / MANUAL

- ✅ `README.md` の `init` 説明に追跡下・PR 化を反映
- ✅ `README.md` の `disable` 記述に「PR を作らない」を補足
- ✅ `MANUAL.md` のサブコマンド一覧は**4行のまま**（`set` を追加していない）。`init` のコメントのみ更新
- ✅ `MANUAL.md` に PR 化・段階的縮退・「マージまで反映されない」を追記
- ✅ `MANUAL.md:91` の「git 管理下に置いてください」を「`init` が自動で行う」に修正
- ✅ 設定スキーマ表の `mergeMethod` は既存のまま（重複追加なし）
- ✅ セクション番号は未変更（`dev-cleanup` が 6 番の構成を維持）

### 005 — 品質ゲート

- ✅ 上記「ゲート結果」のとおり全項目 pass
- ✅ `hooks/` 配下は未変更
- ✅ `.claude-plugin/plugin.json` は未変更
- ✅ `set` サブコマンドを追加していない（スコープ外）
- ✅ `enable` / `disable` の挙動を変えていない（スコープ外）
- ✅ 変更ファイルが計画の範囲内に収まっている

## スキーマ3者の一致

`hooks/lib/policy.mjs` の `DEFAULT_ENFORCE` / `references/enso.json.template` / `SKILL.md` の設定スキーマ表 の3者で `mergeMethod` を含む全キーが一致していることを確認。追跡下に入れた `.claude/enso.json` も同じキー構成。

## 信号機サマリ

### 🔵 前工程指示に沿ったもの

001 の 6-3〜6-5、002 の既存9キー、003 の worktree 判定維持、004 の全項目、005 の全項目。

### 🟡 要確認

| 対象 | 内容 |
|---|---|
| `.claude/enso.json` | `mergeMethod` の**追加**。雛形と揃える判断。既定値と同値なので挙動は変わらないが、「現行値そのまま」からは外れる |
| `SKILL.md` 6-1 の作業環境判定 | `worktreeViolation` の条件から導いた設計。実地検証はしていない |
| `SKILL.md` 6-2 のブランチ命名 | `chore/enso-policy-init`。このリポジトリに前例が無い |
| `sync-after-merge.sh` | 本体判定を絞る変更。Issue 本人が「根本対応とは別に検討の余地」とした提案 |

### 🔴 要判断

なし。

## 残存する既知のギャップ（スコープ外・意図的）

`enable` / `disable` は追跡下のファイルを書き換えるため、実行すると作業ツリーに差分が出る。うっかりコミットするとチーム全員の設定が変わる。`MANUAL.md` に注意書きを追加して可視化したが、仕組みでの防止は行っていない。対処するなら別 Issue。
