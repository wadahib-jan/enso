# IPA セキュリティチェック レポート

- **実行日**: 2026-09-12
- **対象**: `--diff`（`main...worktree-skill-index` の差分ファイル）
- **Plan**: skill-index
- **準拠資料**: 安全なウェブサイトの作り方 改訂第7版 / 安全なSQLの呼び出し方 / ウェブ健康診断仕様 / 安全なウェブサイトの運用管理に向けての20ヶ条 / セキュリティ実装チェックリスト

## サマリ

| 重大度 | 件数 |
|---|---|
| critical | 0 |
| high | 0 |
| medium | 0 |
| low | 0 |
| **合計** | **0** |

## スコープ解決の結果

差分ファイル 21 件のうち、本スキルの対応言語（PHP / Java / Ruby / Python / JS・TS / C# / Go / 設定ファイル）に該当するものは **1 件**。残り 20 件は Markdown で、検査対象の拡張子に含まれない。

| 分類 | 件数 | ファイル |
|---|---|---|
| Markdown（対象外） | 20 | `README.md` / `MANUAL.md` / `CLAUDE.md` / `skills/*/SKILL.md` 6 件 / `docs/dev/plans/skill-index/**` 11 件 |
| YAML（設定ファイルとして検査） | 1 | `docs/dev/plans/skill-index/loop-state.yaml` |
| 削除されたファイル（検査対象外） | 4 | `skills/ipa-security-guide/**` |

実行可能コード（`hooks/*.mjs`、`scripts/*.sh`、`scripts/*.mjs`）は本 Plan で一切変更していないため差分に含まれない。

## 検出結果

検出なし。

### `docs/dev/plans/skill-index/loop-state.yaml` の確認

唯一の検査対象ファイル。`dev-plan` / `dev-loop` が生成する進行状態ファイルで、以下を確認した。

| 観点 | IPA 出典 | 結果 |
|---|---|---|
| 認証情報・APIキー・トークンの平文記載 | 安全なウェブサイトの運用管理に向けての20ヶ条（第12条: 重要情報の適切な管理） / https://www.ipa.go.jp/security/vuln/websecurity/about.html | OK（記載は plan 名・ブランチ名・worktree パス・PR 番号・承認時刻のみ） |
| 外部へ公開される設定値の混入 | セキュリティ実装チェックリスト（安全なウェブサイトの作り方 改訂第7版 p.105-108） / https://www.ipa.go.jp/security/vuln/websecurity/about.html | OK（アプリケーションの設定ファイルではなく、ローカルの進行状態ファイル） |

`worktree` フィールドにローカルの絶対パス（`/workspace/enso/.claude/worktrees/skill-index`）が含まれるが、これは `dev-loop` が作業ディレクトリを復元するために必須の値で、リポジトリ内の他の Plan でも同様に記録されている既存仕様。機密情報ではない。

## 偽陽性候補

なし（finding が 0 件のため Phase 5 の偽陽性レビューは実施していない）。

## トリアージ済み（抑止）

なし。

## 補足

`pnpm secretlint`（`@secretlint/secretlint-rule-preset-recommend`）を本 Plan のコミット時に pre-commit フックで実行しており、機密情報の検出は 0 件。本レポートの結論と整合する。
