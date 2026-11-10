---
id: "004"
title: "hooks の無駄な git 起動と重複した式を整理する"
status: done
priority: 2
dependencies: []
estimated_complexity: medium
---

# Task: hooks の無駄な git 起動と重複した式を整理する

## Goal

guard-bash が git / gh と無関係なコマンドでも毎回 git を起動している無駄をなくし、hooks 内の未使用 export と重複した式をまとめる。**allow / deny / ask の判定結果は一切変えない。**

## Interfaces

```js
// hooks/guard-bash.mjs（loadPolicy の後、gitState の前）
const parts = segments(command);
// 以下のルールはすべて先頭トークンが git / gh のセグメントにしか反応しない。
if (!parts.some((segment) => ["git", "gh"].includes(tokens(segment)[0]))) return;  // 🔵 全ルールの必要条件を先に評価するだけ
const git = gitState(cwd);
const root = git?.topLevel ?? policy.projectRoot;                                     // 🔵 2箇所の重複を1回に

// hooks/lib/policy.mjs findLoopStates 内
state.plan_name ??= SAFE_TOKEN.test(entry.name) ? entry.name : INVALID_PLAN_NAME;     // 🟡 呼び出し側の `plan_name ?? plan_dir` を不要にする
```

## Test Strategy

stdin にペイロードを流して変更前（main）と変更後の出力を比較する。enso.json を置いた一時プロジェクトとペイロードはスクラッチパッドに作る。

- [ ] `ls` / `pnpm test` / `echo git push`（先頭が echo）: 変更前後とも無出力で、変更後は git を起動しない
- [ ] `git commit -m x` / `git push` を保護ブランチ上で: 変更前後で同じ deny
- [ ] `gh pr ready` をセキュリティレポート無しで: 変更前後で同じ deny
- [ ] `gh pr merge 1` を merge_approved_at 無しで: 変更前後で同じ判定と理由文（計画名の表示を含む）
- [ ] `git branch -D x` / `git worktree remove <path>`: 変更前後で同じ ask
- [ ] `plan_name` が無い / 不正な loop-state.yaml で policy-context の表示名が変更前と同じ（ディレクトリ名 or 固定名）
- [ ] `grep -rn 'CONFIG_RELATIVE_PATH\|matchesGlob' hooks scripts` が policy.mjs 内だけ
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- 行番号は実ファイル基準（guard-bash.mjs は 329 行）
- guard-bash.mjs:221: 早期 return は `loadPolicy` の後に置く（前に置くと enso.json 破損時の stderr 警告が出なくなる）。:250 は `hasSecurityReport(root)`、:276 の再計算は削除
- policy.mjs:13 `export const CONFIG_RELATIVE_PATH` / :150 `export function matchesGlob` → `export` を外す（外部参照なし）
- policy.mjs:268-272: 表示名の決定を `findLoopStates` 内に寄せ、guard-bash:298・policy-context:55,104 の `plan_name ?? plan_dir` を `plan_name` に。JSDoc(:234) と typedef の `plan_name?` も更新。Issue #33 のサニタイズ（SAFE_TOKEN / INVALID_PLAN_NAME）の意味を変えないこと
- 見送り（plan.md に記録）:
  - branch -d/-D の2つの正規表現の統一（:94 と :311）: `-d=x` のような入力で ask の有無が変わるため
  - hasSecurityReport / findLoopStateForPr の findLoopStates 二重呼び出し: 公開関数の引数変更が要り、節約は readdir 1回
  - policy-context:137 の `git?.topLevel ?? policy.projectRoot`: 別ファイルで共通化すると行が増える
- 別件（範囲外）: `git branch --delete <b>` がどちらの正規表現にも当たらず確認が出ない
- hooks はセッション開始時に読み込まれるため、動作確認は hook スクリプトを直接 node で実行して行う

## Files

- 変更: hooks/guard-bash.mjs, hooks/lib/policy.mjs, hooks/policy-context.mjs
