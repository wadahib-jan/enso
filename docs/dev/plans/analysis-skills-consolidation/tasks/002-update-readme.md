---
id: "002"
title: "README のスキル一覧から5行を削除し件数を直す"
status: done
priority: 2
dependencies: []
estimated_complexity: low
---

# Task: README のスキル一覧から5行を削除し件数を直す

## Goal

README の「人が呼ぶスキル」表から削除した5スキルの行を除き、層の件数表記を実態に合わせる。README は**スキル一覧の正本**なので、ここがずれると他の全ドキュメントの基準が崩れる。

## Interfaces

変更箇所:

```
README.md:77   「人が呼ぶスキル」（18個）→（13個）。内部スキル（8個）は不変          🔵
README.md:92   sequence-diagram-analysis の行を削除                                     🔵
README.md:93   state-transition-analysis の行を削除                                     🔵
README.md:94   edgecase-analysis の行は残す。MANUAL アンカーを #2-edgecase-analysis へ  🔵
README.md:95   impact-analysis の行を削除                                               🔵
README.md:96   bug-analysis の行を削除                                                  🔵
README.md:97   performance-analysis の行を削除                                          🔵
README.md:100  「分析スキルの出力は docs/dev/analysis/ 配下に保存されます」の文言確認   🟡
```

削除後に「分析」ジャンルとして残る2行:

```
| feature-rubber-duck | 分析 | アイデアを対話で整理して PRD 化 |   （MANUAL アンカー #1 のまま）
| edgecase-analysis   | 分析 | 6レイヤー×4カテゴリを並列分析     |   （MANUAL アンカー #4 → #2）
```

> 信号機: 🔵 は行番号と内容を実測済み。🟡 は `feature-rubber-duck` と `edgecase-analysis` の出力先が両方 `docs/dev/analysis/` のままか確認したうえで判断する

## Test Strategy

- [ ] `grep -c "analysis" README.md` の結果に削除した5スキル名が1件も含まれない
- [ ] 「人が呼ぶスキル」表の行数が 18 から 13 になっている
- [ ] 77行目の件数表記が実際の表の行数と一致する（13個 / 8個）
- [ ] `edgecase-analysis` の MANUAL リンクが `#2-edgecase-analysis` を指し、タスク003で振り直す番号と一致する
- [ ] エッジケース: 「内部スキル」表（38-45行付近）は変更されていない

## Implementation Notes

- 参照すべき既存コード: `README.md:77-100`（スキル一覧節）
- 実装のヒント: MANUAL 側のアンカー振り直し（タスク003）と番号を合わせる必要がある。003 の結果を確認してからリンクを確定する
- 注意事項: Biome は Markdown を対象外なので整形の自動修正は働かない。表の区切り記号を手で揃える

## Files

- 変更: `README.md`
