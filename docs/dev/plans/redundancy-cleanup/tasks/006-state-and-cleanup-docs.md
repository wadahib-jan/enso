---
id: "006"
title: "状態ファイル・承認ゲート・後始末の重複した説明を削る"
status: done
priority: 3
dependencies: ["001", "003"]
estimated_complexity: low
---

# Task: 状態ファイル・承認ゲート・後始末の重複した説明を削る

## Goal

loop-state.yaml の承認フィールドと承認ゲートの説明、マージ後の後始末の理由説明が dev-plan / dev-loop / dev-cleanup / MANUAL / CLAUDE.md に重複している。正本（dev-loop「状態ファイル仕様」、sync-after-merge.sh のコメント、dev-cleanup の手順）を残し、言い直しだけを削る。**各ステップで実際に書き込む YAML の指示は残す。**

## Interfaces

```text
承認フィールドの正本   : skills/dev-loop/SKILL.md「状態ファイル仕様」       🔵 dev-plan が既に参照している
後始末スクリプトの正本 : scripts/sync-after-merge.sh のコメント             🔵 削る内容がコメントにあることを確認済み
dev-run テンプレート   : dev-impl / dev-debug / dev-verify の写しであることを CLAUDE.md に1行明記  🟡
```

## Test Strategy

- [ ] `grep -n '状態ファイル仕様' skills/dev-loop/SKILL.md skills/dev-plan/SKILL.md` で見出しと参照が両方残る
- [ ] `grep -n '承認ゲート一覧' MANUAL.md` で見出しと置き換えた参照が両方ある
- [ ] `grep -n '未コミット変更の判定' skills/dev-cleanup/SKILL.md` で見出しと参照が両方ある
- [ ] `hooks/guard-bash.mjs` が理由文で参照する dev-cleanup「Step 3 のマージ確認」の文言が変わっていない
- [ ] dev-plan Phase 5d/5e と dev-cleanup Step 3.5 の YAML ブロックが残っている
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- dev-plan: Phase 5e の「**これは監査のための記録であり…だけである。**」を「（用途は `dev-loop` の「状態ファイル仕様」）」に。「**ここが承認ゲートの1つ目。**…」の段落を削除（dev-loop / dev-cleanup に同内容）
- dev-loop: 状態ファイル仕様の status 表を YAML 直後へ移動（YAML → status → 承認フィールドの順）。承認フィールドの説明を「どちらも任意で、承認時に初めて書かれる。無い＝未承認と読み、`dev-loop` は有無で挙動を変えない」の2文に
- dev-cleanup:
  - 前提知識の権限フォールバックの説明（:39-43 付近）を「権限が揃っていてもフォールバックを省かない（トークンの権限は人や時期で変わり、CI が無いリポジトリもあるため）」の1文に
  - 汎用手順の :226 / :232 / :240 付近で前提知識・ルールと同じ説明を削除（コード内の「未追跡を含む」コメントは残す）
  - Step 3.5 の push する理由の説明（:147 付近）を削除
  - ルール節 :300 付近を「未コミットの判定基準は本体と worktree で異なる（「前提知識 > 未コミット変更の判定」）」に
- MANUAL.md:280 付近「**完了後**: …」を「完了後の扱いは[承認ゲート一覧](#承認ゲート一覧)を参照」に
- CLAUDE.md「PR をマージしたあと」: コマンド、手順の要約1文、「未マージのブランチには触らない / 未コミット（未追跡を含む）の worktree は skip」、`resolveEnforce()` への一本化、rsync の注意を残し、merge-base 判定・`--force` の理由・削除失敗時の処理・リモート削除の理由を削って「判定基準と各処理の理由は `scripts/sync-after-merge.sh` のコメントにある」を1行置く
- CLAUDE.md「スキルの2層構造」に1行: 「`dev-run/references/*-prompt-template.md` は dev-impl / dev-debug / dev-verify の手順をサブエージェント向けに写したもの。片方を変えたらもう片方も更新する」
- 見送り（plan.md に記録）:
  - dev-run テンプレートを SKILL.md の Read に置き換える案: TodoWrite・Docker 停止・AskUserQuestion など サブエージェントで実行できない手順の例外指示が要り、毎タスク 11KB の Read が増える
  - Docker 停止手順の3重複: dev-impl（明示実行）・dev-run・dev-verify で実行経路が別で、どれを消してもどこかで止まらなくなる
  - MANUAL と enso-policy の設定キー表: 読み手が違い、enso-policy 側を変えると `show` の出力が変わる
  - CLAUDE.md の hooks 表: 開発者向けの他に無い対応表

## Files

- 変更: skills/dev-plan/SKILL.md, skills/dev-loop/SKILL.md, skills/dev-cleanup/SKILL.md, MANUAL.md, CLAUDE.md
