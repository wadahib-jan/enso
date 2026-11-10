---
id: "002"
title: "sync-after-merge.sh が enso.json を読むようにする"
status: done
priority: 2
dependencies: ["001"]
estimated_complexity: medium
---

# Task: sync-after-merge.sh が enso.json を読むようにする

## Goal

`scripts/sync-after-merge.sh` の `BASE_BRANCH` / `PROTECTED_BRANCHES` を、本体チェックアウトの `.claude/enso.json`（`enforce.baseBranch` / `enforce.protectedBranches`）から取得する。取得できない場合は現在の固定値にフォールバックし、**スクリプトを止めない**。

## Interfaces

```bash
# Node 経由で設定を1回だけ読む。出力は行指向（TAB 区切り）で、bash 側は JSON を解釈しない。  🟡
#   base-branch<TAB>main
#   protected<TAB>main
#   protected<TAB>master
#   protected<TAB>develop
read_enforce() {  # $1: policy.mjs の絶対パス, $2: 設定の探索起点（本体チェックアウト）  🔵
  command -v node >/dev/null 2>&1 || return 1
  [[ -f "$1" ]] || return 1
  node --input-type=module -e '
    import { pathToFileURL } from "node:url";
    const { resolveEnforce } = await import(pathToFileURL(process.argv[1]).href);
    const { enforce } = resolveEnforce(process.argv[2]);
    if (typeof enforce.baseBranch === "string" && enforce.baseBranch)
      console.log(`base-branch\t${enforce.baseBranch}`);
    for (const b of enforce.protectedBranches ?? [])
      if (typeof b === "string" && b) console.log(`protected\t${b}`);
  ' "$1" "$2" 2>/dev/null
}
```

- 引数は**すべて argv 経由**で渡す。パスをスクリプト本文に文字列展開しない  🔵
- `set -euo pipefail` 下でも落ちないよう、呼び出しは `|| true` を挟んで結果を捕捉する  🔵

## Test Strategy

- [ ] 本リポジトリ（`protectedBranches: ["main","master","develop"]`, `baseBranch: "main"`）で `./scripts/sync-after-merge.sh --dry-run` を実行すると、変更前と同じブランチ集合が削除対象になる（＝既定値では挙動が変わらない）
- [ ] 設定の `protectedBranches` に `release` を加えた一時ディレクトリを探索起点にして `read_enforce` 相当を実行すると、出力に `protected<TAB>release` が含まれる
- [ ] `baseBranch` を `develop` にした設定に対し、出力の `base-branch` が `develop` になる
- [ ] `.claude/enso.json` が存在しないディレクトリを起点にすると、出力は既定値（`main` / main,master,develop）になり、スクリプトは通常どおり進む
- [ ] JSON が壊れた設定でもスクリプトは中断せず、固定値で後始末が続行する（stderr に警告が出る）
- [ ] `node` が PATH に無い状況を模した場合（`read_enforce` が非0で返る場合）、警告が1行出て固定値のまま続行する
- [ ] エッジケース: `protectedBranches: []` の設定でも、`BASE_BRANCH` に一致するブランチは削除対象にならない（既存の `[[ "$branch" == "$BASE_BRANCH" ]] && continue` が効いていること）
- [ ] `--dry-run` の出力に、設定を読めたかどうか（読み込み元 or フォールバックした旨）が分かる行が出る
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: `scripts/sync-after-merge.sh` の 27-33 行（`REPO` / `BASE_BRANCH` / `PROTECTED_BRANCHES`）、45-48 行（`MAIN` の決定）、99-110 行（`is_protected`）、108-153 行（削除ループ）
- **順序の変更が必要**: 現在 `BASE_BRANCH` は 28 行目で決まるが、設定の探索起点は 45 行目で決まる `MAIN` である。設定の読み取りは `MAIN` 確定後に行い、固定値は「フォールバックの既定値」として先に置いたまま上書きする形にする
- 設定は `$MAIN`（本体チェックアウト）から探す。worktree の中から実行されても本体の設定を読むため。モジュールは実行中のスクリプトと同じリポジトリの `$REPO/hooks/lib/policy.mjs` を使う
- 読み取りは**1回だけ**。ループの中で node を起動しない
- 配列への詰め直しは `while IFS=$'\t' read -r kind value` で行い、1件も読めなければ固定値を維持する
- 既存のコメント（「base だけを除外していると develop が消える」）は残しつつ、値の出所が設定になった旨に更新する
- スクリプトの引数・出力の体裁は変えない。`skills/dev-cleanup` がこのスクリプトに委譲しているため

## Files

- 変更: `scripts/sync-after-merge.sh`
- テスト: なし（`--dry-run` と一時ディレクトリでの手動確認）
