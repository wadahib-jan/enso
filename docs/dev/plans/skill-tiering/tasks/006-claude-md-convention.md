---
id: "006"
title: "CLAUDE.md にスキル2層構造の規約を追記する"
status: done
priority: 3
dependencies: ["002"]
estimated_complexity: low
---

# Task: CLAUDE.md にスキル2層構造の規約を追記する

## Goal

Enso 本体を開発するときの指示書である CLAUDE.md に、Entry / Internal の区分と、新規スキルを追加するときにどちらの書式で `description` を書くかの規約を記載する。この規約が無いと、次にスキルを追加した人が無条件にトリガー語列を書き、層の分離が崩れる。

## Interfaces

`## プロジェクト構造` と `## 読み込みの仕組み` の間、または `## 読み込みの仕組み` の直後に新設する節 🔵

```markdown
## スキルの2層構造

スキルは「人が明示的に呼ぶもの（Entry）」と「他スキルから呼ばれるもの（Internal）」に分かれます。
`skills/` は直下1階層しか読み込まれないためディレクトリでは分離できず、**`description` の書式が唯一の実効的なスイッチ**です。

| 層 | description の書式 | 挙動 |
|---|---|---|
| Entry | `This skill should be used when the user asks to "<name>", "<日本語トリガー>", ... . <説明>` | ユーザーの発話で自動発火する |
| Internal | `<呼び出し元> から呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。<説明>` | 自動発火せず、呼び出し元と `/enso:<name>` の明示指定でのみ動く |

Internal: dev-context / dev-impl / dev-run / dev-verify / dev-debug / dev-webtest-plan /
ipa-security-check / ipa-security-guide / task-breakdown

上記以外はすべて Entry です。

**新しいスキルを追加するとき**は、まずどちらの層かを決めてから description を書きます。他スキルのワークフローの一部としてしか意味をなさないなら Internal、
ユーザーが「〜したい」と言ったときの入口になるなら Entry です。判断に迷う場合は Entry にしません。
トリガー語列を持つスキルが増えるほど、無関係な発話での誤発火が増えるためです。

機能の説明文（後半）は Internal でも省略しません。`/enso:<name>` で明示実行されたときと、呼び出し元スキルが役割を把握するために必要です。
```

**維持** 🔵: 既存の `## 読み込みの仕組み` にある「`skills/` は直下1階層のみ」という制約の記述は、この節が前提として参照するためそのまま残す。

## Test Strategy

- [ ] CLAUDE.md に `## スキルの2層構造` の節が存在する
- [ ] Entry / Internal それぞれの description 書式が具体例として書かれている
- [ ] Internal 9スキルの名前が列挙されており、002 で実際に書き換えたスキルの集合と一致する
- [ ] 新規スキル追加時にどちらを選ぶかの判断基準が書かれている
- [ ] `grep -n "dev-navigate" CLAUDE.md` が 0 件（元から無いことの確認を含む）
- [ ] エッジケース: 既存の「読み込みの仕組み」節の1階層制約の記述が削除されていない
- [ ] エッジケース: CLAUDE.md の既存節（強制モード / 開発コマンド / 開発ワークフロー / 品質管理）が変更されていない

## Implementation Notes

- 参照すべき既存コード: `CLAUDE.md` の `## プロジェクト構造` と `## 読み込みの仕組み`
- CLAUDE.md は日本語で書かれており、既存節と同じ密度・語り口に合わせる（表＋補足の散文）
- 002 の実装結果と Internal スキルの一覧がずれないよう、002 完了後に確定した一覧を転記する

## Files

- 変更: `CLAUDE.md`
- テスト: なし（grep と目視による確認）
