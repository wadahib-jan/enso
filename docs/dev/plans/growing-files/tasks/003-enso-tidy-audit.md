---
id: "003"
title: "enso-tidy に冗長・無駄の点検と dev-plan への引き継ぎを追加する"
status: done
priority: 2
dependencies: ["002"]
estimated_complexity: medium
---

# Task: enso-tidy に冗長・無駄の点検と dev-plan への引き継ぎを追加する

## Goal

enso-tidy に、判断軸 1（整頓と無駄の排除）に基づく点検を追加する。点検は読み取りのみのサブエージェントを領域ごとに並列で走らせ、結果（ファイル:行・内容・対処案・見送り判定）を会話に提示する。ユーザーが直す項目を選んだら、その項目を要件として dev-plan に引き継ぐ。点検結果はファイルに保存しない（新たな蓄積ファイルを作らないため）。

## Interfaces

点検範囲（Step 1 の判定で切り替える）:

| 対象 | 点検する領域 | 領域ごとのサブエージェント |
|---|---|---|
| enso 本体（`.claude-plugin/plugin.json` の `name` が `enso`） | `skills/`（SKILL.md・references）、`hooks/`・`scripts/`・設定（package.json・plugin.json・CI）、ドキュメント（CLAUDE.md・README.md・MANUAL.md・docs/dev/context.md） | 3 体 🔵 今回のセッションの調査と同じ分け方 |
| enso を導入したプロジェクト | AI 開発の設定とドキュメント: `CLAUDE.md`（ネストしたものを含む）、`.claude/`（settings・enso.json・同梱したスキルや agents）、`docs/dev/`（context.md と CLAUDE.md の重複など）、README 等のドキュメント。**ソースコードは対象外** | 2 体（設定 / ドキュメント） 🟡 |

点検サブエージェントの出力契約（references/audit-prompt-template.md に置く）:

```text
各指摘: 優先度（P0 壊れた参照・矛盾 / P1 重複 / P2 無駄な処理・大きすぎる定義）/ ファイル:行 / 何が冗長・無駄か / 対処案 / 規模の目安 /
        判定（対応する / 見送り: 複雑になる・挙動が変わる・読み手が違う などの理由）
追加: 削除対象の表に無いが蓄積していそうなファイル → 「削除候補」として別枠（自動では消さない）
禁止: ファイルの変更。行番号は実際に読んで確認したものだけ                                             🔵
```

## Test Strategy

- [ ] ワークフローに Step 3 点検（Step 2 の削除候補の収集と並行して実行してよい）と Step 6 dev-plan への引き継ぎがある
- [ ] Step 1 で enso 本体か導入先かを `.claude-plugin/plugin.json` の `name` で判定し、点検範囲の表どおりに切り替わる
- [ ] 導入先ではソースコードを点検しないと明記されている
- [ ] `references/audit-prompt-template.md` に出力契約（優先度・ファイル:行・対処案・見送り判定・削除候補の別枠・ファイル変更禁止）と、判断軸 1 を埋め込むプレースホルダがある
- [ ] Step 4 の確認が「削除: yes/no」と「直す指摘: 複数選択（見送り判定のものは既定で外す）」を1回の AskUserQuestion にまとめている（選択肢が多い場合は優先度単位でまとめる）
- [ ] Step 6: 削除 PR の dev-cleanup が終わった後（worktree を出て本体に戻った後）に、選ばれた指摘を要件テキストにまとめて `enso:dev-plan` を Skill ツールでメインコンテキストから起動する。指摘が0件なら起動しない
- [ ] 点検結果をファイルに保存しないと明記されている
- [ ] 削除候補（表に無いもの）は削除せず、報告に並べるだけになっている
- [ ] SKILL.md が 500 行以内、`pnpm secretlint` / `pnpm check` が通る

## Implementation Notes

- 点検サブエージェントは `subagent_type: general-purpose`（読み取りのみを指示）。1 メッセージで並列起動し、結果は要約のみメインに返す
- dev-plan の引数は `<plan-name> "<要件テキスト>"` 形式（plan-name 例: `tidy-fixes-YYYY-MM-DD`）。要件テキストには選ばれた指摘（ファイル:行・内容・対処案）と「第一優先は整頓と無駄の排除。複雑になる項目は見送る」「挙動を変えない」を含める。今回のセッションで dev-plan に渡した要件の形に揃える
- 削除も点検の指摘も無ければ「整頓する項目はありません」と伝えて終了
- 削除だけ・点検だけの実行はできるようにする（Step 4 でどちらかを選ばなければ、その Step を飛ばす）
- 判断軸 1 の「見送り」理由の例: 手順の途中を分断する / サブエージェントへの受け渡しが増える / 実行経路が別で消すとどこかで動かなくなる / 読み手が違う（利用者向けとモデル向け）

## Files

- 変更: skills/enso-tidy/SKILL.md
- 新規: skills/enso-tidy/references/audit-prompt-template.md
