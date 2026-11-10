# 外部情報源 一覧

本リポジトリの各スキルが参照している **外部の公式資料・規格・ガイドライン** をここに集約する。

- スキル内部のロジック・プロンプトに反映している知見の **出典元** を明示するためのファイル。
- 著作権・ライセンスは各情報源の発行元に帰属する。同梱の knowledge ファイル等は **二次的に整理した参照用ノート** である。
- 各情報源の **詳細 (版情報・章立て・ページ番号など)** は、利用しているスキル内の `knowledge/_sources.md` (またはそれに相当するファイル) を参照する。

## 運用ルール

新しい外部情報源を参照するスキルを追加した場合は、以下を行う:

1. スキル内に `knowledge/_sources.md` を置き、正式名称・版・発行日・URL・ライセンス・章節などの詳細を記録する。
2. 本ファイル (`docs/external-sources.md`) の **クイックインデックス** に1行追記する。
3. 本ファイルの末尾に **情報源ごとのセクション** を追加し、利用スキル名・詳細リンクを記載する。
4. スキルの finding / 出力に出典 (文書名・章・ページ・URL) を必ず添える設計にする。

## クイックインデックス

| # | 情報源 (略称) | 発行者 | 利用スキル | 詳細 |
|---|---|---|---|---|
| 1 | 安全なウェブサイトの作り方 改訂第7版 ほか IPA 5 資料 | 独立行政法人 情報処理推進機構 (IPA) | `ipa-security-check` | [#1-ipa-web-security](#1-ipa-安全なウェブサイトの作り方-ほか-5-資料) |

---

## 1. IPA「安全なウェブサイトの作り方」ほか 5 資料

| 項目 | 値 |
|---|---|
| 発行者 | 独立行政法人 情報処理推進機構 (IPA) |
| 公式紹介ページ | https://www.ipa.go.jp/security/vuln/websecurity/about.html |
| ライセンス・著作権 | IPA に帰属 |
| 利用スキル | `skills/ipa-security-check/` |
| 詳細出典マスター | [`skills/ipa-security-check/knowledge/_sources.md`](../skills/ipa-security-check/knowledge/_sources.md) |

### 参照している資料

| 略称 | 正式名称 | 版 / 発行日 | URL |
|---|---|---|---|
| SWS | 安全なウェブサイトの作り方 | 改訂第7版 第4刷 / 2021-03-31 | https://www.ipa.go.jp/security/vuln/websecurity/ug65p900000196e2-att/000017316.pdf |
| SQL | 安全なSQLの呼び出し方 (別冊) | 第1版 / 2010-03-18 | https://www.ipa.go.jp/security/vuln/websecurity/ug65p900000196e2-att/000017320.pdf |
| WHC | ウェブ健康診断仕様 (別冊) | 第1版 第1刷 / 2012-12-26 | https://www.ipa.go.jp/security/vuln/websecurity/ug65p900000196e2-att/000017319.pdf |
| OPS | 安全なウェブサイトの運用管理に向けての20ヶ条 | - | https://www.ipa.go.jp/security/vuln/websecurity/sitecheck.html |
| CL  | セキュリティ実装チェックリスト | 改訂第7版 巻末 (p.105〜108) / Excel 別添あり | https://www.ipa.go.jp/security/vuln/websecurity/ug65p900000196e2-att/000044403.xlsx |

### 利用方針

- スキルの finding 出力には、必ず IPA 原典の `document / section / page / url` を添える。
- 提案は「**根本的解決**」と「**保険的対策**」を区別して提示する (IPA 用語に準拠)。
- 版情報・章節・CWE 対応表など詳細は [`skills/ipa-security-check/knowledge/_sources.md`](../skills/ipa-security-check/knowledge/_sources.md) を参照。
