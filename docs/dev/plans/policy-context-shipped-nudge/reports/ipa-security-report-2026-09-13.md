# IPA セキュリティチェックレポート: policy-context-shipped-nudge

**実行日**: 2026-09-13
**ブランチ**: worktree-policy-context-shipped-nudge
**PR**: https://github.com/yukimnb/enso/pull/32
**スコープ**: `main...HEAD` の差分

## 結論

**medium 1件 / low 3件（critical・high なし）。**

**4件すべて既存コードの性質に由来し、今回の差分が新規に作った脆弱性はありません。** ただし medium 1件は今回の変更が同じ経路を1つ増やしているため、対応方針の判断が必要です。

## スコープ解決の結果

| ファイル | 種別 | 検査対象 |
|---|---|---|
| `hooks/lib/policy.mjs` | JavaScript | **対象** |
| `hooks/policy-context.mjs` | JavaScript | **対象** |
| `MANUAL.md` / `skills/enso-policy/SKILL.md` | Markdown | 対象外 |
| `docs/dev/plans/policy-context-shipped-nudge/**` | Markdown / YAML（計画成果物） | 対象外 |

前回の Plan（`analysis-skills-consolidation`）と違い、**今回は対応言語のソースを含みます**。

### 起動したエージェント

Node の CLI hook であり、HTTP レスポンス・HTML 出力・SQL・メール送信・セッションを持たないため、構造的に該当しないカテゴリ（SQLi / XSS / CSRF / HTTP ヘッダ / メールヘッダ / クリックジャッキング / バッファオーバーフロー / 安全な SQL / ウェブ健康診断）は起動していません。関係しうる4観点に絞りました。

| 観点 | 結果 |
|---|---|
| OS コマンドインジェクション（SWS 1.2） | 検出なし |
| ディレクトリトラバーサル（SWS 1.3） | 検出なし |
| アクセス制御の不備（SWS 1.11） | 検出なし |
| 運用20ヶ条 + 実装チェックリスト（OPS / CL） | **4件検出** |

## 検出結果

### 1. loop-state.yaml の値を無検証で注入文へ埋め込む（medium）

**rule_id**: `OPS-CTX-INJECTION-UNESCAPED-PLAN-METADATA`
**file**: `hooks/policy-context.mjs:55`（`describeState`）、`:103-106`（`nextActions`）
**category**: information_leak / 間接プロンプトインジェクション
**cwe**: CWE-74

`loop-state.yaml` から正規表現で抜いた `plan_name` / `status` / `pr_url` を、検証もエスケープもせず `<enso-enforcement>` ブロック内へ毎ターン注入している。

`loop-state.yaml` は**リポジトリに commit される追跡ファイル**であり、クローンした他人のリポジトリや受け取った PR で持ち込まれうる。値に `</enso-enforcement>` や改行＋指示文を仕込むと、hook が「システム由来の信頼できる文脈」として提示する領域に任意の指示を混ぜられる。注入内容が標準出力そのものであるため、出力側でのフィルタも効かない。

**IPA 出典**: 安全なウェブサイトの作り方 改訂第7版 別冊「セキュリティ実装チェックリスト」／入力値の検証・外部から受け取ったデータの出力時の無害化／p.105-108
https://www.ipa.go.jp/security/vuln/websecurity.html

**今回の差分との関係**: `describeState:55` は**変更していない既存コード**で、同じ無検証注入を以前から行っている。今回追加した `nextActions` の `names` が同じ経路を1つ増やした。**新規の脆弱性ではないが、増やした側に回っている。**

**推奨対応（根本的解決）**: `findLoopStates()` で各フィールドに書式制約をかける（`plan_name` / `status` は `/^[\w.-]{1,64}$/`、`pr_url` は `https://github.com/` で始まる URL のみ許可し、不適合なら値を捨てて `plan_dir` にフォールバック）。あわせて注入前に改行と `<` `>` を除去し、1フィールドあたりの長さを切り詰める。

<!-- ipa-triage:begin
rule_id: OPS-CTX-INJECTION-UNESCAPED-PLAN-METADATA
status: 未対応
note: 対応方針の判断が必要（本 PR で直す / 別 Issue に切る）
ipa-triage:end -->

### 2. enso.json の型を検証していない（low）

**rule_id**: `OPS-HOOK-CONFIG-TYPE-UNVALIDATED`
**file**: `hooks/policy-context.mjs:147`
**cwe**: CWE-20

`.claude/enso.json` の `enforce.skills` / `enforce.protectedBranches` が配列以外（文字列・数値・オブジェクト）だと `?? []` は効かず `.map` / `.join` で TypeError になる。`runHook()` が握り潰すので **exit 0 は守られる**が、注入文が丸ごと消え、hook が無効なのか設定が無いのか利用者から区別できない「静かな失効」になる。`resolveEnforce()` は JSON の型を検証せずスプレッドでマージしている。

**IPA 出典**: 安全なウェブサイトの運用管理に向けての20ヶ条／設定ファイル・運用設定の妥当性確認・異常時に安全側に倒す／p.105-108（別冊チェックリスト）

**今回の差分との関係**: 既存コード。今回の変更は無関係。

<!-- ipa-triage:begin
rule_id: OPS-HOOK-CONFIG-TYPE-UNVALIDATED
status: 未対応
note: 既存コードの堅牢性。別 Issue 候補
ipa-triage:end -->

### 3. loop-state.yaml の読み込みにサイズ上限が無い（low）

**rule_id**: `OPS-LOOPSTATE-READ-UNBOUNDED`
**file**: `hooks/lib/policy.mjs:212`
**cwe**: CWE-400

`docs/dev/plans` 直下の全ディレクトリの `loop-state.yaml` を、サイズ上限なしで毎プロンプト読み、フィールドごとに `RegExp` を新規コンパイルして走査する。壊れた YAML では単に一致しないだけで安全、巨大ファイルや 2GB 超は `readFileSync` が throw して try/catch で skip されるため **exit 0 も守られる**。ただし数百MB級のファイルや計画ディレクトリの累積では、毎ターンのプロンプト送信に読み込み遅延が乗る。**正規表現自体は遅延量指定と行アンカーのみで ReDoS 経路は無い。**

**IPA 出典**: 安全なウェブサイトの運用管理に向けての20ヶ条／サービス停止につながる資源消費の抑制／p.105-108（別冊チェックリスト）

**今回の差分との関係**: 既存コード。**ただしこのリポジトリは既に計画が17件あり、累積は現実的な懸念。**

<!-- ipa-triage:begin
rule_id: OPS-LOOPSTATE-READ-UNBOUNDED
status: 未対応
note: 保険的対策。別 Issue 候補
ipa-triage:end -->

### 4. gitState の分割代入が未検査（low）

**rule_id**: `OPS-GITSTATE-DESTRUCTURE-UNCHECKED`
**file**: `hooks/lib/policy.mjs:125`
**cwe**: CWE-754

`git rev-parse` の出力が想定の4行に満たない場合（バージョン差・部分的な出力）、`gitDir` / `gitCommonDir` が `undefined` のまま `resolve()` に渡り TypeError になる。`topLevel` の有無だけを確認しており、この2値は検査していない。`runHook()` が拾うので **exit 0 は守られる**が、注入文が失われる。

**IPA 出典**: 安全なウェブサイトの作り方 改訂第7版 別冊「セキュリティ実装チェックリスト」／エラー処理・異常系での安全な動作／p.105-108

**今回の差分との関係**: 既存コード。今回追加した `hasLiveWorktree()` の呼び出し経路上にあるが、原因は無関係。

<!-- ipa-triage:begin
rule_id: OPS-GITSTATE-DESTRUCTURE-UNCHECKED
status: 未対応
note: 保険的対策。別 Issue 候補
ipa-triage:end -->

## 今回の変更そのものの評価

4観点の検査で、追加した `hasLiveWorktree()` と `nextActions()` について次が確認された。

| 確認事項 | 結果 |
|---|---|
| コマンド実行への経路 | **無い。** `existsSync` の戻り値の boolean のみが分岐に使われる |
| パス操作の危険性 | **無い。** 読み取り専用の存在確認で、パスも存在情報も外部に出力されない |
| 既存ガード（deny 判定）への副作用 | **無い。** `hasLiveWorktree` は `guard-bash.mjs` / `guard-edit.mjs` から import も呼び出しもされない |
| 例外を投げる経路 | **無い。** `typeof` 判定で非文字列を弾き、`existsSync` は全エラーを false に畳む。`runHook()` の catch と `process.exit(0)` が二重の保険 |
| 依存パッケージの追加 | **無い。** `package.json` / `pnpm-lock.yaml` に差分ゼロ、新規 import も `node:fs` の既存利用のみ |
| 秘密情報の新規露出 | **無い。** 出力は計画名・status・PR URL・（間接的に）worktree の存在有無に限られる |

また、`matchesGlob()` が realpath を取らないためプロジェクト内のシンボリックリンク経由で `guard-edit` を迂回しうる点が副産物として指摘されたが、**ローカルエージェント向けの運用ガードであり信頼境界ではない**ため脆弱性として扱わない、との判定だった。

## 判断が必要な事項

**finding 1（medium・間接プロンプトインジェクション）の対応方針。**

| 選択肢 | 内容 |
|---|---|
| 本 PR で直す | `findLoopStates()` に書式制約を加える。スコープは広がるが、今回触った経路の問題を残さない |
| 別 Issue に切る | 既存コードの問題なので独立した PR で扱う。本 PR は誘導文の修正に集中する |

low 3件はいずれも既存コードの堅牢性の話で、`exit 0` は守られることが確認済み。別 Issue 候補とする。
