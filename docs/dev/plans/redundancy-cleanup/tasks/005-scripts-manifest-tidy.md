---
id: "005"
title: "scripts・マニフェスト・開発者向け記述の無駄と食い違いを整理する"
status: done
priority: 3
dependencies: []
estimated_complexity: low
---

# Task: scripts・マニフェスト・開発者向け記述の無駄と食い違いを整理する

## Goal

scripts の重複した git 呼び出し、存在しないファイル・機能への言及、参照元の無いファイル、glob の展開漏れで検査範囲が狭まっている secretlint を整理する。

## Interfaces

```js
// scripts/setup-git-hooks.mjs: rev-parse を1回に                              🔵
const out = runGit(["rev-parse", "--git-dir", "--git-common-dir"]);
if (!out) return;                                   // 既存の「git リポジトリではない」skip
const [gitDir, commonDir] = out.split("\n");
if (commonDir && resolve(gitDir) !== resolve(commonDir)) return;  // 既存の worktree skip
```

```json
// package.json                                                                  🔵
"secretlint": "secretlint --secretlintignore .gitignore \"**/*\""
// .claude-plugin/plugin.json                                                    🔵
"description": "AI-driven development toolkit for TDD and SDD workflows, providing skills to enhance developer productivity with Claude Code"
```

## Test Strategy

- [ ] `pnpm prepare` がメインのチェックアウトでは設置し、worktree の中では従来どおり skip のメッセージで終わる
- [ ] `pnpm secretlint` が直下のファイル（CLAUDE.md 等）と深い階層のファイルも検査する。新たな検出が出た場合は内容を確認し、誤検出なら `.secretlintignore` 相当で扱い、plan.md に記録する
- [ ] `claude plugin validate .` が通る（CLI が使えない環境ではスキップし、その旨を記録）
- [ ] `./scripts/sync-after-merge.sh --dry-run` で rsync の有無の確認がブランチ削除の処理より前に行われる
- [ ] `grep -rn '\.devcontainer' CLAUDE.md scripts` が 0 件
- [ ] `skills/dev-plan/tests/` が存在しない
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- setup-git-hooks.mjs:36-43: `isInWorktree()` を削除し、上の形に。コメント（worktree では --git-dir が .git/worktrees/<name> を指す。相対パスで返るので resolve して比べる）は残す
- sync-after-merge.sh:268 の rsync 確認を引数処理の直後（:29 付近）へ移動。終了コードとメッセージは同じだが、削除処理の前に止まるようになる（PR 本文に明記）。メッセージの `.devcontainer/Dockerfile` 言及を「rsync をインストールしてから再実行してください（例: `apt-get install rsync` / `brew install rsync`）。」に
- CLAUDE.md:145 → 「`rsync` が必要です（`install-local.sh` が使う）。コンテナ内で動かす場合は、イメージに rsync が入っているか確認してください。」
- install-local.sh:59 の上に1行コメント: `# commands / agents は廃止済み。過去の投入先に残ったディレクトリを STALE で掃除するためだけに列挙している。`（削除すると旧環境に残骸が残るため、値は残す）
- skills/dev-plan/tests/spec.yaml を削除（参照元・生成元とも無し）
- 見送り（plan.md に記録）:
  - sync-after-merge.sh の ls-remote をローカル ref 参照へ: `--dry-run` では fetch されず、single-branch clone で黙って止まるため
  - worktree 一覧のループ外キャッシュ: 「古くても安全」の説明が要り、節約はローカル git 1回
  - 設定の出所表示・未設定時の警告（print-enforce）: Node と sh の間に出力の取り決めを1つ増やす追加実装で、整理ではないため別 Issue 候補
  - sh 側のフォールバック既定値の削除: Node が無い場合と baseBranch だけ不正な場合に使われている
  - claude_docker/settings.local.json: MANUAL から参照される意図的なサンプル
  - pnpm-lock.yaml の追跡と CI の `--frozen-lockfile`: install（ネットワーク）を伴い依存の固定という別目的のため、別 PR

## Files

- 変更: scripts/setup-git-hooks.mjs, scripts/sync-after-merge.sh, scripts/install-local.sh
- 変更: package.json, .claude-plugin/plugin.json, CLAUDE.md
- 削除: skills/dev-plan/tests/spec.yaml
