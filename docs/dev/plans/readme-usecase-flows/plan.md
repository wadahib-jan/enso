# Plan: readme-usecase-flows

## Requirements Summary

README.md の「### dev-plan に進むまでのパターン」は、すべてのパターンが `dev-plan` に合流する前提で書かれている。しかし実際には `dev-plan` に合流しないスキルがある（`uat-test-design`・`edgecase-analysis`・`dev-screen-spec`）。また、前のスキルが作ったファイルが次のスキルの入力になる依存があるのに、表からは読み取れない。

そこで節を **ユースケース別**に組み直し、各行を「スキル → 作られるファイル → それを使う次のスキル」の順で書く。`dev-plan` に合流しないユースケースも同じ表に載せる。

スコープ外: 「### 基本のサイクル」、「## 詳細ドキュメント」、README の他の節、MANUAL.md、スキル定義。

## Design Overview

`### dev-plan に進むまでのパターン` の見出しと表を、`### ユースケース別の流れ` と10行の表に置き換える。表の後に補足を2つ置く。

表に書くファイルパスは、各スキルの実際の出力先と、それを読む側を調べた結果に基づく。

| 前のスキルの出力 | それを読むもの |
|---|---|
| `docs/dev/analysis/<dir>/prd.md`（feature-rubber-duck） | `dev-plan` の第2引数 |
| `docs/dev/context.md`（dev-init） | dev-* 全般。無ければ `dev-context` が自動生成 |
| `docs/spec/{要件名}/requirements.md`（rev-docs） | `edgecase-analysis` |
| `docs/spec/**`（rev-docs） | `uat-test-design` |
| `docs/dev/plans/{名}/requirements.md`（dev-plan Full-spec） | `edgecase-analysis` |
| `docs/dev/plans/{名}/acceptance-criteria.md`（dev-plan Full-spec） | `dev-screen-spec from-plan` |
| `docs/dev/plans/{名}/`（dev-plan） | `dev-webtest-plan` の新規生成 |
| `docs/dev/screen-specs/`（dev-screen-spec） | `dev-webtest-plan update` の差分更新 |
| `check_list.md`（edgecase-analysis） | 読むスキルは無い。人が選んで `dev-plan` へ |
| `docs/uat/<yyyymmdd>/`（uat-test-design） | 読むスキルは無い。人が試験を実施 |
| `rev-docs` の出力 | `dev-plan` は読まない（コードを別途調査する） |

## Task Dependency Graph

```text
001 README の使い方の流れをユースケース別に書き直す
```

## Cross-Plan Dependencies

なし（直前の計画 readme-compact-flows が作った節を差し替える）
