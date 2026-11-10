---
id: "004"
title: "README.md と MANUAL.md の記述を rev-docs に更新する"
status: done
priority: 3
dependencies: ["002"]
estimated_complexity: medium
---

# Task: README.md と MANUAL.md の記述を rev-docs に更新する

## Goal

利用者向けドキュメントの rev-* 4コマンドの記述を `rev-docs` 1本に置き換える。特に MANUAL.md の「推奨実行順序」節は、1コマンドで通し実行するようになるため不要になる。

## Interfaces

| ファイル | 行 | 変更内容 | 確信度 |
|---|---|---|---|
| `README.md` | 143-146 | コマンド表の4行 → `| rev-docs | 既存コードからタスク・設計・要件・テスト仕様を一括逆生成 |` の1行 | 🔵 |
| `README.md` | 221-230 | 使用例の4コマンド → `/enso:rev-docs` 1つに | 🔵 |
| `MANUAL.md` | 560 | 「コードベース全体の設計書なら `rev-design`」→ `rev-docs` | 🔵 |
| `MANUAL.md` | 960-1075 | 「リバースエンジニアリングの詳細」節を書き直す | 🟡 |

MANUAL.md 960-1075 の書き直し方針:

- **「推奨実行順序」（984-987）は削除する。** 1コマンドで tasks → design → requirements → specs を通し実行するため、利用者が順序を意識する必要がなくなる
- 旧4コマンドの見出し（991 / 1008 / 1026 / 1042）は「4つのフェーズ」の説明として再構成する。**フェーズの並び順は tasks → design → requirements → specs**（旧記述の specs → requirements とは逆。requirements が先でないとテスト仕様の根拠が無いため）
- 生成されるファイル一覧は4フェーズ分をまとめて1つの表にする
- rev-specs のテストコード生成（`docs/spec/{要件名}/tests/`）に関する記述は削除する

## Test Strategy

- [ ] `README.md` に `rev-tasks` / `rev-design` / `rev-specs` / `rev-requirements` の文字列が残っていない
- [ ] `MANUAL.md` に同上の文字列が残っていない
- [ ] `MANUAL.md` に「推奨実行順序」として4コマンドを順に並べた記述が残っていない
- [ ] `MANUAL.md` のフェーズ説明が tasks → design → requirements → specs の順で並んでいる
- [ ] 生成ファイル一覧に `docs/tasks/` `docs/design/` `docs/spec/` の3系統がすべて記載されている
- [ ] `docs/spec/{要件名}/tests/` への言及が無い
- [ ] エッジケース: README.md と MANUAL.md で `rev-docs` の説明文が矛盾していない

## Implementation Notes

- 参照すべき既存コード: `README.md` / `MANUAL.md` の他スキルのエントリ — 表のカラム構成と説明文の粒度を合わせる
- 実装のヒント: 先に `grep -n "rev-" README.md MANUAL.md` で全出現箇所を洗い出してから着手する。行番号は他の編集でずれる
- 注意事項: `docs/dev/plans/` 配下の過去の plan（`dcs-to-skills/plan.md:24-25` など）は**履歴なので触らない**

## Files

- 変更: `README.md`
- 変更: `MANUAL.md`
