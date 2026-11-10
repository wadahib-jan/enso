---
id: "003"
title: "旧 rev-* 4コマンドを削除し help.md を更新する"
status: done
priority: 2
dependencies: ["002"]
estimated_complexity: low
---

# Task: 旧 rev-* 4コマンドを削除し help.md を更新する

## Goal

`commands/rev-tasks.md` / `rev-design.md` / `rev-requirements.md` / `rev-specs.md` を削除し、`commands/help.md` のコマンド一覧・逆引き表のエントリを `rev-docs` 1本にまとめる。エイリアスは残さない。

## Interfaces

`commands/help.md` の変更対象:

| 行 | 現在 | 変更後 | 確信度 |
|---|---|---|---|
| 28 | `- rev-requirements, rev-design, rev-specs, rev-tasks` | `- rev-docs` | 🔵 |
| 85-88 | コマンド一覧の4行 | `| /enso:rev-docs | 既存コードベースを分析しタスク・設計・要件・テスト仕様を一括逆生成 |` の1行 | 🔵 |
| 168-171 | 逆引き表の4行 | 旧4行のキーワード（リバースエンジニアリング, 既存コード分析, ドキュメント逆生成, タスク抽出, 設計書逆生成, アーキテクチャ抽出, 仕様逆生成, テストケース抽出, 要件逆生成, EARS逆生成）を統合した1行 | 🟡 |

逆引き表のキーワードは**すべて引き継ぐ**。統合によって検索でヒットしなくなる語があってはならない。

## Test Strategy

- [ ] `commands/rev-tasks.md` `rev-design.md` `rev-requirements.md` `rev-specs.md` の4ファイルが存在しない
- [ ] `commands/help.md` に `rev-tasks` / `rev-design` / `rev-specs` / `rev-requirements` の文字列が残っていない
- [ ] `commands/help.md` の逆引き表に、旧4行のキーワード（上表に列挙）がすべて残っている
- [ ] `commands/help.md` のコマンド一覧と逆引き表の両方に `rev-docs` が存在する
- [ ] エッジケース: `git status` で削除が4件とも認識されている（`git rm` を使う）

## Implementation Notes

- 参照すべき既存コード: `commands/help.md` の他エントリ — 表のカラム構成と文体を合わせる
- 削除は `git rm commands/rev-tasks.md commands/rev-design.md commands/rev-requirements.md commands/rev-specs.md`
- 注意事項: **001 の抽出が完了してから実行する**。先に消すと抽出元が失われる

## Files

- 削除: `commands/rev-tasks.md`, `commands/rev-design.md`, `commands/rev-requirements.md`, `commands/rev-specs.md`
- 変更: `commands/help.md`
