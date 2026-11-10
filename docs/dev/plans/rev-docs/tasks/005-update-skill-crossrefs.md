---
id: "005"
title: "他スキルからの rev-* 参照を rev-docs に更新する"
status: done
priority: 4
dependencies: ["002"]
estimated_complexity: low
---

# Task: 他スキルからの rev-* 参照を rev-docs に更新する

## Goal

既存スキル4本が「使い分けの説明」や「入力ファイルの探索先」として旧 rev-* コマンドを参照している。これを `rev-docs` に更新する。**出力先パスは変更しないので、パス参照はそのまま。**

## Interfaces

| ファイル | 行 | 現在の記述 | 変更方針 | 確信度 |
|---|---|---|---|---|
| `skills/edgecase-analysis/SKILL.md` | 29 | `**rev-requirements** — 既存のバリデーション実装からエッジケース「要件」を抽出する` | スキル名のみ `rev-docs` に。説明文は「rev-docs の requirements フェーズが」と読めるよう最小限調整 | 🔵 |
| `skills/edgecase-analysis/SKILL.md` | 49 | `docs/spec/{$1}/requirements.md`（rev-requirements の出力） | パスは不変。括弧内の出典名のみ `rev-docs` に | 🔵 |
| `skills/impact-analysis/SKILL.md` | 28 | `**rev-design** — コードベース全体から設計文書を逆生成する` | `rev-docs` に | 🔵 |
| `skills/sequence-diagram-analysis/SKILL.md` | 27 | `**rev-design** — コードベース全体から設計文書一式を逆生成する。単一機能を狙って深く描くには重い` | `rev-docs` に。「重い」という使い分けの論旨は4フェーズ統合でより強まるので維持 | 🔵 |
| `skills/state-transition-analysis/SKILL.md` | 27 | `**rev-design** — データフローを flowchart で出すが、ステートマシンとしての遷移表・遷移条件までは踏み込まない` | `rev-docs` に。design フェーズの話であることが分かる文にする | 🟡 |

## Test Strategy

- [ ] `skills/` 配下に `rev-tasks` / `rev-design` / `rev-specs` / `rev-requirements` の文字列が残っていない
- [ ] `skills/edgecase-analysis/SKILL.md:49` の入力パス `docs/spec/{$1}/requirements.md` が**変更されていない**（rev-docs の出力先は不変のため）
- [ ] 各スキルの「使い分け」の論旨（rev-* は全体逆生成で単一対象には重い）が維持されている
- [ ] エッジケース: `hooks/` や `.claude-plugin/plugin.json` に rev-* への参照が無いことを確認する（現状は無いが、削除漏れの検出として）

## Implementation Notes

- 参照すべき既存コード: 各 SKILL.md の「他スキルとの使い分け」節 — 周囲の記述の文体に合わせる
- 実装のヒント: `grep -rn "rev-tasks\|rev-design\|rev-specs\|rev-requirements" skills/ hooks/ .claude-plugin/` で対象を確定してから編集する
- 注意事項: 4フェーズ統合により「rev-docs は重い」という使い分けの根拠はむしろ強化される。説明文を弱めないこと

## Files

- 変更: `skills/edgecase-analysis/SKILL.md`
- 変更: `skills/impact-analysis/SKILL.md`
- 変更: `skills/sequence-diagram-analysis/SKILL.md`
- 変更: `skills/state-transition-analysis/SKILL.md`
