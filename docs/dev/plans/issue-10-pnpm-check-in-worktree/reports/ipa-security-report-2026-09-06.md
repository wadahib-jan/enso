# IPA セキュリティチェック レポート: issue-10-pnpm-check-in-worktree

> 実行日: 2026-09-06
> 対象: 本 PR（#17）の差分
> 実行方式: **メインコンテキストでのインライン検査**（14体のサブエージェント並列起動は行っていない。理由は「検査方式について」を参照）

## 対象ファイル

| ファイル | 種別 | 検査対象性 |
|---|---|---|
| `scripts/setup-git-hooks.mjs` | JavaScript (ESM) | ✅ 実行コード。全カテゴリを検査 |
| `pnpm-workspace.yaml` | 設定ファイル | ✅ 依存関係・ビルドスクリプト許可の観点で検査 |
| `package.json` | 設定ファイル | ✅ 同上 |
| `CLAUDE.md` | ドキュメント | ⚪ 実行されない。機密情報混入のみ確認 |
| `docs/dev/context.md` | ドキュメント | ⚪ 同上 |

## サマリ

| 重大度 | 件数 |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Informational（記録のみ・対応不要）** | **1** |

**修正を要する脆弱性は検出されなかった。**

## カテゴリ別 検査結果

| # | カテゴリ | 結果 | 根拠 |
|---|---|---|---|
| 1 | SQL インジェクション | N/A | データベースを使用しない。SQL 文字列・ORM・DB ドライバの参照なし |
| 2 | OS コマンド・インジェクション | **OK** | 下記「詳細」参照 |
| 3 | ディレクトリトラバーサル | **OK** | 下記「詳細」参照 |
| 4 | セッション管理の不備 | N/A | HTTP サーバ・セッション機構を持たない |
| 5 | XSS | N/A | HTML 出力・テンプレート描画を行わない |
| 6 | CSRF | N/A | 同上 |
| 7 | HTTP ヘッダインジェクション | N/A | HTTP レスポンスを生成しない |
| 8 | メールヘッダインジェクション | N/A | メール送信を行わない |
| 9 | クリックジャッキング | N/A | 画面を持たない |
| 10 | バッファオーバーフロー | N/A | Node.js（メモリ安全）。ネイティブアドオン・バッファ操作なし |
| 11 | アクセス制御の不備 | N/A | 認証・認可の対象となる機能を持たない |
| — | 安全な SQL の呼び出し方 | N/A | 1 と同じ |
| — | ウェブ健康診断（静的解析項目） | N/A | ウェブアプリケーションではない |
| — | 運用20ヶ条 + 実装チェックリスト | **1件（Informational）** | 下記「詳細」参照 |

## 詳細

### OS コマンド・インジェクション（検出なし）

`scripts/setup-git-hooks.mjs` は外部プロセスを2箇所で起動する。いずれも IPA の根本的解決に適合する。

```js
execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
execFileSync("simple-git-hooks", [], { stdio: "inherit" });
```

- **シェルを経由しない**: `execFileSync` を `shell: true` なしで使用しており、`exec` / `execSync` / `spawn(..., {shell:true})` は使っていない。メタ文字（`;` `|` `` ` `` `$()`）の解釈が起きない
- **外部入力を渡していない**: 引数は `["rev-parse", "--git-dir"]` / `["rev-parse", "--git-common-dir"]` / `[]` のリテラルのみ。コマンドライン引数・環境変数・ファイル内容・ネットワーク入力のいずれも連結していない
- **出典**: IPA「安全なウェブサイトの作り方 改訂第7版」1.2 OSコマンド・インジェクション（p.13-15） https://www.ipa.go.jp/security/vuln/websecurity/os-command.html （根本的解決 1.2-(i)「シェルを起動できる言語機能の利用を避ける」に適合）

### ディレクトリトラバーサル（検出なし）

`resolve()` は `git rev-parse` の出力（git 自身が返すパス）の**正規化と比較にのみ**使用しており、ファイルの読み書き・オープンには一切使っていない。外部入力由来のパスでファイルシステムにアクセスする箇所が存在しない。

- **出典**: IPA「安全なウェブサイトの作り方 改訂第7版」1.3 パス名パラメータの未チェック／ディレクトリ・トラバーサル（p.16-18） https://www.ipa.go.jp/security/vuln/websecurity/directory-traversal.html

### Informational: `allowBuilds` による postinstall スクリプトの実行許可

| 項目 | 内容 |
|---|---|
| rule_id | IPA-OPS-04-DEP-BUILD |
| severity | **informational**（対応不要・記録のみ） |
| file | `pnpm-workspace.yaml` |
| category | 依存ライブラリの管理 |

```yaml
allowBuilds:
  simple-git-hooks: true
```

**内容**: この設定は依存パッケージ `simple-git-hooks` の postinstall スクリプトの実行を許可する。pnpm 11 が build script を既定でブロックしているのは、サプライチェーン攻撃（侵害されたパッケージの install 時任意コード実行）を抑止するためであり、許可はその抑止を1パッケージ分だけ解除する行為にあたる。

**受容可能と判断した理由**:

1. **対象が1パッケージに限定されている**。ワイルドカードや全許可ではなく `simple-git-hooks` のみを名指ししている
2. **バージョンが固定され、lockfile で検証されている**。`package.json` の `devDependencies` は `simple-git-hooks: "2.13.1"`（レンジ指定なし）で、`pnpm-lock.yaml` により完全性が担保される
3. **devDependency であり、本番成果物に含まれない**。enso の配布物は `~/.claude/skills/enso` へ同期される Markdown とスクリプトで、`node_modules` は含まれない
4. **postinstall の目的が明確**。pre-commit フックの設置であり、機能上その実行が必要
5. **代替手段は品質ゲートを弱める**。許可しない場合、Issue #10 の症状（`pnpm secretlint` / `pnpm check` が exit 1）が残り、コミット前の機密情報検査そのものが回らなくなる

**推奨（本 PR のスコープ外）**: IPA 20ヶ条 第4条の趣旨に沿って、依存関係の脆弱性を継続的に監視する仕組み（GitHub Dependabot / `pnpm audit` の CI 組み込み）があるとなお良い。現状 `.github/workflows/ci.yml` は secretlint と Biome のみを実行している。

- **出典**: IPA「安全なウェブサイトの運用管理に向けての20ヶ条」第4条「ウェブアプリ構成ソフトウェアの脆弱性対策を定期的に実施」 https://www.ipa.go.jp/security/vuln/websecurity/sitecheck.html

### 機密情報の混入

`pnpm secretlint`（preset-recommend）を worktree 全体に対して実行し、**指摘なし（exit 0）**。追加・変更したファイルに認証情報・トークン・鍵は含まれない。

## 検査方式について

本スキルの標準手順は検査エージェント14体をメインから並列起動する構成だが、今回は**メインコンテキストでインライン検査した**。

理由: 対象がドキュメント2件・設定2件・71行の Node スクリプト1件であり、11カテゴリのうち9カテゴリは対象コードに該当する言語機能・実行面（DB / HTTP / セッション / テンプレート / メール / ネイティブメモリ操作）が存在しないため、ファンアウトしても各エージェントが「N/A」を返すだけになる。実行コード面（`execFileSync` の2箇所と `resolve()` の用法）は全量を読んで検査しており、カバレッジは落ちていない。

**より広い範囲（enso 全体、あるいは Web アプリケーションを含むリポジトリ）を対象にする場合は、標準の並列構成で実行すること。**
