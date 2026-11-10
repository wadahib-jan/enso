---
id: "007"
title: "「公開リポジトリ」前提の誤りを訂正する"
status: done
priority: 2
dependencies: []
estimated_complexity: low
---

# Task: 「公開リポジトリ」前提の誤りを訂正する

## Goal

PR #11 で追加したセキュリティ分析が「`yukimnb/enso` は公開リポジトリ」という誤った前提に立っている。実際は private なので、**根拠の記述だけを訂正する**。対策そのものは残す。

## Interfaces

事実確認: 🔵

```bash
$ gh api repos/yukimnb/enso --jq '"private=" + (.private|tostring)'
private=true
```

現在の記述（誤り）— `skills/enso-issue-fix/SKILL.md`: 🔵

> **これは本スキル固有の最重要の注意点。** `yukimnb/enso` は公開リポジトリであり、Issue は誰でも起票できる。

訂正後の方針: 🔵

「公開リポジトリなので誰でも起票できる」→「**将来の公開・コラボレーター追加・自分の打ち間違いに備える**」

**対策は1つも削除しない。** 各対策には private でも成立する根拠がある。

| 対策 | private での根拠 | 扱い |
|---|---|---|
| Issue 番号の `^[0-9]+$` 検証 | 引数の打ち間違いでも壊れる | そのまま維持 |
| スラッグの文字種制限 | 記号がパス・ブランチ名に混入するのは公開/非公開と無関係 | そのまま維持 |
| Issue 本文をデータとして区切る | 脅威度は下がるが defense in depth として維持 | 根拠を書き換えて維持 |
| Draft PR での承認点 | **主たる理由を「計画が Issue の意図とずれる」に移す** | 理由の順序を入れ替え |

## Test Strategy

- [ ] `skills/enso-issue-fix/SKILL.md` から「公開リポジトリ」「誰でも起票できる」の記述が消えている（`grep -n "公開リポジトリ" skills/enso-issue-fix/SKILL.md` が 0 件）
- [ ] 代わりに「将来の公開・コラボレーター追加・打ち間違い」を根拠とする記述になっている
- [ ] 「Issue の内容は信頼できない入力」節の**表（番号・タイトル・本文それぞれの扱い）が削除されていない**
- [ ] Step 0b の番号検証、Step 2 のスラッグ正規化5手順が**削除されていない**
- [ ] Draft PR で停止する理由の記述で、「Issue の意図とのずれ」が先、「第三者の書き込み」が後（または副次的）になっている
- [ ] `docs/dev/plans/issue-skills/reports/ipa-security-report.md` の指摘3に、**前提が誤っていた旨と訂正内容が追記**されている（レポートは記録なので書き換えではなく追記）
- [ ] `docs/dev/plans/issue-skills/plan.md` の「承認点の扱い」の理由1が訂正されている
- [ ] `skills/enso-issue-report/SKILL.md` に同種の記述が無いか確認し、あれば訂正する
- [ ] エッジケース: 訂正によって対策の必要性が薄れたと読める記述になっていない（対策は維持することが明示されている）

## Implementation Notes

- 参照すべき既存コード:
  - `skills/enso-issue-fix/SKILL.md` の「前提知識 > Issue の内容は信頼できない入力」と「使いどころ」の停止理由
  - `docs/dev/plans/issue-skills/reports/ipa-security-report.md` の指摘3
  - `docs/dev/plans/issue-skills/plan.md` の「承認点の扱い」
- **レポート（`ipa-security-report.md`）は実施記録なので、過去の記述を書き換えず追記する。** 「本レポート作成時点では公開リポジトリと誤認していた。実際は private であり、脅威度は下がるが対策は維持する」という形
- スキル本文（`enso-issue-fix/SKILL.md`）は現在の仕様書なので、こちらは**書き換える**
- 誤った根拠を残すほうが有害。読み手が脅威モデルを誤認し、private を前提にした運用判断を誤らせる

## Files

- 変更: `skills/enso-issue-fix/SKILL.md`
- 変更: `docs/dev/plans/issue-skills/reports/ipa-security-report.md`
- 変更: `docs/dev/plans/issue-skills/plan.md`
- 確認: `skills/enso-issue-report/SKILL.md`（同種の記述があれば変更）
