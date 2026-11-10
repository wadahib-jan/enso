# IPA セキュリティチェック レポート: issue-12-track-enso-json

実行日: 2026-09-06 / 対象: `origin/main...HEAD` の差分（計画成果物を除く）

## 検査スコープ

| ファイル | 種別 | 変更量 |
|---|---|---|
| `.claude/enso.json` | JSON 設定（新規追跡） | +14 |
| `scripts/sync-after-merge.sh` | Bash | +8 −2 |
| `skills/enso-policy/SKILL.md` | Markdown（スキル定義） | +53 −2 |
| `README.md` | Markdown | +4 −2 |
| `MANUAL.md` | Markdown | +8 −2 |

**Web アプリケーションのコードは含まれない。** 本リポジトリは Markdown のスキル定義と hooks の JS で構成される開発支援ツールであり、HTTP リクエストの処理・SQL の発行・HTML のレンダリング・セッション管理・メール送信のいずれも行わない。

そのため SWS 11 脆弱性のうち **SQLi / XSS / CSRF / HTTP ヘッダインジェクション / メールヘッダインジェクション / クリックジャッキング / セッション管理 / バッファオーバーフロー** は**適用対象外**（該当するコードパスが存在しない）。適用可能な観点に絞って検査した。

## 検査結果サマリ

| 深刻度 | 件数 |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |

**検出なし。**

## 適用可能な観点の検査

### 1. 機密情報の混入（OPS / 運用20ヶ条）

- `secretlint`（preset-recommend）を変更ファイル全件に対して実行 → **exit 0、検出なし**
- 新規に追跡下へ入れた `.claude/enso.json` の全キーを目視確認。`enabled` / `mode` / `worktree` / `flow` / `security` / `skills` / `baseBranch` / `mergeMethod` / `protectedBranches` / `exclude` の10キーのみで、**認証情報・トークン・ホスト名・個人情報を含まない**

| IPA 出典 | |
|---|---|
| document | 安全なウェブサイトの運用管理に向けての20ヶ条 |
| section | 設定ファイル・公開資産の管理 |
| url | https://www.ipa.go.jp/security/vuln/websecurity/about.html |

### 2. OS コマンドインジェクション（SWS 1.2）

`scripts/sync-after-merge.sh` の変更は、既存の `git_main` ヘルパへ**固定の定数フラグ** `--untracked-files=no` を追加しただけ。

- 追加した文字列に**変数展開・コマンド置換・外部入力を含まない**
- 既存の変数参照（`$MAIN`）はいずれも `"..."` で引用されており、変更で引用が外れた箇所は無い
- `bash -n` による構文検査を通過

`skills/enso-policy/SKILL.md` に追加したコマンド例（`git add .claude/enso.json .gitignore`）も**固定パスのみ**で、ユーザー入力を展開する箇所が無い。ブランチ名 `chore/enso-policy-init` も固定文字列。

| IPA 出典 | |
|---|---|
| document | 安全なウェブサイトの作り方 改訂第7版 |
| section | 1.2 OSコマンド・インジェクション |
| page | 13-15 |
| url | https://www.ipa.go.jp/security/vuln/websecurity/about.html |

### 3. ディレクトリトラバーサル（SWS 1.3）

追加したファイル操作は `.claude/enso.json` と `.gitignore` の**固定2パス**のみ。外部入力からパスを組み立てる処理は無い。

| IPA 出典 | |
|---|---|
| document | 安全なウェブサイトの作り方 改訂第7版 |
| section | 1.3 パス名パラメータの未チェック／ディレクトリ・トラバーサル |
| page | 16-18 |

### 4. アクセス制御・認可（SWS 1.11 / CL）

**本変更はアクセス制御を弱めない。** むしろ2点強化している（下記「セキュリティ上の改善」）。

## セキュリティ上の改善（本変更による）

### 改善1: 個人設定の巻き込みを明示的に禁止

`SKILL.md` の新規 Step 6-3 で、`git add` の対象を `.claude/enso.json` と `.gitignore` の2つに限定し、**`.claude/` をディレクトリごと add することを明文で禁止**した。

これが無いと `.claude/settings.local.json`（`.gitignore` 済みの個人設定。API キーや環境固有の値を含みうる）を誤ってコミットする経路が残る。実装時にもこの制約を守り、追跡下に入ったのは `enso.json` のみであることを確認済み（`git ls-files .claude/` の出力が1件）。

### 改善2: ガード設定の変更がレビュー対象になる

`.claude/enso.json` が追跡下に入ったことで、`protectedBranches` からの `main` 除外や `enabled: false` への変更といった**セキュリティガードの弱体化が差分として可視化される**。従来は未追跡だったため、ローカルで黙って緩められた。

あわせて Issue #12 の影響2（リポジトリ外に worktree を作ると `loadPolicy` の上方向探索が届かず**強制モードが無言で無効になる**）も解消される。追跡下にあれば worktree にチェックアウトされるため、探索の偶然に依存しなくなる。

## 検討したが問題なしと判断した点

### `--untracked-files=no` によるデータ損失リスク

未コミット判定から未追跡ファイルを除外することで、警告されずに破壊的操作へ進む経路が生まれないかを検証した。**問題なし。**

判定の後に続く操作は `fetch` / ff-only `pull` / `branch -d` / `push --delete` で、**いずれも未追跡ファイルを消さない**。

一方、未追跡ファイルを失わせる操作は `git worktree remove` だが、**その直前の判定（123行目）は変更していない**（`--porcelain` のまま未追跡を含めて検出し、該当する worktree は skip する）。2箇所を区別して片方だけ変更したのは意図的で、コード上のコメントにも理由を残した。

### `init` が push / PR 作成を行うこと

`init` が外部（リモートリポジトリ）へ働きかける動作を持つようになった。ただし:

- ユーザーが `/enso:enso-policy init` を明示的に起動したときのみ実行される
- push 先はカレントリポジトリの `origin`、PR の base は `enforce.baseBranch`（既定 `main`）に限定される
- 対象ブランチは新規作成した `chore/enso-policy-init` で、既存ブランチへ直接 push しない
- リモートが無い / `gh` 未認証の場合は PR を作らずコミットで止まる

**任意のリモートへ任意の内容を送る経路にはなっていない。**

## 残存リスク（スコープ外・記録のみ）

`enable` / `disable` は追跡下のファイルを書き換えるため、実行すると作業ツリーに差分が出る。これを気付かずコミットすると、**チーム全員のガード設定が意図せず変更される**（例: `enabled: false` の混入）。

深刻度は Low（コミット・レビューという人間の関門を挟むため）。今回は `MANUAL.md` に注意書きを追加して可視化したが、仕組みでの防止は行っていない。対処するなら別 Issue で、`disable` 実行時に警告を出す1行を足すのが最小の手当てとなる。

| IPA 出典 | |
|---|---|
| document | セキュリティ実装チェックリスト（安全なウェブサイトの作り方 改訂第7版） |
| section | 設定管理 |
| page | 105-108 |

## 結論

**`gh pr ready` を妨げる脆弱性は検出されなかった。** 本変更はセキュリティを弱めず、上記2点でむしろ強化している。
