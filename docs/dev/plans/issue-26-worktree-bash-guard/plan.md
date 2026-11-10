# Plan: issue-26-worktree-bash-guard

## Requirements Summary

Issue [#26](https://github.com/yukimnb/enso/issues/26) を解消する。

worktree セッション中、Claude Code 組み込みの **worktree 隔離ガード**が「worktree の外に出ないことを静的に検証できない Bash」を事前拒否する。ガードは enso 側から無効化も緩和もできない（`settings.json` の `permissions` でも hooks でもハーネスの事前拒否より手前に入れない）。したがって「拒否されないようにする」修正は存在しない。

一方、**発生させないこと**はできる。ガードが反応するのは次の書き方に限られる。

- コマンドの連結（`cd A && cmd` / `cmd1; cmd2`）
- ヒアドキュメントによるファイル生成（`cat > file <<'EOF' ... EOF`）
- 1回の Bash 呼び出しに複数の処理を詰め込む書き方
- コマンド置換を含む形（`git -C "$(git rev-parse --show-toplevel)" add ...`）

ところが enso のスキル定義にはこの制約が書かれていない。そのためモデルの書き方次第で毎回のように拒否が起き、その都度リトライで 2 ターン前後を失う。

**ゴール**: worktree セッション中に Bash を打つ dev-* スキルとユーザー向けドキュメントに、この制約を明文化する。あわせて、ガードと噛み合っていない既存規約「Bash コマンドはプロジェクトルートの絶対パスを使用する（`$(git rev-parse --show-toplevel)` でルートを取得）」を整理する。

**スコープ外**:

- hooks・スクリプト・`plugin.json` の変更（ドキュメント/スキル定義のみの変更）
- ガードの無効化・緩和（不可能。Claude Code 側への要望でもない）
- worktree で動かないスキル（`bug-analysis` / `impact-analysis` などの分析系、`dev-init` / `dev-context` など）の絶対パス規約。Issue の対象外なので触らない

## Design Overview

### 共通文言（正）

以下を**この Plan における唯一の正**とし、各スキルへは転記して配置する。Issue 本文の文言案に、実際に拒否された「コマンド置換」の 1 項目を足したもの。

> **worktree セッション中の Bash は「単一の、単純なコマンド」に限る。** 🔵
> Claude Code の worktree 隔離ガードは、worktree の外に出ないことを静的に検証できないコマンドを拒否する。次を使わない:
>
> - コマンドの連結（`cd A && cmd` / `cmd1; cmd2`）— worktree ルートから 1 コマンドずつ実行する
> - ヒアドキュメントによるファイル生成 — **ファイルの作成・編集は Write / Edit ツールを使う**
> - コマンド置換でパスを組み立てる形（`git -C "$(git rev-parse --show-toplevel)" ...`）— **worktree ルートの確定した絶対パスを直接書く**
>
> 拒否されたら書き方を変えて再実行する。ガードは無効化できない。

**なぜ共通ファイルに切り出して参照させないか** 🔵: `skills/` はインストール後 `~/.claude/skills/enso/skills/` に配置され、スキル間の相対パス参照は成立しない。参照させると解決できないパスを読ませることになるため、**各スキルに転記する**。正は本 plan.md に置き、変更時はここを起点に横展開する。

### 配置方針

| ファイル | 置き方 | 理由 |
|---|---|---|
| `skills/dev-plan/SKILL.md` Phase 0.7 | 全文 | worktree に入った直後に提示できる唯一の箇所 |
| `skills/dev-run/SKILL.md` 「ルール・制約」 | 全文 | 実装ループの本体。最も Bash を打つ |
| `skills/dev-impl/SKILL.md` 「ルール・制約」 | 全文 | ファイル生成が最多。ヒアドキュメントの誘惑が強い |
| `skills/dev-debug` / `dev-verify` / `dev-cleanup` / `dev-loop` | 1行の再掲 | worktree 内で走るが Bash の量は中程度。全文の重複は避ける |
| `MANUAL.md` | 運用上の注意 | 利用者が拒否メッセージを見たときの参照先 |

**worktree に入る箇所（dev-plan Phase 0.7）と Bash を多用する箇所（dev-run / dev-impl）が離れている**ため、一度の提示では足りない。両方に置く。

### 既存規約との整理 🟡

現在の各スキルの「ルール・制約」末尾にある

```
- Bash コマンドはプロジェクトルートの **絶対パス** を使用する（`$(git rev-parse --show-toplevel)` でルートを取得）
```

は、**規約自体がガードに引っかかる**。worktree セッションで走る dev-* スキルに限り、次の主旨へ差し替える。

```
- Bash コマンドはプロジェクトルートの **絶対パス** を使用する。worktree セッション中は
  `$(git rev-parse --show-toplevel)` のようなコマンド置換を使わず、worktree ルートの
  確定した絶対パスを直接書く（ガードに拒否されるため）
```

「絶対パスを使う」という意図（誤ったディレクトリへの書き込み防止）は維持し、**取得方法だけを変える**。`dev-loop` の `git -C "$(git rev-parse --show-toplevel)"` と `dev-plan` の Phase 4 / 5b のコマンド例も同じ理由で書き換える。

**差し替え対象を worktree 内で走るスキルに限る**のは、分析系スキル（`bug-analysis` 等）が worktree の外でも実行され、そこではコマンド置換が有効かつ簡便なため。Issue の対象範囲でもない。

## Task Dependency Graph

```
001（共通文言の確定 + dev-plan Phase 0.7）
 ├─→ 002（dev-plan の絶対パス規約とコマンド例の整理）
 ├─→ 003（dev-run / dev-impl に全文を追加）
 ├─→ 004（dev-debug / dev-verify / dev-cleanup / dev-loop に再掲）
 └─→ 005（MANUAL.md に運用上の注意を追加）
```

001 が共通文言を確定させ、002〜005 はそれを転記する。002〜005 の間に依存はない。

## Cross-Plan Dependencies

なし。他の Plan と共有するインターフェースを持たない。
