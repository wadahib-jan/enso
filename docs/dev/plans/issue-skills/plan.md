# Plan: issue-skills

## Requirements Summary

enso 本体に Issue ベースの開発フローを追加する。新規スキルを2つ作成する。

### enso-issue-report（Issue を起票する）

enso の仕組み（スキル定義・hooks・コマンド・ドキュメント）に問題を見つけたときに、`yukimnb/enso` へ GitHub Issue を作成する。

- 投稿先は **`yukimnb/enso` 固定**（`gh issue create --repo yukimnb/enso`）。他プロジェクトで作業中に enso の不具合に気づいても、その場で報告できることが要件
- 対話で症状・再現手順・該当スキル/hook・期待動作・実際の動作・環境情報を収集する
- 作成前に重複候補を検索し、既存 Issue があれば提示してユーザーに判断を委ねる
- ラベルは既存の `bug` / `enhancement` / `documentation` から付与する（`gh label list` で確認済み）
- 作成後に番号と URL を表示し、`enso-issue-fix` への導線を示す

### enso-issue-fix（Issue を1件取り込んで修正する）

Issue 番号を1件指定して取得し、修正完了まで進める。

- 引数: `<issue-number>`。フラグは持たない
- **コードベースの調査を行わない。** 責務は「Issue を `dev-plan` が使える要件に翻訳すること」だけ。調査は `dev-plan` Phase 2 に一本化する
- Issue が名指ししているファイルの実在確認のみ行い、調査の出発点として `dev-plan` に渡す
- `dev-plan`（Lightweight 固定）に渡す
- `dev-plan` が Draft PR を作った時点で停止する。実装は人間の承認後に `dev-loop` が引き継ぐ（既存フローを踏襲し、承認点を省略しない）
- PR 本文に `Closes #<番号>` を含め、Issue と PR を紐付ける

### 将来の並列化に向けた不変条件

将来的に複数 Issue を選択してマルチエージェントで並列稼働させる。そのため本計画では次を**不変条件**として設計に固定する。

- **1 Issue = 1 plan = 1 worktree = 1 PR**
- `enso-issue-fix` は「1件を処理するワーカー」。対話が必要な部分と、引数と状態ファイルだけで完結する部分を明確に分離する
- 上位にオーケストレータを載せるだけで並列化できる構造にする（**オーケストレータ自体は本計画のスコープ外**）

### スコープ外

- 複数 Issue の並列オーケストレータ
- Issue のトリアージ・自動ラベリング
- enso 以外のリポジトリへの Issue 起票（`enso-issue-report` は enso 固定）

## Design Overview

### スキル間の位置づけ

```
[enso の不具合に気づく]
        ↓
   enso-issue-report          ← 起票（yukimnb/enso 固定）
        ↓ Issue #N
   enso-issue-fix <N>         ← Issue を要件に翻訳する（調査はしない）
        ↓ 要件 + 実在確認済みの該当箇所
     dev-plan            ← Phase 2 で調査 → worktree + Draft PR + loop-state.yaml
        ↓
  【停止】人間が Draft PR を確認
        ↓ 承認
     dev-loop            ← 実装 → 検証 → PR ready
        ↓
   Closes #N でクローズ
```

### 調査の一本化 🔵

当初は Issue のラベルと本文から経路を自動判定し、`bug` かつ該当ファイルが特定できない場合に `bug-analysis` を経由する設計だった。レビューで**この経路を完全に削除**した。

| 削除の根拠 | |
|---|---|
| 調査の重複 | `dev-plan` Phase 2 は Plan サブエージェントで「既存コードの調査 / データフロー整理 / 依存関係の特定」を行う。`bug-analysis` Step 2〜4 とほぼ同じ作業であり、経路Aを通すと同じコードベースを2回調べる |
| 出口の不一致 | `bug-analysis` は「修正は dev-debug の担当」と明言している。計画を立てずに直接修正する経路の前処理であり、`dev-plan` 経由が必須の enso では前提が成立しない |
| 分量の不釣り合い | `bug-analysis` の references は4ファイル計 1,620 行、生成物も4ファイル（各最大500行）。enso の Issue の実態に対して過剰 |
| 需要の少なさ | enso の Issue はスキル定義（Markdown）の記述の問題・ドキュメントとの食い違い・改善要望が中心で、該当ファイルを読めば足りる |

**副次的な効果**: `bug-analysis` を非対話で呼ぶという指示（呼び出し先スキルの「Step 3 に進む前にユーザーの承認を得る」というルールを外から上書きしようとしていた）も同時に不要になった。

`enso-issue-fix` が行うのは**該当箇所の実在確認だけ**とする。Issue 本文から `skills/**` / `hooks/**` / `commands/**` / `scripts/**` / `*.md` のパスを抜き出し、`test -f` で確かめて `dev-plan` に渡す。Grep / Glob による探索は行わない。

深い原因分析が必要な Issue では、ユーザーが `bug-analysis` を単独で実行してから `enso-issue-fix` を起動する。呼び出す仕組みは持たない。

### 承認点の扱い 🔵

**`enso-issue-fix` は Draft PR を作った時点で停止する。** `dev-plan` → 人間の承認 → `dev-loop` という既存フローをそのまま踏襲し、`enso-issue-fix` のために例外を作らない。

当初は「Issue の存在をもって承認とみなす」自動継続を採用したが、レビューで次の2点から差し戻した。

1. **Issue 本文が計画に翻訳された結果を、人間が一度は見る。** 一度も見ないまま実装・push まで進むと、Issue 本文に混ぜられた指示がそのまま成果物になりうる。セキュリティチェックの指摘3（`ipa-security-report.md`）の残存リスクは、この承認点によって実質的に解消される
   - **【後日訂正】** 当初は「`yukimnb/enso` は公開リポジトリなので Issue は誰でも書ける」を根拠にしていたが、実際は private であり事実に反していた。脅威度は記載より低い。ただし防御の層として承認点は維持する（詳細は `reports/ipa-security-report.md` 冒頭の追記）
2. **Issue の記述は要件として粗い。** 症状の記述から起こした計画が Issue の意図とずれることは珍しくない。ずれに気づくのが PR 完成後だと手戻りが大きい

承認点は並列化の妨げにならない。並列に走るのは「Issue の取り込みから Draft PR まで」であり対話を含まない。人間は複数の Draft PR をまとめて確認し、承認したものだけ `dev-loop` に流す。

### 該当箇所の裏付け 🔵

`enso-issue-fix` は Issue 本文から抜き出したパスを `test -f` で確かめるだけにとどめる。実在すれば「確認済みの該当箇所」、実在しなければ「パスが古い可能性」、記載が無ければ「Phase 2 で特定する」として `dev-plan` に渡す。**このステップで中断しない** — 該当箇所が分からないことは正常であり、計画を立てられない理由にはならない。

### 並列化のための分離 🔵

`enso-issue-fix` のワークフローを次の2種類に分類し、スキル本文に表として明記する。

| 区分 | 該当ステップ |
|---|---|
| 対話が必要 | 引数なしで起動したときの Issue 選択、Issue が closed / 既に PR あり のときの続行確認 |
| 引数と状態ファイルだけで完結 | Issue 取得・plan-name 確定・該当箇所の裏付け・dev-plan・Issue へのコメント |

オーケストレータが満たすべき前提（同一 Issue の重複割当禁止、plan-name / worktree 名の一意性、同時実行数の上限）も併記する。

## Task Dependency Graph

```
001 enso-issue-report スキルの作成
002 enso-issue-fix スキルの作成
        ↓
003 dev-navigate への統合（001, 002 に依存）
004 README.md / MANUAL.md の更新（001, 002 に依存）
        ↓
005 品質ゲートとマニフェスト検証（001-004 に依存）
```

001 と 002 は互いに独立。

## Cross-Plan Dependencies

なし。既存スキル（`dev-plan` / `dev-loop`）の**呼び出し側**としてのみ依存し、これらのファイルは変更しない。`bug-analysis` には依存しない。
