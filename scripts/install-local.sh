#!/usr/bin/env bash
#
# このリポジトリを個人用プラグインとして ~/.claude/skills/enso に投入する。
#
#   ./scripts/install-local.sh              # 投入・更新
#   ./scripts/install-local.sh --uninstall  # 撤去
#   ./scripts/install-local.sh --dry-run    # 差分だけ確認する
#
# Claude Code がプラグインを探索するのは `.claude/skills/*` のみで、
# それ以外のディレクトリ名に置いても読み込まれない。user スコープに置くため
# 全プロジェクトから利用でき、プロジェクト側の設定は一切不要になる。
#
# コピー方式のため、リポジトリを編集しただけでは反映されない。
# 反映したいタイミングで本スクリプトを再実行する。
# 反映には Claude Code の再起動（または /reload-plugins）が必要。

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_ROOT="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"

UNINSTALL=0
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --uninstall) UNINSTALL=1 ;;
    --dry-run)   DRY_RUN=1 ;;
    -h|--help)   sed -n '2,16p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *)           echo "unknown option: $arg" >&2; exit 1 ;;
  esac
done

# plugin.json の "name" / "version" を取り出す（jq に依存しない）
manifest_field() {
  sed -n "s/.*\"$2\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" "$1/.claude-plugin/plugin.json" | head -1
}

NAME="$(manifest_field "$REPO" name)"
VERSION="$(manifest_field "$REPO" version)"
DEST="$DEST_ROOT/$NAME"

[[ -n "$NAME" ]] || { echo "✘ .claude-plugin/plugin.json から name を読めません" >&2; exit 1; }

if [[ "$UNINSTALL" == 1 ]]; then
  rm -rf "$DEST"
  echo "✔ removed  $NAME  ($DEST)"
  echo
  echo "次回セッションから読み込まれなくなります。"
  exit 0
fi

# シンボリックリンクが残っていると rsync がリンク先を書き換えてしまうため先に除去
[[ -L "$DEST" ]] && rm -f "$DEST"
mkdir -p "$DEST"

# plugin.json が参照するディレクトリだけを同期する。
# --delete により、リポジトリ側から消えたスキルは投入先からも消える。
SOURCES=("$REPO/.claude-plugin")
STALE=()
# commands / agents は廃止済み。過去の投入先に残ったディレクトリを STALE で掃除するためだけに列挙している。
for d in commands skills agents hooks; do
  if [[ -d "$REPO/$d" ]]; then
    SOURCES+=("$REPO/$d")
  elif [[ -d "$DEST/$d" ]]; then
    # rsync の --delete は転送したツリーの内側しか掃除しない。
    # リポジトリから消えたディレクトリ自体は投入先に残り続けるので明示的に消す。
    STALE+=("$d")
  fi
done

for d in "${STALE[@]}"; do
  if [[ "$DRY_RUN" == 1 ]]; then
    echo "*deleting  $d/ （リポジトリに存在しないため投入先から削除）"
  else
    rm -rf "${DEST:?}/$d"
    echo "✔ removed  $d/ （リポジトリに存在しないため投入先から削除）"
  fi
done

RSYNC_OPTS=(-a --delete --exclude '.git' --exclude '.DS_Store')
[[ "$DRY_RUN" == 1 ]] && RSYNC_OPTS+=(--dry-run --itemize-changes)

rsync "${RSYNC_OPTS[@]}" "${SOURCES[@]}" "$DEST/"

if [[ "$DRY_RUN" == 1 ]]; then
  echo
  echo "（--dry-run のため書き込みは行っていません）"
  exit 0
fi

echo "✔ installed  $NAME  v$VERSION  →  $DEST"
echo
echo "反映には Claude Code の再起動（または /reload-plugins）が必要です。"
echo "確認: claude plugin list"
