# Plan: readme-usage-flows

## Requirements Summary

README.md の「クイックスタート」節（119〜183行目）を全面的に書き直す。

- 見出しの「クイックスタート」は内容（インストール手順ではなく、目的別にどのスキルをどの順で呼ぶか）と合わないので、**「使い方の流れ」** に変える
- 人が呼ぶスキル14個（dev-init / dev-plan / dev-loop / dev-cleanup / dev-screen-spec / dev-webtest / feature-rubber-duck / edgecase-analysis / enso-issue-report / enso-issue-fix / enso-policy / enso-tidy / rev-docs / uat-test-design）が**すべてどこかのフローに登場**し、実行順が分かるようにする
- 「入口 → dev-plan → 実装承認 → dev-loop → dev-cleanup（マージ確認）」という共通の骨格と、入口ごとの違いが一目で分かるようにする
- 分析・テスト系（edgecase-analysis / dev-screen-spec / dev-webtest / uat-test-design）がどのタイミングで入るかを書く
- enso-policy はプロジェクト導入時に一度行う任意の準備として位置づける

制約:

- 記載は各 `skills/*/SKILL.md` の実際の挙動と一致させる。内部スキルを人が呼ぶかのような記述（現行の「`dev-debug` が修正します」）を残さない
- 現行の重複（ループ開発／新規プロジェクト／既存プロジェクトの3節が同じ dev-plan → dev-loop を繰り返す）を整理する
- README のスキル一覧（正本）は変更しない
- Markdown のみの変更

## Design Overview

### 節の構成（🔵 既存の README・MANUAL の書式に合わせる）

```
## 使い方の流れ
  （導入文: 全体図 + 「（内部）は自動で動く」注記 + MANUAL へのリンク）
  ### 全体像            ← ASCII 図。入口 → dev-plan →【実装承認】→ dev-loop →（自動）→ dev-cleanup【マージ確認】
  ### 導入時に一度だけ（任意）  ← enso-policy init / 新規なら dev-init
  ### 基本の開発サイクル       ← dev-plan → 承認 → dev-loop → dev-cleanup（コマンド例1つ）
  ### 入口の選び方            ← 表: 始める状況 | 実行順 | 補足
  ### 分析・テストを入れるタイミング ← 表 + webtest の流れのコマンド例
```

位置は現行と同じ（スキル一覧の後）にする。節を移動すると差分が大きくなり、他ドキュメントからのアンカーにも影響するため。

### 各スキルの位置づけ（SKILL.md で確認した挙動）

| スキル | 書く内容 | 根拠 |
|---|---|---|
| `enso-policy` | 導入時に `init` を一度。任意 | enso-policy SKILL.md（`init/show/enable/disable`） 🔵 |
| `dev-init` | 新規プロジェクトの入口。技術スタックを決めて context.md を作り、dev-plan へ | dev-init SKILL.md:17, 143 🔵 |
| `dev-plan` | 骨格の起点。worktree・Draft PR を作り、実装承認ゲートで止まる | dev-plan Phase 5e 🔵 |
| `dev-loop` | 実装承認で起動（「確認した」でも可）。実装→検証→PR ready | dev-loop SKILL.md:16 🔵 |
| `dev-cleanup` | dev-loop から**確認なしで自動で引き継がれる**。手動で呼ぶのはマージ確認で「いいえ」を選んだ後と、PR を作らない構成（`pr_number: null`）のとき。中断した計画（`status: failed`）は対象外（修正サイクル1で訂正） | dev-loop SKILL.md:161-172、dev-cleanup SKILL.md:16-20, 58-67 🔵 |
| `feature-rubber-duck` | アイデアが曖昧なときの入口。PRD を `dev-plan <plan-name> <PRDパス>` に渡す | feature-rubber-duck SKILL.md:27 🔵 |
| `enso-issue-report` → `enso-issue-fix` | enso 自体の問題の入口。fix が dev-plan を内部で実行し Draft PR で停止 → 承認 → dev-loop | enso-issue-fix SKILL.md:9, 33 🔵 |
| `rev-docs` | 既存コードを把握したいときの入口。`docs/spec/` 等を生成し、足りないテストは dev-plan へ | rev-docs SKILL.md:18, 106 🔵 |
| `enso-tidy` | 整頓の入口。削除 PR は dev-cleanup へ、直す指摘は dev-plan へ引き継ぐ | enso-tidy SKILL.md:21-22 🔵 |
| `edgecase-analysis` | dev-plan（Full-spec）の後・実装承認の前、または rev-docs の後。同じ要件名で呼ぶ。結果は受入基準・webtest 計画へ反映 | edgecase-analysis SKILL.md:18-22, 45-56 🔵 |
| `dev-screen-spec` | 実装後にソースから生成・差分更新。Full-spec の受入基準があれば `from-plan` で実装前にも作れる | dev-screen-spec SKILL.md:20-35 🔵 |
| `dev-webtest` | 画面仕様の後に実行。引数なしで起動しテスト計画が0件なら dev-plan の計画から内部で作る（`<plan-name>` 指定時は作成済みの計画を実行）。URL 指定の `monkey` / `check` もある（修正サイクル1で訂正） | dev-webtest SKILL.md:17-25, 127-138 🔵 |
| webtest の問題の修正 | 修正は dev-plan → dev-loop で行い、`dev-webtest retest` で修正済みに更新する | 強制モードではコードの変更は dev-plan 経由が必須。内部スキル dev-debug を人が呼ぶ形にしない 🟡 |
| `uat-test-design` | 受入試験・リリース前に、任意のタイミングで試験項目一覧を作る | uat-test-design SKILL.md 🔵 |

### 削る記述

- 3つの開発フロー節の重複 → 「基本の開発サイクル」1つにまとめる
- `/enso:dev-cleanup payment` を毎回手で打つ例 → 自動で引き継がれることを書き、手動で呼ぶ場面だけ補足する
- 「`dev-debug` が修正します」 → 上表の修正の流れに置き換える

## Task Dependency Graph

```
001 README「使い方の流れ」節の書き直し
```

| ID | タイトル | 複雑度 | 依存 |
|---|---|---|---|
| 001 | README の「クイックスタート」を「使い方の流れ」に書き直す | low | - |

## Cross-Plan Dependencies

なし

## 範囲外で見つかった別件（Issue 候補）

- `skills/dev-webtest/SKILL.md`（前提知識・Step 7）と MANUAL.md（Dev Skills のワークフロー図・dev-debug の実行方法）が、webtest の問題の修正を `dev-debug webtest` として案内している。dev-debug は dev-run からだけ呼ばれる内部スキルで、強制モードではコードの変更に dev-plan 経由が必要なので、2層構造と食い違う
- MANUAL.md の「ワークフロー例」（mermaid）が古い。dev-context を入口にしていて、dev-run / dev-impl を人が直接呼ぶ流れになっており、dev-loop / dev-cleanup が無い
- edgecase-analysis Step 1 は受入基準を `docs/dev/plans/{要件名}/acceptance-criteria.md` だけから探すので、rev-docs の出力（`docs/spec/{要件名}/acceptance-criteria.md`）を読まない
