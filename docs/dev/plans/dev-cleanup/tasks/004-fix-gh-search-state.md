---
id: "004"
title: "enso-issue-report の gh search issues --state all を修正する"
status: done
priority: 2
dependencies: []
estimated_complexity: low
---

# Task: enso-issue-report の gh search issues --state all を修正する

## Goal

`enso-issue-report` Step 4 の重複チェックコマンドが実行時にエラーになる。`--state all` は `gh search issues` では無効なので修正する。

## Interfaces

現在の記述（誤り）: 🔵

```bash
gh search issues --repo yukimnb/enso "<キーワード>" --state all --limit 10
```

実行結果:

```
invalid argument "all" for "--state" flag: valid values are {open|closed}
```

修正後: 🔵

```bash
gh search issues --repo yukimnb/enso "<キーワード>" --limit 10
```

`--state` を省略すると open / closed の両方が対象になる。同じ Step の `gh issue list --state all` は**そのままでよい**（`gh issue list` の `--state` は `all` を受け付ける）。

## Test Strategy

- [ ] `skills/enso-issue-report/SKILL.md` の `gh search issues` から `--state all` が削除されている
- [ ] 同じ Step の `gh issue list --repo yukimnb/enso --state all --limit 20` は変更されていない（こちらは `all` が有効）
- [ ] 修正後のコマンドが実際に成功する（`gh search issues --repo yukimnb/enso "enso.json" --limit 10` を実行して確認）
- [ ] Step 4 の重複チェックの手順（候補提示 → 新規 / 既存へコメント / 中止 の3分岐）が壊れていない

## Implementation Notes

- 参照すべき既存コード: `skills/enso-issue-report/SKILL.md` の「Step 4: 重複チェック」
- **`gh issue list` と `gh search issues` で `--state` の受け付ける値が違う**のが原因。前者は `all` を受けるが、後者は `open|closed` のみ
- 本タスクは他タスクと独立。先に片付けてよい

## Files

- 変更: `skills/enso-issue-report/SKILL.md`
