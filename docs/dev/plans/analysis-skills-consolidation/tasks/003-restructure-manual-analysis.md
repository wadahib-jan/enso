---
id: "003"
title: "MANUAL の分析スキル節を2節に再編する"
status: done
priority: 2
dependencies: []
estimated_complexity: medium
---

# Task: MANUAL の分析スキル節を2節に再編する

## Goal

`MANUAL.md` の `## 分析スキル`（588-864行）から削除した5スキルの記述を除き、`feature-rubber-duck` と `edgecase-analysis` の2節に番号を振り直す。節をまたぐ相互参照と共通節の記述も整合させる。

## Interfaces

変更箇所:

```
MANUAL.md:592-604  開発フェーズ別の使い分け表。599/600/602/603/604 の5行を削除        🔵
                   残る2行（feature-rubber-duck / edgecase-analysis）の「使い分け」列
                   から削除スキルへの相互参照を外す                                    🔵
MANUAL.md:606-632  ### 1. feature-rubber-duck → 番号そのまま                          🔵
MANUAL.md:633-658  ### 2. sequence-diagram-analysis → 節ごと削除                       🔵
MANUAL.md:659-683  ### 3. state-transition-analysis → 節ごと削除                       🔵
MANUAL.md:684-725  ### 4. edgecase-analysis → ### 2. edgecase-analysis に振り直す      🔵
MANUAL.md:726-752  ### 5. impact-analysis → 節ごと削除                                 🔵
MANUAL.md:753-787  ### 6. bug-analysis → 節ごと削除（765行の比較表も含む）             🔵
MANUAL.md:788-817  ### 7. performance-analysis → 節ごと削除                            🔵
MANUAL.md:818-840  ### 共通の出力構造。残る2スキルの実態に合わせて記述を絞る           🟡
MANUAL.md:841-852  ### 信号機システム。残る2スキルで使われているか確認して残否を決める 🟡
MANUAL.md:853-864  ### 注意事項。5.（調査と修正の分離）を削除。4.（並列実行）は維持    🔵
```

> 信号機: 🔵 は行番号と内容を実測済み。🟡 は共通節が5スキル前提で書かれており、2スキルに対して過剰か適切かを本文を読んで判断する必要がある

## Test Strategy

- [ ] `## 分析スキル` 配下の `###` 番号付き節が `### 1. feature-rubber-duck` と `### 2. edgecase-analysis` の2つだけになっている
- [ ] 開発フェーズ別の使い分け表の行数が 6 から 2 になり、削除スキル名が「使い分け」列にも残っていない
- [ ] 注意事項の項番が 1〜4 で連続している（5 を削除した穴が空いていない）
- [ ] `### 共通の出力構造` の記述が `edgecase-analysis` の実際の出力構造と矛盾しない
- [ ] エッジケース: `## 分析スキル` より後ろの節（`## Issue 連携` 以降）の見出し番号に影響が出ていない

## Implementation Notes

- 参照すべき既存コード: `MANUAL.md:588-864`、`skills/edgecase-analysis/SKILL.md`（出力構造と信号機の実態確認用）
- 実装のヒント: 削除は後ろの節から前へ向かって行うと行番号がずれない。番号の振り直しは README（タスク002）のアンカーと対にする
- 注意事項: `### 信号機システム` は他の節（Dev Skills 側）にも同名の記述がある可能性があるため、削除ではなく残す判断になりうる。`edgecase-analysis` が信号機を使っているなら残す

## Files

- 変更: `MANUAL.md`
