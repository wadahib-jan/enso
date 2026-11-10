# IPA セキュリティチェックレポート: retire-commands

**実行日**: 2026-09-07
**ブランチ**: worktree-retire-commands
**PR**: https://github.com/yukimnb/enso/pull/21
**スコープ**: `main...HEAD` の差分

## 結論

**検出なし（脆弱性候補 0 件）。** 差分の大半は Markdown で検査対象外。唯一の実行コードである `scripts/install-local.sh` の変更（削除処理の追加）を個別に精査し、指摘事項なしと判断した。

## スコープ解決の結果

`lib/scope_resolver.md` の対応言語マッピング（PHP / Java / Ruby / Python / JS・TS / C#・.NET / Go / 設定ファイル）に照らして差分ファイルを分類した。

| ファイル | 種別 | 検査対象 |
|---|---|---|
| `commands/*.md`（13件、削除） | Markdown | 対象外 |
| `skills/dev-debug/SKILL.md` ほかスキル定義7件 | Markdown | 対象外 |
| `skills/dev-debug/references/*.md`（3件、新規） | Markdown | 対象外 |
| `skills/ipa-security-check/references/arguments.md`（移動） | Markdown | 対象外 |
| `README.md` / `MANUAL.md` / `CLAUDE.md` / `docs/dev/context.md` | Markdown | 対象外 |
| `docs/dev/plans/retire-commands/**` | Markdown / YAML（計画成果物） | 対象外 |
| `.claude-plugin/plugin.json` | JSON（プラグインマニフェスト） | 対象外（Web アプリの設定ファイルではない） |
| **`scripts/install-local.sh`** | **Bash（ローカル実行スクリプト）** | **個別精査（下記）** |

対応言語の拡張子（`.php` `.java` `.jsp` `.rb` `.erb` `.py` `.js` `.jsx` `.ts` `.tsx` `.vue` `.cs` `.cshtml` `.aspx` `.go`）および検査対象の設定ファイル（`nginx.conf` `.htaccess` `web.xml` `Dockerfile` 等）に該当するファイルは差分に含まれない。Web アプリケーションではないため、検査エージェント 01〜11 / safe-sql-details / web-health-check が想定する攻撃面（HTTP リクエスト・SQL・セッション・出力エンコーディング）は成立しない。

## 個別精査: `scripts/install-local.sh`

投入先に残る古いディレクトリを削除する処理を追加した。ローカル実行のシェルスクリプトであり外部入力を受けないが、**削除処理**であるため次の観点で確認した。

出典: IPA「セキュリティ実装チェックリスト」〈4. ファイルアクセス〉、IPA「安全なウェブサイトの作り方 改訂第7版」〈1.7 パス名パラメータの未チェック（ディレクトリ・トラバーサル）〉、〈2. ウェブサイトの安全性向上のための取り組み〉、IPA「安全なウェブサイトの運用管理に向けての20ヶ条」〈条項 3: 管理用ツールの実行権限〉
https://www.ipa.go.jp/security/vuln/websecurity.html

| 観点 | 確認結果 |
|---|---|
| 削除パスに外部入力が混入しないか | `$d` はループのリテラル列挙（`commands` `skills` `agents` `hooks`）のみ。コマンドライン引数は `--uninstall` / `--dry-run` / `-h` のホワイトリスト方式で、それ以外は `exit 1`（`install-local.sh:24-31`）。パス要素としてユーザー入力が渡る経路は無い |
| 変数の空展開による広域削除（`rm -rf "/$d"` 等） | `${DEST:?}` を用い、`DEST` が未設定・空なら削除前に異常終了する。`DEST` 自体も `set -u` 下で `DEST_ROOT/$NAME` から構成され、`NAME` が空の場合は `install-local.sh:42` で先に `exit 1` する |
| 削除範囲の限定 | 削除対象は `$DEST/<固定名>` に限定され、`$DEST` は `~/.claude/skills/<plugin name>`（`CLAUDE_SKILLS_DIR` で上書き可）配下。リポジトリ側や無関係なパスを削除しない |
| ディレクトリ・トラバーサル | パス要素にリテラルしか使わないため `../` の混入余地が無い |
| `--dry-run` の副作用 | `--dry-run` 指定時は削除を実行せず予定を表示するだけ（実行して確認済み） |
| 実行権限 | ユーザー自身のホーム配下への書き込みのみ。特権昇格・setuid・所有者変更は行わない |

`shellcheck` 相当の観点では、`set -euo pipefail` の維持、変数の引用（`"$DEST/$d"`）、配列の安全な展開（`"${STALE[@]}"`）を確認した。`bash -n` による構文チェックも通過。

なお `STALE` 配列が空のまま `"${STALE[@]}"` を展開する箇所は、`set -u` 下でも bash 4.4 以降では未定義エラーにならない（本リポジトリの実行環境要件は Node.js 24 / macOS・Linux の bash）。

## 補足: 変更内容自体のセキュリティ上の影響

- `hooks/`（強制モードの実行コード）の変更 — **なし**
- 権限・強制モード設定（`.claude/enso.json`、`hooks/lib/policy.mjs`）の変更 — **なし**
- 外部への通信・認証情報の取り扱いの追加 — **なし**
- 削除した13コマンドのうち、認証・通信・秘匿情報を扱うものは無い（いずれも Markdown のプロンプト定義）

むしろ本変更は、投入先に古いコマンド定義が残り続ける状態（削除したはずのプロンプトが実行され得る状態）を解消するため、**運用上の一貫性は向上する**。

## サマリ

| 深刻度 | 件数 |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |

| 参照した IPA 資料 | 適用結果 |
|---|---|
| 安全なウェブサイトの作り方 改訂第7版 | 検査対象のウェブアプリケーションコードが差分に無い。1.7（パス名パラメータ）のみシェルスクリプトに準用し、指摘なし |
| 安全なSQLの呼び出し方 | SQL を含むコードが差分に無く、非該当 |
| ウェブ健康診断仕様 | 稼働するウェブサイトを対象とする診断であり、非該当 |
| セキュリティ実装チェックリスト | 〈4. ファイルアクセス〉をシェルスクリプトの削除処理に適用し、指摘なし |
| 安全なウェブサイトの運用管理に向けての20ヶ条 | 〈条項 3〉を管理用スクリプトの実行権限に適用し、指摘なし |
