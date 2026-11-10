---
id: "001"
title: "注入する計画一覧を未完了に絞り、セキュリティゲートを対象 PR の計画に限定する"
status: done
priority: 1
dependencies: []
estimated_complexity: medium
---

# Task: 注入する計画一覧を未完了に絞り、セキュリティゲートを対象 PR の計画に限定する

## Goal

policy-context が毎プロンプト全計画を「進行中の計画」として注入し、計画ごとにコンテキストが増え続けている。完了済み（shipped かつ worktree 無し）を件数だけにする。あわせて `gh pr ready` のセキュリティゲートが「どれかの計画にレポートがあれば通る」状態を、対象 PR の計画の reports/ だけを見るように直す（enso-prune が過去の計画を削除しても判定が変わらないようにするため）。

## Interfaces

```js
// hooks/policy-context.mjs describeState
const isFinished = (s) => s.status === "shipped" && !hasLiveWorktree(s);   // 🔵 NEXT_ACTIONS と同じ条件
// 未完了（failed は worktree が無くても残す）だけを列挙し、完了済みは
// "- 完了済みの計画: N 件（一覧は省略）" の1行（0 件なら出さない）          // 🔵
// 戻り値の states は全件のまま（NEXT_ACTIONS に全件を渡す）                   // 🔵

// hooks/guard-bash.mjs
function prTarget(segment, sub) { /* 旧 mergeTarget を merge / ready 共通に */ }   // 🔵
function hasSecurityReport(projectRoot, state) { /* state の plan_dir の reports/ のみ */ }  // 🔵
// ready ゲート: target = parts.map((s) => prTarget(s, "ready")).find(Boolean)
//   state = findLoopStateForPr(root, { prNumber: target.prNumber, branch: target.branch ?? git?.branch ?? null })
//   state あり・レポートなし → deny（mode に従う）
//   state なし            → ask（マージゲートと同じ扱い。enso 外の PR を塞がない）   // 🟡
```

## Test Strategy

scratchpad に一時 git リポジトリ（`.claude/enso.json`: enabled / flow / security true、mode deny、worktree false）を作り、hook に stdin で流して main のチェックアウトの hook（変更前）と出力を比較する。計画: A=awaiting-approval / B=shipped・worktree 実在 / C=shipped・worktree 無し / D=failed・worktree 無し / P12=pr_number 12・branch feat-12。

- [ ] A,B,C,D 混在: A,B,D を列挙し「完了済みの計画: 1 件（一覧は省略）」。次にすべきことは変更前と同じ
- [ ] C のみ: 「進行中の計画: なし」と「完了済みの計画: 1 件」
- [ ] 計画ゼロ: 「進行中の計画: なし」のみ（件数行なし）
- [ ] `gh pr ready 12` で P12/reports に security レポートあり → 通過（変更前後とも）
- [ ] `gh pr ready 12` で別計画だけにレポート → 変更前は通過、変更後は deny
- [ ] `gh pr ready 99`（対応計画なし） → 変更後は ask
- [ ] `gh pr ready` 引数なし・branch feat-12: P12 にレポートあり → 通過、なし（別計画のみ） → deny
- [ ] `gh pr ready https://github.com/o/r/pull/12` → 番号 12 として同じ判定
- [ ] `mode: "warn"` で deny が systemMessage になる挙動は変わらない
- [ ] `gh pr merge 12` の承認ゲート、`git commit` 等の既存判定は変更前と同じ
- [ ] すべてのケースで exit 0
- [ ] `pnpm secretlint` / `pnpm check` が通る

## Implementation Notes

- policy-context.mjs:46-58 を差し替え。:61-66 の NEXT_ACTIONS のコメントに「describeState の完了判定も同じ条件」を1行追加。failed は放置の害があるので worktree が無くても一覧に残す
- guard-bash.mjs:160 `mergeTarget` → `prTarget(segment, sub)`（`matchesGhCommand(segment, sub)` の1箇所と JSDoc を変更）。マージゲート（:272-285）も `parts.map((s) => prTarget(s, "merge")).find(Boolean)` に揃える
- guard-bash.mjs:193-206 の hasSecurityReport を上の形に。不要になる import（existsSync / findLoopStates）を削除
- deny 文言: 「この PR（計画: ${state.plan_name}）のセキュリティチェックのレポートがありません」＋既存の `/enso:ipa-security-check` 案内。ask 文言: 「この PR に対応する loop-state.yaml が見つからず、セキュリティチェックのレポートを確認できません」
- Issue #33 のサニタイズ（plan_name は findLoopStates で検証済みの値だけを表示）を崩さない
- ドキュメント: skills/dev-loop/SKILL.md Step 8 を「この PR の計画の `docs/dev/plans/<plan-name>/reports/`」に。MANUAL.md の強制モードの説明（:32 / :35 付近）に「完了済みの計画は件数のみ」「この PR の計画にレポートが無ければ」を反映
- 範囲外: `gh pr ready -R owner/repo` などオプション解析の限界（既知・別件）

## Files

- 変更: hooks/policy-context.mjs, hooks/guard-bash.mjs
- 変更: skills/dev-loop/SKILL.md, MANUAL.md
