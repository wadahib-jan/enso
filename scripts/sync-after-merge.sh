#!/usr/bin/env bash
#
# PR をマージしたあとの後始末をまとめて行う。
#
#   ./scripts/sync-after-merge.sh            # 同期する
#   ./scripts/sync-after-merge.sh --dry-run  # 何が起きるかだけ表示する
#
#   1. main を最新にする（fetch + ff-only pull）
#   2. マージ済みのローカルブランチと worktree、およびリモートブランチを削除する
#   3. 品質ゲート（secretlint / biome）を通す
#   4. ./scripts/install-local.sh で ~/.claude/skills/enso へ投入する
#
# ベースブランチと保護ブランチは .claude/enso.json（enforce.baseBranch /
# enforce.protectedBranches）から読む。設定が無い・読めない場合は
# hooks/lib/policy.mjs の既定値と同じ値にフォールバックする。
#
# enso はコピー方式なので、マージしただけでは手元の Claude Code に反映されない。
# 反映には Claude Code の再起動（または /reload-plugins）が必要。

set -euo pipefail

DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help) sed -n '2,14p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *)         echo "unknown option: $arg" >&2; exit 1 ;;
  esac
done

# 最後の投入（install-local.sh）で rsync が要る。ブランチや worktree を消したあとで
# 止まらないよう、何かを変更する前に確認する。
if ! command -v rsync >/dev/null 2>&1; then
  cat >&2 <<'MSG'
✘ rsync がありません。install-local.sh を実行できません。

  rsync をインストールしてから再実行してください（例: `apt-get install rsync` / `brew install rsync`）。
MSG
  exit 1
fi

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 以下2つは .claude/enso.json（enforce.baseBranch / enforce.protectedBranches）から
# 読み直す。ここにあるのは設定を読めなかったときのフォールバックであり、
# hooks/lib/policy.mjs の DEFAULT_ENFORCE と同じ値。
#
# base だけを除外していると、develop のように base の祖先になりうる長命ブランチが
# 「マージ済み」と判定されて消える。ローカルだけなら復旧できるが、リモートも消すと影響が大きい。
BASE_BRANCH="main"
PROTECTED_BRANCHES=("main" "master" "develop")

run() {
  if [[ "$DRY_RUN" == 1 ]]; then
    echo "    [dry-run] $*"
  else
    "$@"
  fi
}

# worktree の中から実行されても本体を操作したいので、--show-toplevel は使わない。
# `git worktree list --porcelain` の最初のエントリが常に本体チェックアウト。
MAIN="$(git -C "$REPO" worktree list --porcelain | sed -n '1s/^worktree //p')"
[[ -n "$MAIN" ]] || { echo "✘ 本体チェックアウトを特定できません" >&2; exit 1; }

git_main() { git -C "$MAIN" "$@"; }

# ── 0. 設定の読み込み ─────────────────────────────────────────────
# 保護ブランチとベースブランチは .claude/enso.json を正とする。スクリプト側に
# 固定値を持つと、設定を変えたときに黙って乖離する（設定で保護したつもりの
# ブランチをこのスクリプトが消してしまう）。
#
# 探索の起点は本体チェックアウト（$MAIN）。worktree の中から実行されても
# 本体の設定を読む。モジュールは実行中のスクリプトと同じリポジトリのものを使う。
# 読み取りは1回だけ行い、ループの中で node を起動しない。
ENFORCE_SOURCE="既定値"
PRINT_ENFORCE="$REPO/scripts/lib/print-enforce.mjs"
ENFORCE_LINES=""
if command -v node >/dev/null 2>&1 && [[ -f "$PRINT_ENFORCE" ]]; then
  # 失敗してもスクリプト全体を止めない（set -e 対策の || true）。
  ENFORCE_LINES="$(node "$PRINT_ENFORCE" "$MAIN" 2>/dev/null || true)"
fi

if [[ -n "$ENFORCE_LINES" ]]; then
  PARSED_PROTECTED=()
  PARSED_BASE=""
  while IFS=$'\t' read -r kind value; do
    case "$kind" in
      base-branch) PARSED_BASE="$value" ;;
      protected)   PARSED_PROTECTED+=("$value") ;;
    esac
  done <<< "$ENFORCE_LINES"
  [[ -n "$PARSED_BASE" ]] && BASE_BRANCH="$PARSED_BASE"
  # 設定が protectedBranches: [] なら、その意図どおり空にする。
  # base 自身は削除ループが常に除外するので、空でも base は消えない。
  PROTECTED_BRANCHES=()
  if [[ ${#PARSED_PROTECTED[@]} -gt 0 ]]; then
    PROTECTED_BRANCHES=("${PARSED_PROTECTED[@]}")
  fi
  ENFORCE_SOURCE=".claude/enso.json"
else
  echo "⚠ enso.json を読めませんでした。保護ブランチは既定値を使います。" >&2
fi

echo "==> 設定: base=$BASE_BRANCH / protected=${PROTECTED_BRANCHES[*]:-（なし）} （出所: $ENFORCE_SOURCE）"

# ── 1. 本体に未コミットの変更が無いこと ────────────────────────────
# 判定は追跡済みファイルに絞る（--untracked-files=no）。
# 以降の fetch / ff-only pull / ブランチ削除はいずれも未追跡ファイルを失わせないので、
# gitignore 漏れ1件で後始末全体が止まるのを防ぐ。
# **worktree 側の判定（後述）は絞らない。** 削除に使う `worktree remove --force` は
# 未追跡ファイルごと消すため。無視対象（node_modules / .venv 等）は status に出ないので、
# 生成物が理由で skip されることはない。
if [[ -n "$(git_main status --porcelain --untracked-files=no)" ]]; then
  echo "✘ $MAIN に未コミットの変更があります。退避してから再実行してください。" >&2
  git_main status --short --untracked-files=no >&2
  exit 1
fi

# ── 2. main を最新にする ──────────────────────────────────────────
echo "==> origin を取得"
run git -C "$MAIN" fetch --prune origin

BEFORE="$(git_main rev-parse "$BASE_BRANCH")"

CURRENT="$(git_main rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT" != "$BASE_BRANCH" ]]; then
  echo "==> $BASE_BRANCH に切り替え（$CURRENT から）"
  run git -C "$MAIN" switch "$BASE_BRANCH"
fi

echo "==> $BASE_BRANCH を取り込み"
# ff-only にするのは、意図しないマージコミットを黙って作らないため。
run git -C "$MAIN" pull --ff-only origin "$BASE_BRANCH"

AFTER="$(git_main rev-parse "$BASE_BRANCH")"

# ── 3. マージ済みブランチと worktree の削除 ───────────────────────
# worktree にチェックアウトされているブランチは、worktree を消さないと削除できない。
worktree_of() {
  git -C "$MAIN" worktree list --porcelain \
    | awk -v b="refs/heads/$1" '
        /^worktree /  { path = substr($0, 10) }
        /^branch /    { if (substr($0, 8) == b) { print path; exit } }
      '
}

RECOVERED=()

# worktree を削除する。成功したら 0、削除できなかったら 1 を返す（呼び出し側は skip する）。
#
# `--force` を付けるのは、付けないと gitignore 対象の生成物（node_modules / .venv 等）
# ひとつで `Directory not empty` になるため。`--force` の意味は「未追跡・無視対象ごと消す」で
# あって、追跡済みの変更を握り潰すことではない。それは呼び出し側の status 判定で除外済み。
#
# さらに `git worktree remove` は**失敗しても管理エントリだけ解除されることがある**。
# 「失敗＝何も起きていない」とは仮定できないので、失敗後は worktree list で実状を確認する。
remove_worktree() {
  local wt="$1"

  if run git -C "$MAIN" worktree remove --force "$wt"; then
    return 0
  fi

  echo "    ⚠ worktree の削除に失敗しました: $wt" >&2

  if git -C "$MAIN" worktree list --porcelain | grep -qxF "worktree $wt"; then
    # エントリが残っている。次回また試せるので、ここでは何もしない。
    return 1
  fi

  # エントリだけ消えてディレクトリが孤立した状態。prune してから実体を回収する。
  # 対象が .claude/worktrees/ 配下であることを確認してから消す（取り違え防止）。
  if [[ "$wt" != "$MAIN/.claude/worktrees/"* ]]; then
    echo "    ⚠ $wt は $MAIN/.claude/worktrees/ の外にあるため回収しません。手作業で確認してください。" >&2
    return 1
  fi

  run git -C "$MAIN" worktree prune

  # 1度だけ再試行する。virtiofs のような遅延のある FS では
  # 1回目が Directory not empty で失敗し2回目で成功することがある。
  if run rm -rf "$wt" || run rm -rf "$wt"; then
    if [[ "$DRY_RUN" == 1 || ! -e "$wt" ]]; then
      echo "    孤立ディレクトリを回収: $wt"
      RECOVERED+=("$wt")
      return 0
    fi
  fi

  echo "    ⚠ 孤立ディレクトリが残っています。手作業で削除してください: rm -rf $wt" >&2
  return 1
}

# squash マージされたブランチは main の祖先にならないため、gh に問い合わせる。
merged_via_gh() {
  command -v gh >/dev/null 2>&1 || return 1
  [[ -n "$(gh pr list --state merged --head "$1" --limit 1 --json number --jq '.[].number' 2>/dev/null)" ]]
}

DELETED=()
REMOTE_DELETED=()
SKIPPED=()

echo "==> マージ済みブランチを確認"
is_protected() {
  local b
  [[ ${#PROTECTED_BRANCHES[@]} -eq 0 ]] && return 1
  for b in "${PROTECTED_BRANCHES[@]}"; do
    [[ "$1" == "$b" ]] && return 0
  done
  return 1
}

while IFS= read -r branch; do
  [[ "$branch" == "$BASE_BRANCH" ]] && continue
  is_protected "$branch" && continue

  FORCE=0
  if git_main merge-base --is-ancestor "$branch" "$BASE_BRANCH" 2>/dev/null; then
    : # マージコミット / rebase マージ
  elif merged_via_gh "$branch"; then
    FORCE=1  # squash マージ。-d では消せないので -D が要る
  else
    continue
  fi

  WT="$(worktree_of "$branch")"
  if [[ -n "$WT" && "$WT" != "$MAIN" ]]; then
    if [[ -n "$(git -C "$WT" status --porcelain 2>/dev/null)" ]]; then
      # 確認は求めない方針だが、ユーザーが一度も見ていない差分は消さない。
      SKIPPED+=("$branch (worktree $WT に未コミットの変更)")
      continue
    fi
    echo "    worktree を削除: $WT"
    if ! remove_worktree "$WT"; then
      # 削除できなかった worktree のブランチは消せない（消すと参照が失われる）。
      SKIPPED+=("$branch (worktree $WT を削除できず)")
      continue
    fi
  fi

  echo "    ブランチを削除: $branch"
  if [[ "$FORCE" == 1 ]]; then
    run git -C "$MAIN" branch -D "$branch"
  else
    run git -C "$MAIN" branch -d "$branch"
  fi
  DELETED+=("$branch")

  # リモートにも残っていれば消す。GitHub の delete_branch_on_merge が無効だと
  # マージ後もリモートブランチが溜まり続けるため、ここで片付ける。
  # 対象はこのループで「マージ済み」と判定したものだけ。
  if git_main ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
    echo "    リモートブランチを削除: origin/$branch"
    # push の失敗（権限・ネットワーク）でスクリプト全体を止めない。
    # ローカルの削除は済んでいるので、警告だけ残して続行する。
    if run git -C "$MAIN" push origin --delete "$branch"; then
      REMOTE_DELETED+=("$branch")
    else
      SKIPPED+=("$branch (リモートブランチの削除に失敗)")
    fi
  fi
done < <(git_main for-each-ref --format='%(refname:short)' refs/heads/)

run git -C "$MAIN" worktree prune

# ── 4. 品質ゲート ─────────────────────────────────────────────────
# 投入は全プロジェクトに即座に効くため、壊れた状態を入れないための保険。
echo "==> 品質ゲート"
if [[ -d "$REPO/node_modules" ]]; then
  run pnpm --dir "$REPO" secretlint
  run pnpm --dir "$REPO" check
else
  echo "    node_modules が無いためスキップ（pnpm install が必要）"
fi

# ── 5. 投入 ───────────────────────────────────────────────────────
echo "==> ~/.claude/skills/enso へ投入"
if [[ "$DRY_RUN" == 1 ]]; then
  "$REPO/scripts/install-local.sh" --dry-run
else
  "$REPO/scripts/install-local.sh"
fi

# ── 6. サマリ ─────────────────────────────────────────────────────
echo
echo "──────── 完了 ────────"
if [[ "$BEFORE" == "$AFTER" ]]; then
  echo "  $BASE_BRANCH: 変化なし（$(git_main rev-parse --short "$AFTER")）"
else
  echo "  $BASE_BRANCH: $(git_main rev-parse --short "$BEFORE") → $(git_main rev-parse --short "$AFTER")"
  git_main log --oneline "$BEFORE..$AFTER" | sed 's/^/    /'
fi
if [[ ${#DELETED[@]} -gt 0 ]]; then
  echo "  削除したブランチ: ${DELETED[*]}"
else
  echo "  削除したブランチ: なし"
fi
if [[ ${#REMOTE_DELETED[@]} -gt 0 ]]; then
  echo "  削除したリモートブランチ: ${REMOTE_DELETED[*]}"
fi
if [[ ${#RECOVERED[@]} -gt 0 ]]; then
  echo "  回収した孤立ディレクトリ: ${RECOVERED[*]}"
fi
for s in "${SKIPPED[@]:-}"; do
  [[ -n "$s" ]] && echo "  ⚠ skip: $s"
done
echo
if [[ "$DRY_RUN" == 1 ]]; then
  echo "（--dry-run のため実際の変更は行っていません）"
else
  echo "反映には Claude Code の再起動（または /reload-plugins）が必要です。"
fi
