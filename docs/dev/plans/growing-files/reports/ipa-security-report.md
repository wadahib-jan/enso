# IPA セキュリティチェック レポート

**実行日時**: 2026-09-14T23:08:26Z
**スコープ**: main との差分のうち対応言語: hooks/guard-bash.mjs, hooks/policy-context.mjs, docs/dev/plans/growing-files/loop-state.yaml（.mjs は JavaScript として扱った。Markdown は対応言語外）。access-control は修正サイクル 1・2 のたびに再検査し、本レポートは最終コードに対する結果
**スキャン対象**: 3 ファイル

## サマリ (対応待ち / 対応中のみ)

| 重大度 | 件数 |
|---|---|
| Critical | 0 |
| High     | 0 |
| Medium   | 0 |
| Low      | 3 |
| Info     | 0 |
| **合計** | **3** |

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

#### [LOW] IPA-SWS-11-AC-003 — PR を URL で指定したとき、末尾の番号だけで計画を照合し owner/repo を見ない。別リポジトリの同じ番号の PR が、このリポジトリの計画のレポー…

<!-- ipa-triage:begin
status: 未対応
snippet_hash: sha256:e986a32ddb4c5300
triaged_at: -
triaged_by: -
note: -
ipa-triage:end -->

**Status**: 未対応

- **File**: `hooks/guard-bash.mjs:164:3`
- **Category**: access_control (CWE-639)
- **IPA**: [安全なウェブサイトの作り方 改訂第7版 1.11 アクセス制御や認可制御の欠落 (p.45-47)](https://www.ipa.go.jp/security/vuln/websecurity/access-control.html)
- **Remediation Type**: 根本的解決
- **Remediation**: URL で指定されたときは loop-state の pr_url と完全一致で照合し、一致しなければ未解決として扱う。

**メッセージ**:

> PR を URL で指定したとき、末尾の番号だけで計画を照合し owner/repo を見ない。別リポジトリの同じ番号の PR が、このリポジトリの計画のレポートや承認記録で ready / merge ゲートを通過し得る（merge 側に元からあった解析を ready と共有したもの。plan.md に記録済み）。

**問題箇所**:

```php
const asNumber = operand.match(/^(?:.*\/pull\/)?(\d+)$/);
```

**修正例**:

```php
if (/\/pull\//.test(operand)) return { prNumber: asNumber[1], prUrl: operand, branch: null };
// findLoopStateForPr で state.pr_url === prUrl も条件にする
```

#### [LOW] IPA-SWS-11-AC-002 — 対象 PR の計画（loop-state.yaml）が解決できない `gh pr ready` は deny ではなく ask になる。セキュリティチェック未実…

<!-- ipa-triage:begin
status: 未対応
snippet_hash: sha256:da7f7f2bfd50ec3d
triaged_at: -
triaged_by: -
note: -
ipa-triage:end -->

**Status**: 未対応

- **File**: `hooks/guard-bash.mjs:280:5`
- **Category**: access_control (CWE-862)
- **IPA**: [安全なウェブサイトの作り方 改訂第7版 1.11 アクセス制御や認可制御の欠落 (p.45-47)](https://www.ipa.go.jp/security/vuln/websecurity/access-control.html)
- **Remediation Type**: 保険的対策
- **Remediation**: 厳格にしたいプロジェクト向けに、未解決時の判定を enforce の設定で deny にできるようにする。

**メッセージ**:

> 対象 PR の計画（loop-state.yaml）が解決できない `gh pr ready` は deny ではなく ask になる。セキュリティチェック未実施のまま、人の確認1回で ready にできる。enso 外の PR を ready にできなくならないようにするための設計判断（plan.md に記録済み）。

**問題箇所**:

```php
if (!state) {
  unresolved = true;
  continue;
}
```

**修正例**:

```php
if (!state) {
  if (enforce.unresolvedReady === "deny") { emitDecision(enforce.mode, reason); return; }
  unresolved = true;
  continue;
}
```

#### [LOW] IPA-SWS-11-AC-002 — warn モードでは、レポートが無い ready の判定（warn）が即 return するため、同じコマンド内の、モードに関係なく出るはずの ask（対象計画…

<!-- ipa-triage:begin
status: 未対応
snippet_hash: sha256:f9b20e25f998e1c0
triaged_at: -
triaged_by: -
note: -
ipa-triage:end -->

**Status**: 未対応

- **File**: `hooks/guard-bash.mjs:284:5`
- **Category**: access_control (CWE-863)
- **IPA**: [安全なウェブサイトの作り方 改訂第7版 1.11 アクセス制御や認可制御の欠落 (p.45-47)](https://www.ipa.go.jp/security/vuln/websecurity/access-control.html)
- **Remediation Type**: 保険的対策
- **Remediation**: レポート無しの判定も decide(enforce.mode, reason) で出し、warn のときは保留中の ask と連結して ask に上げる。

**メッセージ**:

> warn モードでは、レポートが無い ready の判定（warn）が即 return するため、同じコマンド内の、モードに関係なく出るはずの ask（対象計画が解決できない ready、loop-state が見つからない merge）が出ずに warn だけで通る。例: warn モードで `gh pr ready 12 && gh pr ready 99999`（12 は計画あり・レポート無し）。deny / ask モードでは同じか強い判定を出すので弱まらない。

**問題箇所**:

```php
if (!hasSecurityReport(root, state)) {
  emitDecision(enforce.mode, [...].join("\n"));
  return;
}
```

**修正例**:

```php
if (!hasSecurityReport(root, state)) {
  if (enforce.mode === "warn") { asks.push(reason); continue; }
  emitDecision(enforce.mode, reason);
  return;
}
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
- 次回 `/enso:ipa-security-check` 実行時、同一の `snippet_hash` を持つ finding にステータスが引き継がれます
- `問題なし` / `保留` にした finding は次回以降「トリアージ済み (抑止)」セクションへ移動し、本文の検出結果やサマリから外れます
- `snippet_hash` 行は書き換えないでください (一致判定が壊れます)

## 誤検知のインライン抑止 (補助)

ソース側で個別に抑止したい場合は、問題箇所の直前行に以下を置きます:

```
// ipa-skip: IPA-SWS-1-SQLI-001  reason: 内部固定値を埋め込んでいるため
```

`reason:` は必須です。インライン抑止は検出段階で finding 自体が生成されないため、トリアージとは別軸の仕組みです。
