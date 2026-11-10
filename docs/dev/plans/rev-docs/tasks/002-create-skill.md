---
id: "002"
title: "skills/rev-docs/SKILL.md を作成する"
status: done
priority: 1
dependencies: ["001"]
estimated_complexity: high
---

# Task: skills/rev-docs/SKILL.md を作成する

## Goal

4フェーズを通し実行するオーケストレーションスキル `skills/rev-docs/SKILL.md` を新規作成する。分析手順とフォーマットは 001 で作った `references/` に委ね、SKILL.md には流れと制約だけを書く。

## Interfaces

フロントマター:

```yaml
---
name: rev-docs
description: This skill should be used when the user asks to "rev-docs", "リバースエンジニアリング", "既存コードから設計書", "ドキュメント逆生成", "既存コードを分析してドキュメント化", "要件を逆生成", "テスト仕様を逆生成", "reverse engineer", "generate docs from code". 既存のコードベースを機能単位に分解し、タスク一覧・設計文書・EARS要件定義・テスト仕様書を4フェーズで一括逆生成する。
argument-hint: '[分析対象パス]'
---
```

- `description` は既存スキル（`skills/dev-run/SKILL.md` 等）に倣い、旧4コマンドのトリガー語を網羅する 🔵
- `argument-hint` は分析対象パス1つのみ。省略時はリポジトリルート 🔵

構成（既存スキルの節構成に合わせる）: `## 前提知識` / `## ワークフロー` / `## 信号機システム` / `## ルール・制約` / `## 追加リソース` 🔵

## Test Strategy

- [ ] `wc -l skills/rev-docs/SKILL.md` が 500 以下（リポジトリ共通ルール）
- [ ] Step 0 で `{要件名}` のリストを1回だけ確定し、Step 1-4 がそれを共有する旨が明記されている
- [ ] フェーズ順序が tasks → design → requirements → specs の順で記述されている
- [ ] 出力先が `docs/tasks/{要件名}/` `docs/design/{要件名}/` `docs/spec/{要件名}/` で、旧コマンドと一致している
- [ ] `docs/spec/{要件名}/tests/` へのテストコード生成の記述が無い
- [ ] `## ルール・制約` に、強制モード有効プロジェクトの保護ブランチ上では guard-edit に deny されるため worktree 内で実行する旨が1行ある
- [ ] `## 追加リソース` から `references/` の4ファイルすべてが参照されている
- [ ] エッジケース: 分析対象に機能が1つも見つからなかった場合の扱いが記述されている

## Implementation Notes

- 参照すべき既存コード:
  - `skills/dev-run/SKILL.md` — フェーズをまたぐオーケストレーション、サブエージェント制約の書き方、最終レポート節の構成
  - `skills/uat-test-design/SKILL.md` — 大規模リポジトリで抽出をサブエージェントに並列委譲するパターン
- ワークフローの骨子:
  - **Step 0: 機能分割** — 旧 `commands/rev-tasks.md:17-48`「{要件名}の命名規則」（kebab-case・50字以内・変換例）をここに集約する
  - **Step 1-4** — 各フェーズで `references/phaseN-*.md` を Read してから実行する
  - **Step 5: 最終レポート** — 生成ファイル一覧、機能数・API数・要件数などの統計、信頼度の低い推定項目と確認事項
- 機能数が多い場合はフェーズ×機能単位で general-purpose サブエージェントに委譲する。委譲時は `references/` の該当テンプレートをプロンプトに埋め込み、**サブエージェントには Task ツールを使わせない**（`skills/dev-run/SKILL.md` の「サブエージェント制約」節と同じ扱い）
- 注意事項: Bash コマンドは `$(git rev-parse --show-toplevel)` でルートを取得した絶対パスを使う（他スキルと同じ規約）

## Files

- 新規: `skills/rev-docs/SKILL.md`
- 参照: `skills/rev-docs/references/phase1-tasks.md` 〜 `phase4-specs.md`（001 の成果物）
- 参照: `skills/dev-run/SKILL.md`
