# 検証レポート: dev-cleanup

実行日: 2026-09-06
対象: タスク 001〜009

## ゲート結果

| 項目 | コマンド | 結果 |
|---|---|---|
| 機密情報検査 | `pnpm secretlint` | ✅ OK |
| フォーマット・Lint | `pnpm check` | ✅ OK（11ファイル、修正なし） |
| マニフェスト検証 | `claude plugin validate .` | ✅ passed with warnings（既存2件・無関係） |
| 投入差分 | `./scripts/install-local.sh --dry-run` | ✅ 新規1ファイル、削除なし |
| テスト | — | N/A（テストランナー不在） |

## hooks のロジック検証（タスク 008）

**hooks はセッション開始時に `~/.claude/skills/enso` から読み込まれるため、worktree 内の変更は現セッションの挙動に反映されない。** そこで `guard-bash.mjs` から関数定義を抽出し、実データに対して判定ロジックを直接評価した。

```
=== 緩和1: ブランチ削除の push を通す（保護ブランチは除く）
  ok  git push origin --delete worktree-x → 通す
  ok  git push origin :worktree-x → 通す
  ok  git push origin --delete main → 拒否
  ok  git push origin worktree-x（通常）→ 拒否
  ok  git push → 拒否
  ok  git commit -m x → 拒否
  ok  echo git push（偽陽性なし）

=== 緩和2/3: マージ済みなら ask を出さない
  ok  git branch -d worktree-dev-cleanup（未マージ）→ ask
  ok  git branch -d main（=base、祖先）→ ask 不要
  ok  git branch -D 存在しないブランチ → ask（フォールバック）
  ok  git worktree remove <未マージ worktree> → ask
  ok  git status（対象外）→ ask なし

=== 例外時のフォールバック
  ok  isMergedIntoBase(null) → false
  ok  isMergedIntoBase(不正ref) → false

ALL PASS  pass=24 fail=0
```

内訳: 緩和1（8件）/ バイパス防止（5件）/ 緩和2・3（5件）/ パス完全一致（4件）/ 例外フォールバック（2件）。

**セキュリティチェックでバイパス3件を検出し、修正したうえで再検証している**（`ipa-security-report.md` 参照）。当初の実装は削除対象を1つしか見ておらず、`git push origin --delete feature main` のように許可される名前を先頭に置くことで保護ブランチを道連れに削除できた。

**緩和が広がりすぎていないことを確認済み。** 通常の `git push` / `git commit` / `git push origin HEAD:main` は引き続き拒否され、保護ブランチの削除も拒否される。判定不能時は `ask` にフォールバックする（安全側）。

**実地の動作確認は投入・再起動後に必要。** 上記はロジックの検証であり、hook としての実行経路（stdin の JSON パース、`emitDecision` の出力）は検証していない。

## タスク別の受け入れ確認

### 001: enforce.mergeMethod

| 確認項目 | 結果 |
|---|---|
| `enso.json.template` に `"mergeMethod": "merge"` | ✅ JSON として妥当（`node -e` でパース確認） |
| `enso-policy` の設定スキーマ表に行を追加 | ✅ |
| `enso-policy` の init の質問に追加 | ✅ ワークフロー Step 3 |
| `MANUAL.md` の設定表と JSON 例 | ✅ 両方に反映 |
| `DEFAULT_ENFORCE` に追加 | ✅ `baseBranch` の次 |
| **hook の挙動を変えていない** | ✅ `grep -rn "mergeMethod" hooks/` が `DEFAULT_ENFORCE` の1行のみ |

### 002: dev-cleanup スキル

| 確認項目 | 結果 |
|---|---|
| `name` がディレクトリ名と一致 | ✅ `dev-cleanup` |
| 本文構成（前提知識 → ワークフロー → ルール・制約 → 追加リソース） | ✅ |
| yes/no ゲートが唯一の確認点で省略不可 | ✅ Step 3 とルール・制約の両方 |
| `mergeStateStatus` の5値の扱い | ✅ 表で記載 |
| CI 詳細が取れない場合の明示 | ✅ Step 2 |
| **`gh pr checks` を使っていない** | ✅ 「使わない」文脈の3箇所のみ |
| `gh pr checks` を使わない理由 | ✅ `Checks` 権限が存在しないこと |
| フォールバックを残す理由 | ✅ 他プロジェクト・他メンバー・CI 不在の3点 |
| `--untracked-files=no` とその理由 | ✅ |
| `ExitWorktree`（keep）が後始末より前 | ✅ Step 5 → Step 6 |
| `sync-after-merge.sh` への委譲分岐 | ✅ Step 6 |
| 汎用手順（fetch / switch / pull / 削除 / prune / リモート削除） | ✅ |
| squash マージ時の `gh pr list` 問い合わせ | ✅ |
| `mergeMethod` を読み、無ければ `merge` | ✅ Step 4 |
| 異常系: MERGED / CLOSED の3分岐 | ✅ Step 2 |
| 異常系: `pr_number` が `null` | ✅ Step 1 |
| 異常系: 対象0件で何もせず終了 | ✅ Step 1 |
| エッジケース: 未コミット変更のある worktree は skip | ✅ |
| 500行以内 | ✅ 253行 |

### 003: dev-loop のゲート

| 確認項目 | 結果 |
|---|---|
| Step 10 として後始末の確認を追加 | ✅ |
| yes で `dev-cleanup` を起動 | ✅ |
| no で PR の URL を提示して終了 | ✅ |
| **中断時（`failed`）は確認を出さない** | ✅ |
| `pr_number` が `null` なら出さない | ✅ |
| フロー図に `dev-cleanup` を追加 | ✅ |
| サブエージェント経由で起動しない旨 | ✅ |
| 500行以内 | ✅ 208行 |

### 004: gh search issues の修正

| 確認項目 | 結果 |
|---|---|
| `--state all` を削除 | ✅ コメントで理由も併記 |
| `gh issue list --state all` は変更なし | ✅（こちらは `all` が有効） |
| **実際に成功する** | ✅ `gh search issues --repo yukimnb/enso "enso.json" --limit 10` → Issue #12 を返した |

### 005: ドキュメントとナビゲーション

| 確認項目 | 結果 |
|---|---|
| `dev-navigate` の対象スキル一覧に追加 | ✅ |
| Q1 に「PR をマージして片付けたい」を追加 | ✅ |
| 提案メッセージが既存形式 | ✅ |
| 既存の選択肢・分岐が無傷 | ✅ Q1 の既存7選択肢、Q2 / Q2b / Q2c すべて残存 |
| README の Dev Skills 表に追加 | ✅ |
| MANUAL のワークフロー図に追加 | ✅ 2つの yes/no ゲートも図示 |
| MANUAL に詳細セクション | ✅ 「### 6. dev-cleanup」 |
| **セクション番号の振り直し** | ✅ `dev-impl` 以降を 6→7 〜 12→13 に更新 |
| 再起動が自動化できない旨 | ✅ 注意事項3 |

### 007: 「公開リポジトリ」前提の訂正

| 確認項目 | 結果 |
|---|---|
| `grep -rn "公開リポジトリ" skills/` | ✅ 0件 |
| 代わりの根拠（打ち間違い・将来の公開・再利用） | ✅ 3点を記載 |
| 「信頼できない入力」の表を削除していない | ✅ 維持 |
| 番号検証・スラッグ正規化を削除していない | ✅ 維持 |
| 停止理由の順序を入れ替え | ✅ 「Issue の意図とのずれ」が主たる理由に |
| `ipa-security-report.md` に**追記**（書き換えでなく） | ✅ 冒頭に【後日追記】ブロック |
| `issue-skills/plan.md` の訂正 | ✅ 【後日訂正】として併記 |

### 008: hooks のガード緩和

上記「hooks のロジック検証」のとおり 24/24 通過。セキュリティチェックで検出したバイパス3件（複数 refspec / 複数ブランチ指定 / パス部分一致）を修正済み。

### 010: sync-after-merge.sh へのリモートブランチ削除

本リポジトリでの実行は Issue #12（未追跡の `.claude/enso.json`）でブロックされるため、**スクラッチの git リポジトリ（bare リモート付き）で実地検証**した。

```
=== 検証前のリモートブランチ
  refs/heads/main
  refs/heads/merged
    リモートブランチを削除: origin/merged
 - [deleted]         merged
=== 検証後のリモートブランチ
  refs/heads/main
  ok  merged が削除された
  ok  main は残っている
  ok  REMOTE_DELETED に merged のみ
  ok  リモートに無い local-only は SKIPPED に入らない
=== dry-run では削除しないこと
    [dry-run] git ... push origin --delete merged
  ok  dry-run 後も merged が残っている

ALL PASS
```

| 確認項目 | 結果 |
|---|---|
| `bash -n` が通る | ✅ |
| マージ済み・リモートに存在するブランチを削除 | ✅ |
| `main` は残る | ✅ |
| リモートに無いブランチでは `push --delete` を実行しない | ✅ |
| `REMOTE_DELETED` に削除分のみ | ✅ |
| `--dry-run` で削除しない | ✅ |
| push 失敗時に異常終了せず `SKIPPED` に記録 | ✅ `if ! ...` により `set -e` が発火しない |
| `CLAUDE.md` に追記 | ✅ |
| `dev-cleanup` の委譲の記述を更新 | ✅ |
| **保護ブランチが削除対象から除外される** | ✅ セキュリティチェックの指摘5で追加。`develop` が `main` の祖先でも除外されることを実地確認 |

### 009: dev-plan の承認ゲート

| 確認項目 | 結果 |
|---|---|
| Phase 5e が AskUserQuestion の yes/no | ✅ |
| はいで `dev-loop` を起動 | ✅ |
| いいえで `awaiting-approval` のまま終了 | ✅ |
| 後から「確認した」で拾える旨 | ✅ |
| `pr_number` が `null` の場合の扱い | ✅ |
| `enso-issue-fix` Step 6 から自前の停止メッセージを削除 | ✅ |
| `enso-issue-fix` Step 4 に「解釈の対応関係を含めること」を追加 | ✅ |
| `plan-request-template.md` に反映 | ✅ 【停止時の提示】節 |
| **ゲートが二重に出ない** | ✅ `enso-issue-fix` は独自メッセージを出さない |
| サブエージェント経由で起動しない旨 | ✅ |

## 500行ルール

| ファイル | 行数 | 判定 |
|---|---|---|
| `skills/dev-cleanup/SKILL.md` | 253 | ✅ |
| `skills/dev-loop/SKILL.md` | 208 | ✅ |
| `skills/dev-plan/SKILL.md` | 370 | ✅ |
| `skills/dev-navigate/SKILL.md` | 373 | ✅ |
| `skills/enso-issue-fix/SKILL.md` | 336 | ✅ |
| `skills/enso-policy/SKILL.md` | 100 | ✅ |

## 信号機サマリ

### 🔵 前工程指示

- ガード緩和の3点（実測で問題を確認し、ロジック検証で 14/14 通過）
- CI 取得手段の選択（公式ドキュメントで `Checks` 権限の不在を確認、`gh run list` の動作を実測）
- 承認ゲートの2箇所化

### 🟡 要確認

| 対象 | 確認すべき点 |
|---|---|
| `hooks/guard-bash.mjs` | **実地の動作確認が未了。** ロジックは検証したが、hook としての実行経路（stdin パース・`emitDecision` 出力）は投入・再起動後でないと確認できない。初回の `dev-cleanup` 実行が実質の受け入れテストになる |
| `skills/dev-cleanup/SKILL.md` Step 6 | 委譲判定を `scripts/sync-after-merge.sh` の有無で行っている。他プロジェクトが同名の別物を置いていると意図せず実行する |
| — | ~~リモートブランチ削除が enso 経路で実行されない~~ → **解消。** タスク 010 で `sync-after-merge.sh` に追加した |

### 🔴 要判断

なし。

## 備考

成果物は Markdown のスキル定義と `hooks/*.mjs` の変更。実装は `dev-run` のサブエージェント経由ではなく、計画のインターフェース定義と各タスクの Test Strategy を受け入れ条件としてメインコンテキストで行い、1項目ずつ確認した。hooks については判定ロジックを抽出して 14 ケースを実データで検証している。

PR #14（Issue #12 対応）は本 PR と `enso-policy` / `sync-after-merge.sh` で競合しうるため、ユーザーの判断で停止中。
