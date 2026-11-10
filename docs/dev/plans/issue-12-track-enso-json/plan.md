# Plan: issue-12-track-enso-json

対象 Issue: [#12](https://github.com/yukimnb/enso/issues/12) — `enso-policy: .claude/enso.json を git 管理下に置く手順が無く、未追跡のまま残る`（label: bug）

## Requirements Summary

`skills/enso-policy/SKILL.md` の ルール・制約 は「`.claude/enso.json` は git 管理下に置く」と要求しているが、`init` ワークフローに**それを実施する手順が無い**。結果として設定ファイルが未追跡のまま残る。

### スコープ（ユーザー指示により Issue #12 から拡張済み）

当初は Issue #12 の範囲（追跡手順の追加）のみだったが、レビューでの合意により次の1点を追加した。

1. **`enso-policy init` が設定ファイルを追跡下に置き、PR まで作成する**（当初計画の「`git add` 止まり」から変更）

**この拡張は Issue #12 の記述を超える。** PR 本文にその旨を明記する。

いったん検討した「`set` サブコマンドの新設」と「`init` 後の設定変更の PR 化」は、ユーザー判断により**取り下げた**（「スコープ外にしたもの」参照）。

### 確認済みの事実

| 確認項目 | 結果 |
|---|---|
| 症状の再現 | `?? .claude/enso.json` が出る（再現） |
| ignore されているか | **されていない。** `.gitignore` は `.claude/settings.local.json` と `.claude/worktrees/` のみ。単に追跡されていないだけ |
| 原因の所在 | `init` の Step 4（生成）と Step 5（`.gitignore` 追記）の間に追跡手順が無い |
| 設定スキーマの正 | `hooks/lib/policy.mjs` の `DEFAULT_ENFORCE`（9キー）。`SKILL.md` の表・`references/enso.json.template` と一致している |
| ファイル編集のガード | `.claude/enso.json` は `ALWAYS_ALLOWED`。**編集は保護ブランチ上でも通る** |
| コミット／PR のガード | `worktreeViolation` は `git.inWorktree && !onProtected` を要求。**ブランチを切るだけでは不足。worktree の中である必要がある** |

## Design Overview

原因はスキル定義（Markdown）の欠落であり、hooks の JS ロジックの不具合ではない。**`hooks/` は一切変更しない。**

### スコープ: `init` だけを PR 化する

対象は **`init` の1経路のみ**。`set` の新設と、`init` 後の設定変更（`enable` / `disable`）の PR 化は**今回のスコープ外**（「スコープ外にしたもの」参照）。

```
init ─→ SKILL.md の init ワークフローに直接記述
          ├─ 作業環境の判定（worktree が要るか）
          ├─ 追跡下に置く
          ├─ コミット
          └─ push + PR 作成
```

**`references/` には切り出さない。** 呼び出し元が `init` 1つだけなので、別ファイルにすると参照の往復が増えるだけで利点が無い。`SKILL.md` は現状 100 行程度、上限 500 行なので直書きで収まる。

### 作業環境の判定（この設計の要）

`worktreeViolation` の条件から、**強制モードが既に有効なプロジェクトでは worktree の中でないとコミットできない**。一方 `init` の初回実行時は設定ファイルがまだ無く、hooks はセッション開始時に読み込まれるため強制モードは効いていない。そこで条件分岐する。

| 現在の状態 | 作業環境 | 理由 |
|---|---|---|
| git リポジトリでない | 何もしない（ファイル書き換えのみ） | ブランチも PR も作れない |
| `enso.json` が無い / `enabled: false` | **ブランチを切るだけ** | ガードが効いていないので worktree は過剰 |
| `enabled: true` かつ `worktree: true` | **`EnterWorktree` で worktree に入る** | 保護ブランチ上・worktree 外のコミットは deny される |
| `enabled: true` かつ `worktree: false` | ブランチを切るだけ | worktree ガードが無効 |

**`dev-plan` は経由しない。** 設定変更に計画とタスク分解は要らず、`init` は「強制モードをこれから有効にする」場面なので `dev-plan` 経由を要求すると循環する。

### 段階的縮退（PR まで到達できない場合）

強制せず、到達できたところで止めてユーザーに残りを伝える。**ここで中断しない。**

| 不足 | 到達点 |
|---|---|
| git リポジトリでない | ファイル書き換えのみ |
| リモートが無い / `gh` 未認証 | ブランチにコミットまで。PR は作らず手順を案内 |
| すべて揃っている | PR 作成まで |

### スコープ外にしたもの

| 見送るもの | 判断 |
|---|---|
| `set` サブコマンドの新設 | 不要。設定値の変更は従来どおり手編集または `enable` / `disable` で足りる |
| `init` 後の設定変更（`enable` / `disable`）の PR 化 | 一旦見送る。従来どおりファイルを書き換えるだけで、PR は作らない |

**これによりスコープが 8 タスク → 5 タスクに縮んだ。** `set` と `enable` / `disable` が落ちたことで共通手順の切り出し（旧 001）も不要になり、`init` のタスクに統合した。

### 見送りで残る既知のギャップ

**`enable` / `disable` は追跡下のファイルを書き換えるため、実行すると作業ツリーに差分が出る。** うっかりコミットすると全員のガード設定が変わる。これは「追跡する」判断に伴う副作用で、今回は未対応のまま残る。

対処するなら別 Issue で、`disable` 実行時に「この変更はコミットしないこと」を警告する1行を足すのが最小の手当てになる。

一方、**`init` だけを PR 化する分には反映タイミングの問題は起きない。** `init` は初回セットアップであり、どのみち反映には Claude Code の再起動が要る。マージまで反映されないことが実害になるのは `disable` を緊急回避に使う場合で、それは今回スコープ外。前回論点に挙げた `--no-pr` の要否も、あわせて不要になった。

### 変更しないもの

- `hooks/` 配下すべて — 本 Issue は hooks の不具合ではない。設定変更のコミットをガードから除外する案（guard-bash に staged パス判定を足す）は 🟡 の代替案として PR に記載するにとどめる
- `.gitignore` — `.claude/enso.json` は既に ignore 対象外
- `references/enso.json.template` — 雛形の内容に問題は無い
- `.claude-plugin/plugin.json` — スキルの増減が無いため不要

## Task Dependency Graph

```
001（init が追跡下に置き PR を作る）→ 004（README / MANUAL）─┐
                                                             ├→ 005（品質ゲート）
002（enso 本体の enso.json を追跡）──────────────────────────┤
003（sync-after-merge.sh の判定）────────────────────────────┘
```

| ID | タイトル | 複雑度 | 依存 | 確信度 |
|---|---|---|---|---|
| 001 | `init` が enso.json を追跡下に置き PR を作るようにする | medium | — | 🟡 |
| 002 | enso 本体の `.claude/enso.json` を追跡下に置く | low | — | 🔵 |
| 003 | `sync-after-merge.sh` の本体未コミット判定を追跡済みファイルに絞る | low | — | 🟡 |
| 004 | README / MANUAL に `init` の PR 化を反映 | low | 001 | 🔵 |
| 005 | 品質ゲートとドキュメント整合の確認 | low | 001-004 | 🔵 |

001 / 002 / 003 は互いに独立。**Issue #12 の実害を直接消すのは 002** なので、単独で先に流してもよい。

## Cross-Plan Dependencies

**PR [#13](https://github.com/yukimnb/enso/pull/13)（`dev-cleanup`）は 2026-09-06 に main へマージ済み。** 本ブランチはその main を取り込み済みで、**ファイルの競合はゼロ**（本ブランチは計画ファイルしか変更していないため）。

ただし #13 は想定より広く触れており、本計画の前提が4点ずれた。以下は反映済み。

| #13 が変えたもの | 本計画への影響 | 反映先 |
|---|---|---|
| `enforce.mergeMethod` を新設（`policy.mjs` / `SKILL.md` の表 / 雛形 / `MANUAL.md` の表） | `init` の対話項目が1つ増えた（既存手順なので触らない）。enso 自身の設定ファイルに揃えるか判断が要る | 001 / 002 |
| `scripts/sync-after-merge.sh` にリモートブランチ削除を追加 | **未コミット判定の2箇所には未着手。** 003 は有効なまま。行番号のみ 46→51 / 104→119 にずれた | 003 |
| `MANUAL.md` に `dev-cleanup` を 6 番で挿入、`dev-impl` 以降が繰り下がり | セクション番号を触らない方針は維持。`README.md` の一覧表が 129→130 にずれた | 004 |
| `hooks/guard-bash.mjs` のガード緩和（130+/11-） | **緩和はブランチ削除 push と破壊的操作の確認のみ。** `commit` / `push` / `gh pr create` の worktree 判定は健在で、**001 の作業環境判定の前提は変わらない** | 変更不要 |

### 新たに判明した作業（#13 のマージで見えたもの）

- **`MANUAL.md:91`** に `SKILL.md` の ルール・制約 と同じ「`.claude/enso.json` は git 管理下に置いてください」という記述がある。Issue #12 が指摘した食い違いの片割れであり、`init` の自動化に合わせて直さないとドキュメント間に矛盾が残る → **004 に追加**
- **enso 自身の `.claude/enso.json` に `mergeMethod` が無い**（#13 より前に作られたため）。追跡下に置いて正典にする以上、雛形と同じ全キー列挙に揃えるかを判断する必要がある → **002 に 🟡 として明記**

### dev-cleanup との関係（新規）

`dev-cleanup` は PR のマージと後始末を担う。本計画の `init` が作る設定 PR も、マージは `dev-cleanup` に載る。**役割は重ならない**（本計画は PR を作る側、`dev-cleanup` は畳む側）。
