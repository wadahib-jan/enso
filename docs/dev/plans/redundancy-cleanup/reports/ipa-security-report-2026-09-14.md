# IPA セキュリティチェック レポート

**実行日時**: 2026-09-14T12:48:57Z
**スコープ**: --diff main（main との差分のうち対応言語: hooks/guard-bash.mjs, hooks/lib/policy.mjs, hooks/policy-context.mjs, scripts/setup-git-hooks.mjs, docs/dev/plans/redundancy-cleanup/loop-state.yaml。.mjs は JavaScript として扱った。Markdown・JSON・シェルスクリプトは対応言語外）
**スキャン対象**: 5 ファイル

## サマリ (対応待ち / 対応中のみ)

| 重大度 | 件数 |
|---|---|
| Critical | 0 |
| High     | 0 |
| Medium   | 2 |
| Low      | 2 |
| Info     | 0 |
| **合計** | **4** |

参考件数:

| 区分 | 件数 |
|---|---|
| 偽陽性候補 (本文外) | 0 |
| トリアージ済み 問題なし | 0 |
| トリアージ済み 保留 | 0 |

## ステータス凡例

| ステータス | 意味 |
|---|---|
| `未対応` | 未着手 (デフォルト) |
| `対応する` | 修正予定 / 実施中 |
| `問題なし` | 確認の上、本物の脆弱性ではない / 受容可能 |
| `保留` | 一旦保留 |

## 出典

このレポートは以下の IPA 公開資料に基づいています:

- 安全なウェブサイトの作り方 改訂第7版
- 安全な SQL の呼び出し方
- ウェブ健康診断仕様
- セキュリティ実装チェックリスト
- 安全なウェブサイトの運用管理に向けての20ヶ条

公式: https://www.ipa.go.jp/security/vuln/websecurity/about.html

---

## 検出結果

### access_control

#### [MEDIUM] IPA-SWS-11-AC-002 — コマンドの分割が `&&` `||` `;` `|` 改行のみで、各ルール（今回追加した早期 return を含む）は区切ったセグメントの先頭トークンが厳密に …

<!-- ipa-triage:begin
status: 未対応
snippet_hash: sha256:68e3bab1530e33dd
triaged_at: -
triaged_by: -
note: -
ipa-triage:end -->

**Status**: 未対応

- **File**: `hooks/guard-bash.mjs:29:3`
- **Category**: access_control (CWE-863)
- **IPA**: [安全なウェブサイトの作り方 改訂第7版 1.11 アクセス制御や認可制御の欠落 (p.45-47)](https://www.ipa.go.jp/security/vuln/websecurity/access-control.html)
- **Remediation Type**: 根本的解決
- **Remediation**: 判定前にセグメントを正規化する（単独の `&`・括弧・バッククォート・`$(` でも分割、先頭の `VAR=value` と `command` / `env` / `sudo` 等のラッパーを除去、basename 化、引用符除去、`bash -c` の引数は再帰的に判定）。早期 return とマッチャーは共通の正規化関数を通して条件を一致させる。

**メッセージ**:

> コマンドの分割が `&&` `||` `;` `|` 改行のみで、各ルール（今回追加した早期 return を含む）は区切ったセグメントの先頭トークンが厳密に `git` / `gh` かだけを見ている。早期 return 自体は matchesGitCommand / matchesGhCommand と同じ条件なので新たな迂回は増えていないが、`FOO=1 git push`、`(git push)`、`true & git push`、`command git push`、`/usr/bin/git push`、`bash -c "git push"` などは worktree / 保護ブランチ・セキュリティ・マージ承認・削除確認の各ゲートをすべて通過する。

**問題箇所**:

```php
return command.split(/&&|\|\||[;|\n]/).map((segment) => segment.trim()).filter(Boolean);
```

**修正例**:

```php
const WRAPPERS = new Set(["command", "env", "sudo", "exec", "nohup", "time"]);
function segments(command) {
  return command.split(/&&|\|\||[;|&\n()`]|\$\(/).map((s) => s.trim()).filter(Boolean);
}
```

#### [MEDIUM] IPA-SWS-11-AC-002 — オプションの解析が不完全。tokens() はフラグだけを捨てて値を残すため、`gh -R owner/repo pr merge 27` のようにサブコマンド…

<!-- ipa-triage:begin
status: 未対応
snippet_hash: sha256:1550f2a80fb4d7ee
triaged_at: -
triaged_by: -
note: -
ipa-triage:end -->

**Status**: 未対応

- **File**: `hooks/guard-bash.mjs:48:1`
- **Category**: access_control (CWE-863)
- **IPA**: [安全なウェブサイトの作り方 改訂第7版 1.11 アクセス制御や認可制御の欠落 (p.45-47)](https://www.ipa.go.jp/security/vuln/websecurity/access-control.html)
- **Remediation Type**: 根本的解決
- **Remediation**: 値を取るオプション（gh: -R/--repo、git: -C/-c/--git-dir/--work-tree 等）はフラグと値を組で除去してからサブコマンド位置を判定する。mergeTarget はオプション除去後の最初の被演算子を対象にし、git の動詞位置の固定上限は外す。

**メッセージ**:

> オプションの解析が不完全。tokens() はフラグだけを捨てて値を残すため、`gh -R owner/repo pr merge 27` のようにサブコマンド前にグローバルオプションがあるとゲートに当たらない。`gh pr merge -R owner/repo 27` では mergeTarget が `owner/repo` をブランチ名と誤認して deny ではなく ask になる。matchesGitCommand は動詞の位置を index <= 2 に限定しているため `git -c a=b -c c=d -C path commit` も commit / push のゲートを外れる。

**問題箇所**:

```php
function matchesGhCommand(segment, sub) { const parts = tokens(segment); return parts[0] === "gh" && parts[1] === "pr" && parts[2] === sub; }
```

**修正例**:

```php
const GH_VALUE_FLAGS = new Set(["-R", "--repo"]);
function operands(words, valueFlags) {
  const out = [];
  for (let i = 0; i < words.length; i++) {
    if (valueFlags.has(words[i])) { i++; continue; }
    if (words[i].startsWith("-")) continue;
    out.push(words[i]);
  }
  return out;
}
```

#### [LOW] IPA-SWS-11-AC-003 — `gh pr ready` のセキュリティゲートが対象 PR の計画に紐付いていない。docs/dev/plans/*/reports/ のいずれかに名前に `…

<!-- ipa-triage:begin
status: 未対応
snippet_hash: sha256:7e4ed972bc95e890
triaged_at: -
triaged_by: -
note: -
ipa-triage:end -->

**Status**: 未対応

- **File**: `hooks/guard-bash.mjs:193:1`
- **Category**: access_control (CWE-863)
- **IPA**: [安全なウェブサイトの作り方 改訂第7版 1.11 アクセス制御や認可制御の欠落 (p.45-47)](https://www.ipa.go.jp/security/vuln/websecurity/access-control.html)
- **Remediation Type**: 根本的解決
- **Remediation**: `gh pr ready` の対象 PR（引数または現在のブランチ）を findLoopStateForPr で解決し、その計画の reports/ だけを確認する。計画が見つからなければ ask にする。

**メッセージ**:

> `gh pr ready` のセキュリティゲートが対象 PR の計画に紐付いていない。docs/dev/plans/*/reports/ のいずれかに名前に `security` を含むファイルがあれば通過するため、過去の計画にレポートがあれば、ipa-security-check を実行していない新しい計画の PR も ready にできる。

**問題箇所**:

```php
function hasSecurityReport(projectRoot) { const states = findLoopStates(projectRoot); ... return dirs.some((dir) => { ... readdirSync(dir).some((name) => /security/i.test(name)); }); }
```

**修正例**:

```php
function hasSecurityReport(projectRoot, { prNumber, branch }) {
  const state = findLoopStateForPr(projectRoot, { prNumber, branch });
  if (!state) return false;
  const dir = join(projectRoot, "docs", "dev", "plans", state.plan_dir, "reports");
  try { return readdirSync(dir).some((name) => /security/i.test(name)); } catch { return false; }
}
```

### directory_traversal

#### [LOW] IPA-SWS-1-TRAV-008 — relativeToRoot() は path.resolve / path.relative による文字列上の正規化だけで、realpath によるシンボリッ…

<!-- ipa-triage:begin
status: 未対応
snippet_hash: sha256:6a2e701a6c7e41b1
triaged_at: -
triaged_by: -
note: -
ipa-triage:end -->

**Status**: 未対応

- **File**: `hooks/lib/policy.mjs:173:15`
- **Category**: directory_traversal (CWE-22)
- **IPA**: [安全なウェブサイトの作り方 改訂第7版 1.3 パス名パラメータの未チェック／ディレクトリ・トラバーサル (p.16-18)](https://www.ipa.go.jp/security/vuln/websecurity/parameter.html)
- **Remediation Type**: 根本的解決
- **Remediation**: fs.realpathSync で実パスに正規化してから基準ディレクトリで始まるかを確認する。対象ファイルが未作成なら親ディレクトリを realpath して確認する。

**メッセージ**:

> relativeToRoot() は path.resolve / path.relative による文字列上の正規化だけで、realpath によるシンボリックリンク解決を行わない。projectRoot 配下にある、外部を指すシンボリックリンク経由のパスは root 内の相対パスとして扱われ、ALWAYS_ALLOWED や除外パターン（docs/dev/** 等）に一致すれば編集ガードを通過する。入力は hook の stdin の file_path で、ガードは外部攻撃者に対する境界ではなく開発ポリシーの強制なので影響は限定的。

**問題箇所**:

```php
const absolute = isAbsolute(filePath) ? filePath : resolve(projectRoot, filePath);
const rel = relative(projectRoot, absolute);
if (!rel || rel.startsWith("..") || isAbsolute(rel)) return null;
```

**修正例**:

```php
const root = realpathSync(projectRoot);
let real;
try { real = realpathSync(resolve(root, filePath)); }
catch { real = join(realpathSync(dirname(resolve(root, filePath))), basename(filePath)); }
const rel = relative(root, real);
```


---

## 偽陽性候補

`15-false-positive-review` エージェントが**周辺コードと呼び出し元を再評価**して、偽陽性の疑いがあると判定した finding です。
本文の検出結果には計上していません。判定が誤りと思うものはステータスを `対応する` に変更すると次回スキャンで通常レポートに戻ります。

_(該当なし)_

---

## トリアージ済み (抑止)

ステータスが `問題なし` または `保留` の finding です。サマリ件数からも除外しています。

_(該当なし)_

---



## このレポートの読み方

- **severity**: IPA 原文の重大度を基準に Critical/High/Medium/Low/Info に正規化
- **remediation_type**: IPA 用語の「根本的解決」「保険的対策」を区別
- **rule_id**: `IPA-<doc>-<chapter>-<vuln>-<seq>` 形式 (例: `IPA-SWS-1-SQLI-001` = 安全なウェブサイトの作り方 1.1 SQLi の 1番目)
- 各 finding には IPA 原典 (文書名・章・ページ・URL) を明記

## トリアージの使い方

各 finding 直下の `<!-- ipa-triage:begin ... ipa-triage:end -->` ブロックを編集します。

```
<!-- ipa-triage:begin
status: 問題なし
snippet_hash: sha256:1a2b3c4d5e6f7890
triaged_at: 2026-05-15T10:00:00Z
triaged_by: alice
note: テストフィクスチャ用のダミー値で外部入力経路なし
ipa-triage:end -->
```

- 利用できる `status` 値: `未対応` / `対応する` / `問題なし` / `保留`
- `note` は自由記述 (複数行可)
- 次回 `/ipa-security-check` 実行時、同一の `snippet_hash` を持つ finding にステータスが引き継がれます
- `問題なし` / `保留` にした finding は次回以降「トリアージ済み (抑止)」セクションへ移動し、本文の検出結果やサマリから外れます
- `snippet_hash` 行は書き換えないでください (一致判定が壊れます)

## 誤検知のインライン抑止 (補助)

ソース側で個別に抑止したい場合は、問題箇所の直前行に以下を置きます:

```
// ipa-skip: IPA-SWS-1-SQLI-001  reason: 内部固定値を埋め込んでいるため
```

`reason:` は必須です。インライン抑止は検出段階で finding 自体が生成されないため、トリアージとは別軸の仕組みです。
