# Plan: skill-index

## Requirements Summary

enso のスキル一覧を **README を正本として一本化**し、全スキルを Entry（人が呼ぶスキル）/ Internal（内部スキル）の2層に分類して一覧化する。

現状の問題:

1. **一覧の正本が2箇所に割れている。** `task-breakdown` / `uat-test-design` / `ipa-security-check` / `ipa-security-guide` の4件は MANUAL.md にしか載っておらず、README は全スキル一覧になっていない
2. **2層区分が Dev Skills 節の中にしかない。** MANUAL.md の「人が呼ぶスキル」(`:194`) / 「内部スキル」(`:399`) は Dev 配下限定で、分析・Issue・汎用・セキュリティのスキルはどちらの層か判別できない
3. **ジャンル区分が README と MANUAL で不一致。** README は Dev/分析/Issue/ユーティリティ/リバエン、MANUAL は Dev/分析/Issue/リバエン/汎用/セキュリティ
4. **宣言と実態がずれた呼び出し元記述がある。** `dev-context` の description は `dev-verify` を呼び出し元に挙げるが実際は呼んでいない。`dev-webtest-plan` は CLAUDE.md 上 `dev-plan` からも呼ばれる扱いだが、実際に内部実行するのは `dev-webtest` だけ
5. **`ipa-security-guide` がどこからも呼ばれていない。** description は「`ipa-security-check` の後段として呼ばれる内部スキル」と宣言するが、`ipa-security-check` は guide を起動しない

要件:

- README に「人が呼ぶスキル」「内部スキル」の2表を新設し、全スキルをどちらかに収める。ジャンル列で見分けられるようにし、内部スキルには呼び出し元列を持たせる
- 既存のジャンル別の表（分析スキル・Issue 連携・ユーティリティ・リバースエンジニアリング）は統合一覧へ置き換える
- 各行から MANUAL.md の該当セクションへアンカーリンクを張る
- MANUAL.md のジャンル別一覧表（「汎用スキル」「セキュリティチェックスキル」）を削除し、MANUAL は詳細解説に専念させる
- `ipa-security-guide` を削除する
- `uat-test-design` を Entry として整備する（description をトリガー語付き書式へ）
- 呼び出し元記述を実態に合わせ、CLAUDE.md の Internal 一覧も同期する

**Markdown とスキルのフロントマターのみの変更で、hooks・スクリプトの挙動は変えない。**

## Design Overview

### 分類の確定（削除後 26 スキル）

`skills/*/SKILL.md` の記述を grep で追跡し、「呼び出し元が内部実行するもの」を Internal、それ以外を Entry とした。**「引き継ぎ先として案内するだけ」は呼び出しに数えない**（例: `bug-analysis` は `dev-debug` を案内するが起動しない）。

#### Entry: 18 件

| ジャンル | スキル |
|---|---|
| Dev | `dev-init` / `dev-plan` / `dev-loop` / `dev-cleanup` / `dev-screen-spec` / `dev-webtest` |
| 分析 | `feature-rubber-duck` / `sequence-diagram-analysis` / `state-transition-analysis` / `edgecase-analysis` / `impact-analysis` / `bug-analysis` / `performance-analysis` |
| Issue | `enso-issue-report` / `enso-issue-fix` |
| ユーティリティ | `enso-policy` |
| リバースエンジニアリング | `rev-docs` |
| テスト設計 | `uat-test-design`（本 Plan で Entry 化） |

#### Internal: 8 件

| スキル | ジャンル | 呼び出し元（実測） |
|---|---|---|
| `dev-context` | Dev | `dev-plan` / `dev-impl` / `dev-run` / `dev-screen-spec` / `dev-webtest-plan` |
| `dev-impl` | Dev | `dev-run` |
| `dev-run` | Dev | `dev-loop` |
| `dev-verify` | Dev | `dev-run` / `dev-loop` |
| `dev-debug` | Dev | `dev-run` |
| `dev-webtest-plan` | Dev | `dev-webtest` |
| `ipa-security-check` | セキュリティ | `dev-loop` |
| `task-breakdown` | 汎用 | `dev-plan`（インライン適用） |

実測の根拠（主なもの）:

- `dev-run` は `dev-impl` / `dev-verify` / `dev-debug` をオーケストレーションする（`skills/dev-run/SKILL.md:3`）
- `dev-loop` が直接起動するのは `dev-run`（Step 4）・`dev-verify`（Step 6）・`ipa-security-check`（Step 8）で、`dev-impl` / `dev-debug` は起動しない（`skills/dev-loop/SKILL.md:62,92,118`）
- `dev-webtest` はテスト計画が無いとき `dev-webtest-plan` を内部実行する（`skills/dev-webtest/SKILL.md:166`）
- `dev-plan` は `dev-webtest-plan` を呼ばない。`dev-screen-spec` は「`/dev-webtest-plan` でテスト計画を生成」と案内するだけ（`skills/dev-screen-spec/SKILL.md:228,467`）
- `enso-issue-fix` の `dev-run` / `ipa-security-check` 記述は、承認後に `dev-loop` が行う流れの説明（`skills/enso-issue-fix/SKILL.md:280`）

### ipa-security-guide を削除する根拠

1. **どこからも呼ばれていない。** `ipa-security-check` の SKILL.md は guide を起動しない。`dev-loop` / `enso-issue-fix` も同様
2. **受け取り先が無い。** 現行フローに脆弱性を「直す」工程が存在しない。`dev-loop` Step 8 はレポートを出力し PR コメントに載せて終わる（`skills/dev-loop/SKILL.md:118`）。guide の出力（dev-debug 依頼リスト）を消費するステップが無い
3. **機能が重複している。** guide の「対応不要候補リスト」と「優先順位付け」は、`ipa-security-check` が持つ偽陽性レビュー専用サブエージェント（`agents/15-false-positive-review.md`）とトリアージ4ステータス・severity と重なる

残る固有価値は「findings を dev-debug 依頼フォーマットへ変換する」ことだけで、これは検出後に自動修正まで回す設計に舵を切る場合にのみ意味を持つ。現時点でその意思がないため削除する。

### uat-test-design を Entry 化する根拠

description がトリガー語書式でも Internal 書式でもないため、**現状どちらの層にも属さず自動発火しない**。references 5本と `scripts/inventory.sh` を持つ実働スキルで単体で完結するため、Entry として整備する。

### README / MANUAL の棲み分け

| ドキュメント | 役割 |
|---|---|
| README.md | インストール・**全スキルの統合一覧（正本）**・クイックスタート |
| MANUAL.md | 各スキルの詳細解説。一覧表は持たない |

README の一覧から MANUAL の該当セクションへアンカーリンクを張り、「どちらを直すべきか」が一意に決まる状態にする。

### アンカーリンクの方針

MANUAL.md の見出しは `#### 1. dev-init` のように連番付きで、GitHub のアンカーは `#1-dev-init` になる。**連番は既存のまま維持し、リンク先を実際の見出しに合わせる**（連番の除去は本 Plan のスコープ外）。`enso-policy` には専用セクションが無いため `#強制モード` を指す。

## Task Dependency Graph

```
001 (ipa-security-guide 削除)
  └─ 002 (uat-test-design を Entry 化)
       └─ 003 (呼び出し元記述の実態同期 + CLAUDE.md)
            └─ 004 (README 統合一覧)
                 └─ 005 (MANUAL のジャンル別一覧表を削除)
```

スキル構成を確定（001-003）させてから、それを写す一覧（004-005）を書く順序にしている。逆順だと一覧を二度書き直すことになる。

## Cross-Plan Dependencies

なし。
