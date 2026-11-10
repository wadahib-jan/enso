# Plan: readme-compact-flows

## Requirements Summary

README.md の「使い方の流れ」（約90行）は、全体像・導入時の設定・基本サイクル・入口の選び方・分析/テストのタイミングが重複していて長すぎる。スキルの詳細は MANUAL.md にあるので、README には次の2つだけを最低限残す。

- **基本のサイクル**: `dev-plan` →【実装承認】→ `dev-loop` →（自動）→ `dev-cleanup`【マージ確認】
- **dev-plan に進むまでのパターン**: 新規開発・既存プロジェクトへの導入・アイデア・分析・テスト・enso の問題・整頓

既存プロジェクトへの導入では、いきなり `dev-plan` ではなく `rev-docs` を先に推奨する。

スコープ外: README の他の節、MANUAL.md、スキル定義。

## Design Overview

「## 使い方の流れ」節（「## 詳細ドキュメント」の直前まで）を丸ごと置き換える。節見出しは変えない。

- `### 基本のサイクル`: text の図（3行 + 矢印）と、承認ゲートが2箇所であることを1文で書き、MANUAL.md#承認ゲート一覧 にリンクする
- `### dev-plan に進むまでのパターン`: 表「パターン | dev-plan までの流れ」を8行

削除するもの: 全体像の図、「導入時に一度だけ」、コマンド例、dev-cleanup を手で呼ぶ条件、入口の選び方の表、分析・テストのタイミング表（どれも MANUAL.md か README の他の節にある）。「各スキルの詳細は MANUAL.md」の案内はスキル一覧に既にあるので書かない。

この節へのアンカーリンクは他のファイルに無い（grep で確認済み）。

## Task Dependency Graph

```text
001 README の「使い方の流れ」をコンパクトにする
```

## Cross-Plan Dependencies

なし
