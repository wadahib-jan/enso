# IPA セキュリティチェック レポート

- 対象 Plan: `issue-15-sync-script-read-policy`（PR #16 / Issue #15）
- 実施日: 2026-09-06
- 対象スコープ: 本 PR の差分（`hooks/lib/policy.mjs` / `scripts/lib/print-enforce.mjs` / `scripts/sync-after-merge.sh`。ドキュメント3件は検査対象外）
- 実施方法: 差分3ファイルに対する静的レビュー。**サブエージェントによる並列スキャンは行っていない**（対象が3ファイル・非 Web・DB / HTTP / テンプレート出力の面を一切持たないため、該当カテゴリを直接精査した）

## サマリ

| Severity | 件数 |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 1（本レポート内で修正済み） |

未対応の指摘はありません。

## カテゴリ別の判定

| カテゴリ | IPA 出典 | 判定 |
|---|---|---|
| SQL インジェクション | SWS 1.1 / 安全なSQLの呼び出し方 | 対象外（DB アクセスなし） |
| OS コマンドインジェクション | SWS 1.2 | **検査済み。指摘1件（下記 L-01、修正済み）** |
| ディレクトリトラバーサル | SWS 1.3 | 検査済み。問題なし |
| セッション管理の不備 | SWS 1.4 | 対象外（セッションなし） |
| XSS | SWS 1.5 | 対象外（HTML 出力なし） |
| CSRF | SWS 1.6 | 対象外（Web エンドポイントなし） |
| HTTP ヘッダインジェクション | SWS 1.7 | 対象外 |
| メールヘッダインジェクション | SWS 1.8 | 対象外 |
| クリックジャッキング | SWS 1.9 | 対象外 |
| バッファオーバーフロー | SWS 1.10 | 対象外（メモリ安全な言語のみ） |
| アクセス制御の不備 | SWS 1.11 | 対象外（認可の概念を持たない） |
| 運用 20ヶ条 / 実装チェックリスト | OPS / CL | 検査済み。機密情報の混入なし（secretlint 検出0） |

## 指摘

### L-01（Low）: 設定値がそのまま `git` の引数になり、オプションとして解釈されうる

- ファイル: `scripts/lib/print-enforce.mjs` / `scripts/sync-after-merge.sh`
- カテゴリ: OS コマンドインジェクション（引数インジェクション）
- CWE: CWE-88（Argument Injection or Modification）
- IPA 出典:
  - document: 安全なウェブサイトの作り方 改訂第7版
  - section: 1.2 OS コマンド・インジェクション
  - page: 13-15
  - url: https://www.ipa.go.jp/security/vuln/websecurity/about.html

**内容**

本 PR により `.claude/enso.json` の `enforce.baseBranch` が `BASE_BRANCH` に流れ、`git switch "$BASE_BRANCH"` / `git pull --ff-only origin "$BASE_BRANCH"` / `git rev-parse "$BASE_BRANCH"` の引数になる。値はクォートされているためシェルの単語分割・コマンド置換は起きない（＝古典的な OS コマンドインジェクションは成立しない）が、**`-` で始まる値は `git` 側でオプションとして解釈されうる**。

設定ファイルは利用者自身が書くものであり脅威度は低い。ただし本 PR は「設定ファイルの値をスクリプトの動作に流し込む」経路を新設するものであり、**打ち間違いでも同じ挙動になる**ため、入口で弾く方針を採った（Issue #15 の設計判断と同種の理由）。

**対応（根本的解決・本 PR 内で修正済み）**

`scripts/lib/print-enforce.mjs` にブランチ名の検証を追加し、`^[A-Za-z0-9._/-]+$` に一致し、かつ `-` で始まらない値だけを出力するようにした。弾かれた値は行に出ないため、呼び出し側は既定値にフォールバックする。

```js
const isSafeBranchName = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  !value.startsWith("-") &&
  /^[A-Za-z0-9._/-]+$/.test(value);
```

**検証**

`baseBranch: "--upload-pack=touch /tmp/pwned"`、`protectedBranches: ["main", "-x", "release/1.0", "bad name"]` の設定に対し、出力は `protected -> main` と `protected -> release/1.0` のみ。`--upload-pack=...` / `-x` / `bad name` はいずれも出力されず、`base-branch` は行ごと落ちて既定値 `main` にフォールバックすることを確認した。

## 問題なしと判定した観点

- **`node "$PRINT_ENFORCE" "$MAIN"`**: 引数は argv で渡しており、`eval` も文字列連結によるコマンド組み立ても使っていない。SWS 1.2 の「シェルを起動できる言語機能の使用を避ける / 引数を渡す形にする」に適合
- **設定ファイルの探索（`resolveEnforce`）**: 探索起点は `git worktree list` から得た本体チェックアウトのパスであり、外部入力ではない。パスの連結は `node:path` の `join` を使用し、`..` を含む外部入力を受け取る経路がない（SWS 1.3）
- **JSON パース**: `JSON.parse` を try/catch で囲み、失敗時は既定値へフォールバックする。パースエラーのメッセージにファイルパスは含むが、機密情報は含まない
- **`resolveEnforce` の戻り値**: 毎回スプレッドで新しいオブジェクトを作るため、呼び出し側が `DEFAULT_ENFORCE` を破壊できない
- **hooks の3原則**: `jq` 非依存（Node でパース）／hook 側は `runHook()` により必ず exit 0（本 PR は `loadPolicy` の戻り値契約を変えていない）／内容の基準は `gitState().topLevel` のまま変更なし
- **秘密情報**: `pnpm secretlint` 検出0

## 結論

Critical / High / Medium の指摘はなし。Low 1件は本 PR 内で修正済み。`gh pr ready` に進んで差し支えない。
