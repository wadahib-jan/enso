---
id: "004"
title: "ipa レポート名を計画内で固定し、削除済み計画を拾わないようにする"
status: done
priority: 2
dependencies: ["001"]
estimated_complexity: low
---

# Task: ipa レポート名を計画内で固定し、削除済み計画を拾わないようにする

## Goal

dev-loop から実行する ipa-security-check の出力先を計画ごとの固定名にして、日付違いのレポートが増えないようにし、トリアージの引き継ぎ（同じ出力先の既存レポートを読む）を効かせる。あわせて、enso-tidy が計画を削除したあとに dev-screen-spec が削除済み計画を候補に出さないようにする。

## Interfaces

```text
dev-loop Step 8:
  /enso:ipa-security-check --output docs/dev/plans/<plan-name>/reports/ipa-security-report.md,docs/dev/plans/<plan-name>/reports/ipa-security-report.sarif   🔵 render_report.py は同じ出力先の既存 md から triage を引き継ぐ
dev-screen-spec:
  git diff --name-only --diff-filter=d ... plans/*/acceptance-criteria.md   🔵 削除ファイルを除外
```

## Test Strategy

- [ ] dev-loop Step 8 の ipa-security-check 呼び出しに固定名の `--output` があり、「固定名なので前回のトリアージを同じパスから引き継ぐ」旨の1文がある
- [ ] `skills/ipa-security-check/lib/triage_state.md` の既定パスの記述が、実装（既定は日付連番で毎回新規・`--output` で固定名を指定したときだけ引き継ぐ）と一致している
- [ ] `MANUAL.md` の ipa-security-check の出力先の説明が `./security-reports/ipa-security-report-YYYY-MM-DD-NN.{md,sarif}` になっている
- [ ] dev-screen-spec の acceptance-criteria 差分検出の git diff に `--diff-filter=d` がある
- [ ] scratchpad の一時リポジトリで、acceptance-criteria.md を削除したコミットに対し `--diff-filter=d` 付きでは削除ファイルが出ないことを確認する
- [ ] `pnpm secretlint` / `pnpm check` が通る

## Implementation Notes

- skills/dev-loop/SKILL.md Step 8: タスク 001 で文言を変えた同じ段落なので、001 の後に実施する。reports/ は Step 6 で作成済み
- skills/ipa-security-check/lib/triage_state.md:78 の「デフォルト `./ipa-security-report.md`」を「`--output` で固定名を指定したときだけ引き継ぐ。既定の日付連番（`orchestrator.md` Step 7）では毎回新規になるため引き継がれない」に
- MANUAL.md:977-978 付近の出力先の説明を実装に合わせる（SKILL.md:50 と references/arguments.md:24 は既に正しい）
- skills/dev-screen-spec/SKILL.md:287 付近の `git diff --name-only … plans/*/acceptance-criteria.md` に `--diff-filter=d` を追加
- 既存計画の日付付き ipa レポートは移行しない（enso-tidy の削除対象 2 が最新以外を消す）

## Files

- 変更: skills/dev-loop/SKILL.md, skills/ipa-security-check/lib/triage_state.md, skills/dev-screen-spec/SKILL.md, MANUAL.md
