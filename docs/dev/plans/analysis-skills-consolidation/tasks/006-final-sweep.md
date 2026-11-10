---
id: "006"
title: "旧スキル名の残存を確認し品質ゲートを通す"
status: done
priority: 4
dependencies: ["001", "002", "003", "004", "005"]
estimated_complexity: low
---

# Task: 旧スキル名の残存を確認し品質ゲートを通す

## Goal

削除した5スキル名が `docs/dev/plans/**`（履歴）以外に1件も残っていないことを確認し、品質ゲートとマニフェスト検証を通す。

## Interfaces

確認コマンド:

```bash
# 旧スキル名の残存チェック（docs/dev/plans は履歴なので除外）  🔵
grep -rn "bug-analysis\|performance-analysis\|impact-analysis" --include="*.md" . | grep -v "^./docs/dev/plans/"
grep -rn "sequence-diagram-analysis\|state-transition-analysis" --include="*.md" . | grep -v "^./docs/dev/plans/"

# スキル数の確認  🔵
ls skills/ | wc -l           # 21 を期待（26 から5減）
ls skills/ | grep analysis   # edgecase-analysis のみ

# 品質ゲート  🔵
pnpm secretlint
pnpm check
claude plugin validate .
```

> 信号機: すべて 🔵（検証手段が確定している）

## Test Strategy

- [ ] 旧スキル名の grep が `docs/dev/plans/` 以外で 0 件
- [ ] `ls skills/ | wc -l` が 21 を返す
- [ ] `pnpm secretlint` が成功する
- [ ] `pnpm check` が成功する（Biome は Markdown 対象外なので JSON の整形のみ検査される）
- [ ] `claude plugin validate .` が成功する
- [ ] README の件数表記（13個 / 8個）が `ls skills/` の実態と一致する
- [ ] エッジケース: README の MANUAL へのアンカーリンク（`#2-edgecase-analysis`）が MANUAL の実際の見出しと一致し、リンク切れになっていない

## Implementation Notes

- 参照すべき既存コード: `.github/workflows/ci.yml`（CI が実行する品質ゲートと同じ2コマンド）
- 実装のヒント: worktree では `pnpm prepare` が skip されるため pre-commit フックは設置されないが、メインのチェックアウトで設置済みならフックは効く。いずれにせよこのタスクで明示的に2コマンドを実行する
- 注意事項: `pnpm <script>` は実行前に auto-install が走る。`pnpm-workspace.yaml` の `allowBuilds` に触らない（Issue #10）

## Files

- 変更: なし（検証のみ。不整合が見つかった場合は該当タスクのファイルを修正する）
