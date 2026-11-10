---
id: "001"
title: "分析系スキル5つのディレクトリを削除する"
status: done
priority: 1
dependencies: []
estimated_complexity: low
---

# Task: 分析系スキル5つのディレクトリを削除する

## Goal

`bug-analysis` / `performance-analysis` / `impact-analysis` / `sequence-diagram-analysis` / `state-transition-analysis` の5ディレクトリを削除する。`edgecase-analysis` は残す。

## Interfaces

削除対象（ディレクトリごと削除。計 6,167 行）:

```
skills/bug-analysis/                 # SKILL.md + references 4本 = 1,796行  🔵
skills/performance-analysis/         # SKILL.md + references 2本 =   918行  🔵
skills/impact-analysis/              # SKILL.md + references 2本 =   964行  🔵
skills/sequence-diagram-analysis/    # SKILL.md + references 2本 =   849行  🔵
skills/state-transition-analysis/    # SKILL.md + references 2本 = 1,640行  🔵
```

残すもの:

```
skills/edgecase-analysis/            # 変更しない（Entry のまま）  🔵
```

> 信号機: すべて 🔵（削除対象は行数を実測済み、残すものも確定している）

## Test Strategy

- [ ] `ls skills/ | grep -c analysis` が 1 を返す（`edgecase-analysis` のみ）
- [ ] `skills/edgecase-analysis/SKILL.md` が変更されていない（`git diff --stat` に現れない）
- [ ] `skills/` 直下のディレクトリ数が 26 から 21 に減っている
- [ ] エッジケース: `git status` で削除が5ディレクトリ分だけ記録され、他スキルのファイルが巻き込まれていない

## Implementation Notes

- 参照すべき既存コード: なし（削除のみ）
- 実装のヒント: `git rm -r skills/<name>` で1ディレクトリずつ削除する。worktree セッションのため Bash は単一の単純なコマンドに限る（`&&` での連結を使わない）
- 注意事項: `docs/dev/plans/**` に旧スキル名を含む過去 Plan の成果物があるが、**履歴なので触らない**。`.claude-plugin/plugin.json` は `"skills": "./skills/"` とディレクトリ単位の指定なので変更不要

## Files

- 削除: `skills/bug-analysis/`（5ファイル）
- 削除: `skills/performance-analysis/`（3ファイル）
- 削除: `skills/impact-analysis/`（3ファイル）
- 削除: `skills/sequence-diagram-analysis/`（3ファイル）
- 削除: `skills/state-transition-analysis/`（3ファイル）
