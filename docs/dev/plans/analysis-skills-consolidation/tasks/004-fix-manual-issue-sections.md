---
id: "004"
title: "MANUAL の Issue 連携節から bug-analysis 前提の記述を外す"
status: done
priority: 3
dependencies: []
estimated_complexity: medium
---

# Task: MANUAL の Issue 連携節から bug-analysis 前提の記述を外す

## Goal

`MANUAL.md` の `## Issue 連携` 節には、`bug-analysis` が存在する前提の記述が残っている。特に 943-952 行は「なぜ `bug-analysis` への経路を削除したか」という設計判断の記録であり、単純な名前の置換では意味が通らなくなる。**判断の記録としての価値を保ちつつ、存在しないスキルへの案内を消す**のがこのタスクの要点。

## Interfaces

変更箇所:

```
MANUAL.md:943      「以前は bug ラベルの Issue を bug-analysis に通す経路がありました
                   が、削除しました」→ スキル自体が無くなったことを踏まえた記述へ      🟡
MANUAL.md:947-949  経路削除の4理由の表。bug-analysis の固有名に依存している             🟡
MANUAL.md:952      「/enso:bug-analysis を単独で実行してレポートを読んでから
                   enso-issue-fix を起動してください」→ 実行できないため差し替え必須   🔵
MANUAL.md:985      enso-issue-report の対象外説明。「症状だけあるなら bug-analysis」
                   の案内を外す                                                        🔵
```

記述方針（🟡 の判断）:

- 947-949 の4理由は**今回の削除判断の根拠そのもの**（`plan.md` の削除根拠に引用している）。表を消すのではなく、「この4点は経路だけでなくスキル自体に当てはまったため、スキルを削除した」という結論に接続する
- 952 の代替案内は「素の依頼で調査を頼む」または「`dev-debug` に渡す」に差し替える

> 信号機: 🔵 は差し替えが必須と確定。🟡 は文章の書き方に裁量があり、実装時に前後の文脈を読んで決める

## Test Strategy

- [ ] `grep -n "bug-analysis" MANUAL.md` が 0 件を返す
- [ ] 943-952 行相当の箇所が、存在しないスキルへの実行案内を含まない
- [ ] 経路を設けなかった理由（調査の重複 / 出口の不一致 / 分量の不釣り合い / 需要の少なさ）が読み取れる形で残っている
- [ ] 985 行相当の箇所で「利用中プロジェクトのコードの問題は対象外」という結論が維持されている
- [ ] エッジケース: 差し替え後の案内先（`dev-debug` / 素の依頼）が実在し、実行可能である

## Implementation Notes

- 参照すべき既存コード: `MANUAL.md:930-995`、`docs/dev/plans/issue-skills/plan.md:64-77`（この判断の元になった Plan）
- 実装のヒント: タスク005で `skills/enso-issue-fix/SKILL.md:112-119` の同趣旨の記述も直す。**両者で結論が食い違わないように同じ言い回しに揃える**
- 注意事項: 過去 Plan（`docs/dev/plans/issue-skills/`）は履歴なので触らない

## Files

- 変更: `MANUAL.md`
