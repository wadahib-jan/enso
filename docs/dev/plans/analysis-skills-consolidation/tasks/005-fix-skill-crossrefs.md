---
id: "005"
title: "他スキルから削除スキルへの参照を外す"
status: done
priority: 3
dependencies: []
estimated_complexity: medium
---

# Task: 他スキルから削除スキルへの参照を外す

## Goal

残るスキル4本が削除対象のスキルを参照している箇所を修正する。`feature-rubber-duck:103` は**実行できないコマンドをユーザーに提示している**ため、ここが最も影響が大きい。

## Interfaces

変更箇所:

```
skills/feature-rubber-duck/SKILL.md:103
  完了時の案内コードブロック内の「先に影響範囲を確認する場合:
  /enso:impact-analysis <対象>」を削除。PRD を dev-plan に渡す案内のみ残す        🔵

skills/dev-debug/references/test-timeouts.md:5
  「アプリケーション本体の性能問題は performance-analysis スキルの領分で、
  ここでは扱わない」→ スキル名への依存を外し、扱う範囲の線引きだけ残す           🔵

skills/enso-issue-fix/SKILL.md:112, 114, 115, 116, 119
  bug-analysis への経路を設けない理由の説明。タスク004（MANUAL:943-952）と
  同趣旨のため、言い回しを揃えて整理する                                          🟡
skills/enso-issue-fix/SKILL.md:316
  ルール「bug-analysis を呼び出さない」→ スキルが無いので前提が消える。
  「深い原因分析はユーザーに委ねる」という結論だけ残す                            🟡
skills/enso-issue-fix/SKILL.md:334
  スキル対比表の bug-analysis 行を削除                                            🔵
skills/enso-issue-fix/references/plan-request-template.md:91
  「分析レポートを渡す仕組みは持たない」の記述。前後の文脈を確認して調整         🟡

skills/enso-issue-report/SKILL.md:46
  対象外の表「利用中プロジェクトのコードのバグ | bug-analysis の担当」
  → 担当先の記述を差し替える                                                      🔵
skills/enso-issue-report/SKILL.md:185
  同趣旨の注意事項                                                                🔵
skills/enso-issue-report/SKILL.md:197
  スキル対比表の bug-analysis 行を削除                                            🔵
```

> 信号機: 🔵 は削除または単純な差し替えで済む。🟡 は「経路を設けない」という判断自体は維持したまま、根拠となるスキルが存在しない状態へ書き換える必要があり、文章の裁量がある

## Test Strategy

- [ ] `grep -rn "impact-analysis\|bug-analysis\|performance-analysis\|sequence-diagram-analysis\|state-transition-analysis" skills/` が 0 件を返す
- [ ] `feature-rubber-duck` の完了時案内に、実行できないコマンドが含まれていない
- [ ] `enso-issue-fix` が「enso の Issue で深い原因分析の経路を持たない」という結論を維持している
- [ ] `enso-issue-report` の「利用中プロジェクトのコードの問題は対象外」という結論が維持され、差し替えた担当先が実在する
- [ ] `dev-debug` の `test-timeouts.md` が「テスト実行の問題とアプリ本体の性能問題は別」という線引きを保っている
- [ ] エッジケース: `skills/edgecase-analysis/SKILL.md` の「他スキルとの違い」節が削除スキルを参照していないこと（現状は `rev-docs` / `uat-test-design` / `dev-webtest-plan` のみを参照しているため変更不要の見込み。実装時に再確認する）

## Implementation Notes

- 参照すべき既存コード: 上記の各ファイル該当行、タスク004 で書いた `MANUAL.md` の文面
- 実装のヒント: `enso-issue-fix` と `MANUAL.md` は同じ判断を2箇所に書いているので、先にどちらかの文面を確定させてもう一方に合わせる
- 注意事項: 「経路を設けない」という判断は**維持する**。スキルが消えたからといって Issue から原因分析へ自動で繋ぐ設計に変えてはいけない

## Files

- 変更: `skills/feature-rubber-duck/SKILL.md`
- 変更: `skills/dev-debug/references/test-timeouts.md`
- 変更: `skills/enso-issue-fix/SKILL.md`
- 変更: `skills/enso-issue-fix/references/plan-request-template.md`
- 変更: `skills/enso-issue-report/SKILL.md`
