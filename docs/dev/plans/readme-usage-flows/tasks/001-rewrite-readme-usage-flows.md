---
id: "001"
title: "README の「クイックスタート」を「使い方の流れ」に書き直す"
status: done
priority: 1
dependencies: []
estimated_complexity: low
---

# Task: README の「クイックスタート」を「使い方の流れ」に書き直す

## Goal

README.md の「## クイックスタート」節（現行 119〜183行目）を「## 使い方の流れ」に置き換える。人が呼ぶスキル14個すべての実行順と入るタイミングが一目で分かり、記述が各 SKILL.md の挙動と一致している状態にする。

## Interfaces

```text
## 使い方の流れ                     節の位置は現行と同じ（スキル一覧の後、詳細ドキュメントの前）   🔵
  導入文                            （内部）スキルは自動で動くこと、詳細は MANUAL.md へのリンク       🔵
  ### 全体像                        ASCII 図（コードブロック）                                        🔵
  ### 導入時に一度だけ（任意）       enso-policy init / 新規プロジェクトは dev-init                    🔵
  ### 基本の開発サイクル             dev-plan →【実装承認】→ dev-loop →（自動）→ dev-cleanup【マージ確認】 🔵
  ### 入口の選び方                   表: 始める状況 | 実行順 | 補足                                    🔵
  ### 分析・テストを入れるタイミング  表: スキル | いつ | 前後のつながり + webtest のコマンド例         🔵
```

全体像の図（目安）:

```text
[導入時に一度だけ・任意] enso-policy init

入口（状況に合わせて1つ）                         共通の開発サイクル
  要件が固まっている ─────────────────────┐
  アイデアが曖昧 ── feature-rubber-duck ──┤
  新規プロジェクト ─ dev-init ────────────┼─→ dev-plan ─【実装承認】→ dev-loop ─(自動)→ dev-cleanup【マージ確認】
  既存コードの把握 ─ rev-docs ────────────┤      │
  enso 自体の問題 ── enso-issue-report → enso-issue-fix ─(dev-plan を内部実行)
  整頓 ──────────── enso-tidy ──（直す指摘）┘ （削除 PR は dev-cleanup へ）
```

入口の表に書く行（実行順）:

| 始める状況 | 実行順 |
|---|---|
| 要件が固まっている | `dev-plan` → 承認 → `dev-loop` → `dev-cleanup` |
| アイデアがまだ曖昧 | `feature-rubber-duck` → `dev-plan <plan-name> <PRDパス>` → 以降同じ |
| 新規プロジェクト | `dev-init` → `dev-plan` → 以降同じ |
| 既存コードを把握してから進めたい | `rev-docs` →（`edgecase-analysis`）→ `dev-plan` → 以降同じ |
| enso 自体に問題を見つけた | `enso-issue-report` → `enso-issue-fix <N>`（dev-plan を内部実行して Draft PR で停止）→ 承認 → `dev-loop` → `dev-cleanup` |
| 蓄積ファイルやドキュメントを整頓したい | `enso-tidy` → 削除 PR は `dev-cleanup` / 直す指摘は `dev-plan` → 以降同じ |

分析・テストの表に書く行:

| スキル | いつ | つながり |
|---|---|---|
| `edgecase-analysis` | dev-plan（Full-spec）の後・実装承認の前、または rev-docs の後 | 同じ要件名で呼ぶと要件定義書を読む。結果を受入基準・webtest 計画に反映する |
| `dev-screen-spec` | 実装の後（受入基準があれば `from-plan` で実装前も可） | 画面仕様の差分が webtest 計画の差分更新に使われる |
| `dev-webtest` | 画面仕様の後 | 引数なしで起動しテスト計画が0件のときだけ内部で作る（`<plan-name>` 指定時は作成済みの計画を実行）。問題は `docs/dev/webtests/errors/` に記録 → 修正は dev-plan → dev-loop → `dev-webtest retest` |
| `uat-test-design` | 受入試験・リリース前（任意） | 仕様・テストを名寄せして試験項目一覧を `docs/uat/` に作る |

## Test Strategy

- [ ] 見出し「クイックスタート」が README.md に残っていない（`grep -n クイックスタート README.md` が0件）
- [ ] 人が呼ぶスキル14個それぞれの名前が「## 使い方の流れ」節の中に1回以上出る（節を切り出して14個を grep で数える）
- [ ] 節の中で内部スキル（dev-context / dev-impl / dev-run / dev-verify / dev-debug / dev-webtest-plan / ipa-security-check / task-breakdown）を `/enso:` 付きのコマンドとして書いていない
- [ ] 「dev-debug が修正」の記述が無い
- [ ] dev-cleanup は dev-loop から自動で引き継がれると書き、手動で呼ぶのは「マージ確認でいいえを選んだ後」「PR を作らない構成のとき」と書き、中断した計画（`status: failed`）は対象外と書いている（dev-loop SKILL.md:161-172、dev-cleanup SKILL.md:58-67 と一致。修正サイクル1で訂正）
- [ ] 各フローの記述が上の「各スキルの位置づけ」（plan.md）の根拠行と矛盾しない（引数の形、`from-plan`、`retest`、`monkey`/`check`、PRD パスを渡すこと）
- [ ] ループ開発／新規／既存の3節の重複が無くなり、dev-plan → dev-loop のコマンド例が1箇所だけにある
- [ ] README の「スキル一覧」節（人が呼ぶスキル／内部スキルの表）に差分が無い（`git diff` で確認）
- [ ] MANUAL.md へのリンクのアンカーが実在する見出しを指している
- [ ] `pnpm secretlint` / `pnpm check` が通る

## Implementation Notes

- 図はコードブロックの ASCII にする（MANUAL の Dev Skills・Issue 連携のワークフロー図と揃える）。mermaid は使わない
- コマンド例は `/enso:` 付きで書く（README の既存の注意書きに合わせる）
- 強制モードに触れる箇所は、既存の「強制モード（任意）」節へのリンクで済ませ、内容を繰り返さない
- 範囲外の別件（dev-webtest SKILL.md と MANUAL の dev-debug 案内、MANUAL のワークフロー例の古さ、edgecase-analysis が rev-docs の受入基準を読まない件）は直さない。plan.md に記録済み

## Files

- 変更: README.md
