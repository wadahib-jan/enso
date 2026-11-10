# IPA セキュリティチェックレポート: rev-docs

**実行日**: 2026-09-07
**ブランチ**: worktree-rev-docs
**PR**: https://github.com/yukimnb/enso/pull/20
**スコープ**: `main...HEAD` の差分

## 結論

**検出なし（脆弱性候補 0 件）。** 検査対象となるソースコードが差分に含まれないため。

## スコープ解決の結果

`lib/scope_resolver.md` の対応言語マッピング（PHP / Java / Ruby / Python / JS・TS / C#・.NET / Go / 設定ファイル）に照らして差分ファイルを分類した。

| ファイル | 種別 | 検査対象 |
|---|---|---|
| `skills/rev-docs/SKILL.md` | Markdown（スキル定義） | 対象外 |
| `skills/rev-docs/references/phase1-tasks.md` | Markdown | 対象外 |
| `skills/rev-docs/references/phase2-design.md` | Markdown | 対象外 |
| `skills/rev-docs/references/phase3-requirements.md` | Markdown | 対象外 |
| `skills/rev-docs/references/phase4-specs.md` | Markdown | 対象外 |
| `skills/edgecase-analysis/SKILL.md` | Markdown | 対象外 |
| `skills/impact-analysis/SKILL.md` | Markdown | 対象外 |
| `skills/sequence-diagram-analysis/SKILL.md` | Markdown | 対象外 |
| `skills/state-transition-analysis/SKILL.md` | Markdown | 対象外 |
| `commands/help.md` | Markdown | 対象外 |
| `commands/rev-tasks.md` ほか3件 | Markdown（削除） | 対象外 |
| `README.md` / `MANUAL.md` | Markdown | 対象外 |
| `docs/dev/plans/rev-docs/**` | Markdown / YAML（計画成果物） | 対象外 |

対応言語の拡張子（`.php` `.java` `.jsp` `.rb` `.erb` `.py` `.js` `.jsx` `.ts` `.tsx` `.vue` `.cs` `.cshtml` `.aspx` `.go`）および検査対象の設定ファイル（`nginx.conf` `.htaccess` `web.xml` `Dockerfile` 等）に該当するファイルは**差分に1件も含まれない**。

`docs/dev/plans/rev-docs/loop-state.yaml` は YAML だが、アプリケーションの設定ファイルではなく enso の状態ファイルであり、実行時に解釈される権限・公開範囲・ヘッダ設定を持たない。運用20ヶ条（OPS）の観点でも指摘事項なし。

検査対象ファイルが 0 件のため、検査エージェント（01〜11 / safe-sql-details / web-health-check / operation-checklist）および偽陽性レビューエージェントは起動していない。

## 補足: 変更内容自体のセキュリティ上の影響

本変更はドキュメントとスキル定義の統合であり、次のいずれも行っていない。

- 実行されるコード（`hooks/` の `.mjs`、`scripts/` のシェルスクリプト）の変更 — なし
- 権限・強制モード設定（`.claude/enso.json`、`hooks/lib/policy.mjs`）の変更 — なし
- 外部への通信・認証情報の取り扱いの追加 — なし

削除した `commands/rev-*.md` に含まれていた `claude code rev-tasks --path ./backend` 等の記述は実在しないCLIの例示であり、削除によって失われる機能はない。

新設した `skills/rev-docs/SKILL.md` は `docs/` 配下へのファイル生成を行うが、書き込み先は `docs/tasks/` `docs/design/` `docs/spec/` に限定され、強制モードが有効なプロジェクトでは `hooks/guard-edit.mjs` の保護ブランチ判定が引き続き適用される（SKILL.md の `## ルール・制約` に明記済み）。

## サマリ

| 深刻度 | 件数 |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |

| 参照した IPA 資料 | 適用結果 |
|---|---|
| 安全なウェブサイトの作り方 改訂第7版 (SWS) | 対象コードなし |
| 安全なSQLの呼び出し方 (SQL) | 対象コードなし |
| ウェブ健康診断仕様 (WHC) | 対象コードなし |
| 安全なウェブサイトの運用管理に向けての20ヶ条 (OPS) | 該当する設定ファイルの変更なし |
| セキュリティ実装チェックリスト (CL) | 対象コードなし |

出典: https://www.ipa.go.jp/security/vuln/websecurity/about.html
