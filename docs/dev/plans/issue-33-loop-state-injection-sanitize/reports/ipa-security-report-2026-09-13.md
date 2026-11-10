# IPA セキュリティチェック レポート

**実行日時**: 2026-09-13T13:25:41Z
**スコープ**: PR #34 の差分（hooks/lib/policy.mjs）。カテゴリ: OSコマンド/トラバーサル/XSS(出力の無害化)/HTTPヘッダ/アクセス制御/運用チェックリスト/ウェブ健康診断。SQL・セッション・CSRF・メールヘッダ・クリックジャッキング・BoF は該当コード無しのため対象外。アクセス制御は Q1 変更後に再検査し、差分由来の指摘（マージガードの deny→ask 弱化）の解消を確認済み
**スキャン対象**: 1 ファイル

## サマリ (対応待ち / 対応中のみ)

| 重大度 | 件数 |
|---|---|
| Critical | 0 |
| High     | 0 |
| Medium   | 4 |
| Low      | 2 |
| Info     | 0 |
| **合計** | **6** |

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

#### [MEDIUM] IPA-SWS-11-AC-002 — [既存コード・PR #34 の差分外] hasSecurityReport は、いずれかの計画の reports/ に名前に 'security' を含むファイ…

<!-- ipa-triage:begin
status: 未対応
snippet_hash: sha256:9f24f199300b200c
triaged_at: -
triaged_by: -
note: -
ipa-triage:end -->

**Status**: 未対応

- **File**: `hooks/guard-bash.mjs:193:1`
- **Category**: access_control (CWE-863)
- **IPA**: [安全なウェブサイトの作り方 改訂第7版 1.11 アクセス制御や認可制御の欠落 (p.45-47)](https://www.ipa.go.jp/security/vuln/websecurity/access-control.html)
- **Remediation Type**: 根本的解決
- **Remediation**: gh pr ready の PR 番号またはブランチ（省略時は現在のブランチ）から findLoopStateForPr で対象の計画を特定し、その計画の reports/ だけを見る。計画が見つからなければ、マージゲートと同様に enforce.mode または ask で判定する

**メッセージ**:

> [既存コード・PR #34 の差分外] hasSecurityReport は、いずれかの計画の reports/ に名前に 'security' を含むファイルがあれば gh pr ready を通す。その計画が ready にしようとしている PR のものかは確かめていない。そのため別の計画や shipped 済みの計画のセキュリティレポートで、検査していない PR でも enforce.security のゲートを満たせてしまう。本 PR（Q1 変更後）は、書式不一致のディレクトリ名の計画も一覧に残す＝PR 前と同じ挙動なので、新たな経路は加えていない。

**問題箇所**:

```php
function hasSecurityReport(projectRoot) {
  const states = findLoopStates(projectRoot);
```

**修正例**:

```php
const state = findLoopStateForPr(root, { prNumber, branch: branch ?? git?.branch });
if (!state) return false;
const dir = join(root, 'docs', 'dev', 'plans', state.plan_dir, 'reports');
return existsSync(dir) && readdirSync(dir).some((n) => /security/i.test(n));
```

#### [MEDIUM] IPA-SWS-11-AC-003 — [既存コード・PR #34 の差分外] findLoopStateForPr は pr_number、次に branch で loop-state を探し、re…

<!-- ipa-triage:begin
status: 未対応
snippet_hash: sha256:57f71be3011eba3b
triaged_at: -
triaged_by: -
note: -
ipa-triage:end -->

**Status**: 未対応

- **File**: `hooks/lib/policy.mjs:314:3`
- **Category**: access_control (CWE-639)
- **IPA**: [安全なウェブサイトの作り方 改訂第7版 1.11 アクセス制御や認可制御の欠落 (p.45-47)](https://www.ipa.go.jp/security/vuln/websecurity/access-control.html)
- **Remediation Type**: 根本的解決
- **Remediation**: loop-state と PR の対応を、ファイルの中身だけでは偽れない形で確かめる（例: gh pr view --json headRefName,number で対象 PR の head ブランチを取得し、pr_number と branch の両方の一致を要求する）。複数一致は失敗（null または deny）として扱い、PR 番号が指定されたときはブランチだけのフォールバックを使わない

**メッセージ**:

> [既存コード・PR #34 の差分外] findLoopStateForPr は pr_number、次に branch で loop-state を探し、readdirSync 順で最初に一致したものを返す。その計画が本当にその PR のものかは確かめていない。どちらのキーも git 追跡下の loop-state.yaml に書かれた値で第三者が書け、branch は書式検証が無く、同じ pr_number を持つ計画の重複も禁じていない。そのため別の計画（または同名ブランチの古い計画）がその PR 番号やブランチを名乗り、自分の新しい merge_approved_at を持ち込めば、guard-bash.mjs:294-301 で approvalStatus=ok となり gh pr merge のマージゲートを通過できる。PR 番号が指定された場合でもブランチ一致へフォールバックする。本 PR はこの問題を良くも悪くもしていない。

**問題箇所**:

```php
if (branch) {
    const hit = states.find((state) => state.branch === branch);
    if (hit) return hit;
  }
```

**修正例**:

```php
const matches = states.filter((s) => String(s.pr_number ?? '') === wanted && (!branch || s.branch === branch));
if (matches.length !== 1) return null; // 一致なし・曖昧なら安全側で判定する
```

### xss

#### [MEDIUM] IPA-SWS-5-XSS-001 — [既存コード・PR #34 の差分外] .claude/enso.json（git 追跡下）の enforce.skills の各要素を、検証もエスケープもせず…

<!-- ipa-triage:begin
status: 未対応
snippet_hash: sha256:6b95e29a953404db
triaged_at: -
triaged_by: -
note: -
ipa-triage:end -->

**Status**: 未対応

- **File**: `hooks/policy-context.mjs:35:10`
- **Category**: xss (CWE-74)
- **IPA**: [安全なウェブサイトの作り方 改訂第7版 1.5 クロスサイト・スクリプティング (p.26-32)](https://www.ipa.go.jp/security/vuln/websecurity/cross-site-scripting.html)
- **Remediation Type**: 根本的解決
- **Remediation**: resolveEnforce() で enforce.skills の各要素を文字列かつ SAFE_TOKEN に一致するものだけに絞る。判定を policy.mjs の1箇所にまとめるため、出力側ではなくここで絞る

**メッセージ**:

> [既存コード・PR #34 の差分外] .claude/enso.json（git 追跡下）の enforce.skills の各要素を、検証もエスケープもせずに <enso-enforcement> ブロックへ埋め込んでいる（policy-context.mjs:147 の describeSkills(enforce.skills ?? []) → L35）。要素に "x\n</enso-enforcement>\n<任意の指示>" のような値を置くとブロックを途中で閉じ、信頼されたシステム文脈として指示を差し込める。Issue #33 の修正対象は loop-state.yaml に限られ、同じ出力先に届く enso.json は未対策。なお PR #34 の差分自体は十分と評価: 出力に使われる plan_name / status / pr_url は完全一致で検証され、未検証の branch / worktree / pr_number / 承認時刻は比較・existsSync・Date.parse にしか使われず出力に流れない。

**問題箇所**:

```php
`- ${skill}: ${SKILL_ROLES[skill] ?? "（このプロジェクトで必須のスキル）"}`,
```

**修正例**:

```php
const skills = (Array.isArray(parsed?.enforce?.skills) ? parsed.enforce.skills : DEFAULT_ENFORCE.skills)
  .filter((s) => typeof s === "string" && SAFE_TOKEN.test(s));
```

#### [MEDIUM] IPA-SWS-5-XSS-001 — [既存コード・PR #34 の差分外] .claude/enso.json（git 追跡下）の enforce.protectedBranches を、要素の型…

<!-- ipa-triage:begin
status: 未対応
snippet_hash: sha256:f676854e9ad482e0
triaged_at: -
triaged_by: -
note: -
ipa-triage:end -->

**Status**: 未対応

- **File**: `hooks/policy-context.mjs:158:7`
- **Category**: xss (CWE-74)
- **IPA**: [安全なウェブサイトの作り方 改訂第7版 1.5 クロスサイト・スクリプティング (p.26-32)](https://www.ipa.go.jp/security/vuln/websecurity/cross-site-scripting.html)
- **Remediation Type**: 根本的解決
- **Remediation**: resolveEnforce() で protectedBranches / baseBranch の文字列要素をブランチ名として安全な書式（例: /^[\w./-]{1,100}$/）で検証し、一致しない要素は捨てる。何も残らなければ既定値に戻す

**メッセージ**:

> [既存コード・PR #34 の差分外] .claude/enso.json（git 追跡下）の enforce.protectedBranches を、要素の型も書式も確かめずに join して <enso-enforcement> ブロックに入れている。要素に改行や '</enso-enforcement>' を含めるとタグを閉じて指示を差し込める。Issue #33 と同種で、修正が及んでいない出力箇所。

**問題箇所**:

```php
`制約: コードの変更・コミット・push・PR 作成は worktree の中でのみ許可されます（保護ブランチ: ${(enforce.protectedBranches ?? []).join(", ")}）。違反する操作は PreToolUse フックでブロックされます。`,
```

**修正例**:

```php
const BRANCH_NAME = /^[\w./-]{1,100}$/;
const protectedBranches = (parsed?.enforce?.protectedBranches ?? DEFAULT_ENFORCE.protectedBranches)
  .filter((b) => typeof b === "string" && BRANCH_NAME.test(b));
```

#### [LOW] IPA-SWS-5-XSS-001 — [既存コード・PR #34 の差分外] worktreeViolation() が git.branch をそのまま deny の理由文に入れている。この文は …

<!-- ipa-triage:begin
status: 未対応
snippet_hash: sha256:973aada7187e4845
triaged_at: -
triaged_by: -
note: -
ipa-triage:end -->

**Status**: 未対応

- **File**: `hooks/lib/policy.mjs:391:7`
- **Category**: xss (CWE-74)
- **IPA**: [安全なウェブサイトの作り方 改訂第7版 1.5 クロスサイト・スクリプティング (p.26-32)](https://www.ipa.go.jp/security/vuln/websecurity/cross-site-scripting.html)
- **Remediation Type**: 保険的対策
- **Remediation**: 表示用ブランチ名を安全な書式で検証する関数を policy.mjs に1つ用意し、policy-context.mjs と worktreeViolation() の両方で使う

**メッセージ**:

> [既存コード・PR #34 の差分外] worktreeViolation() が git.branch をそのまま deny の理由文に入れている。この文は guard-bash.mjs / guard-edit.mjs から emitDecision 経由で permissionDecisionReason に入り LLM に渡る。ブランチ名に '<' '>' を使えるため、出力前の無害化が欠けている。保護ブランチ上の場合は protectedBranches との一致が前提なので、実際に効くのは worktree 外の分岐の方。

**問題箇所**:

```php
? `保護ブランチ ${git.branch} 上での${action}`
```

**修正例**:

```php
export function displayBranch(branch) {
  if (branch == null) return "detached HEAD";
  return /^[\w./-]{1,100}$/.test(branch) ? branch : "（表示できないブランチ名）";
}
```

#### [LOW] IPA-SWS-5-XSS-001 — [既存コード・PR #34 の差分外] gitState().branch（git rev-parse --abbrev-ref HEAD の結果）を検証せずに…

<!-- ipa-triage:begin
status: 未対応
snippet_hash: sha256:746291d9a0b46c5c
triaged_at: -
triaged_by: -
note: -
ipa-triage:end -->

**Status**: 未対応

- **File**: `hooks/policy-context.mjs:43:7`
- **Category**: xss (CWE-74)
- **IPA**: [安全なウェブサイトの作り方 改訂第7版 1.5 クロスサイト・スクリプティング (p.26-32)](https://www.ipa.go.jp/security/vuln/websecurity/cross-site-scripting.html)
- **Remediation Type**: 保険的対策
- **Remediation**: 表示用のブランチ名が安全な書式に一致しないときは固定文字列に置き換える。保護ブランチとの比較には元の値を使い続ける

**メッセージ**:

> [既存コード・PR #34 の差分外] gitState().branch（git rev-parse --abbrev-ref HEAD の結果）を検証せずに <enso-enforcement> ブロックへ入れている。git のブランチ名には '<' '>' を使える（git check-ref-format --branch "x</enso-enforcement>ignore" が通る）ため、細工した名前のブランチ（フォーク PR を gh pr checkout した場合など）をチェックアウト中はタグを閉じて文を差し込める。空白・改行・':' は使えず差し込める内容が限られ、ユーザーがそのブランチに切り替える前提も要るため low。

**問題箇所**:

```php
`- 現在のブランチ: ${git.branch ?? "detached HEAD"}（worktree の${git.inWorktree ? "中" : "外"}）`,
```

**修正例**:

```php
const BRANCH_DISPLAY = /^[\w./-]{1,100}$/;
const label = git.branch == null ? "detached HEAD" : BRANCH_DISPLAY.test(git.branch) ? git.branch : "（表示できないブランチ名）";
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
