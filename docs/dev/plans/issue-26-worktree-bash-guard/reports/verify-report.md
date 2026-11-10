# 検証レポート: issue-26-worktree-bash-guard

実行日: 2026-09-09

## ゲート

| 項目 | 結果 | 備考 |
|---|---|---|
| タスク | 5/5 完了 | 001〜005 |
| テスト | N/A | 本リポジトリに単体テストは無い（context.md 参照） |
| カバレッジ | N/A | 同上 |
| ビルド | N/A | ビルド工程なし |
| secretlint | OK | `pnpm secretlint` 検出なし |
| Biome (`pnpm check`) | OK | Checked 14 files, no fixes applied（`.md` は対象外） |
| 500行ルール | OK | 変更した SKILL.md の最大は dev-plan の 390 行 |

変更後の行数:

| ファイル | 行数 |
|---|---|
| `skills/dev-plan/SKILL.md` | 390 |
| `skills/dev-run/SKILL.md` | 279 |
| `skills/dev-impl/SKILL.md` | 249 |
| `skills/dev-debug/SKILL.md` | 287 |
| `skills/dev-verify/SKILL.md` | 163 |
| `skills/dev-cleanup/SKILL.md` | 260 |
| `skills/dev-loop/SKILL.md` | 210 |

## タスク別の確認結果

### 001 — dev-plan Phase 0.7 に制約の提示を追加

- [x] Phase 0.7 に共通文言が全文含まれる（手順 5 として追加）
- [x] 3つの禁止パターン（連結 / ヒアドキュメント / コマンド置換）を列挙
- [x] 「ファイルの作成・編集は Write / Edit ツールを使う」を明記
- [x] 「enso 側では無効化も緩和もできない」と明記。Claude Code の設定変更を促す記述なし
- [x] 追加箇所は Phase 0.7 内（Phase 1 以降に混入していない）
- [x] worktree を作らなかった場合（git リポジトリでない / EnterWorktree 失敗）に適用されない旨を明記

### 002 — dev-plan の絶対パス規約とコマンド例の整理

- [x] 「ルール・制約」の絶対パス行を差し替え。「絶対パスを使う」意図は維持し取得方法のみ変更
- [x] Phase 4 の `mkdir` 例から `$(git rev-parse --show-toplevel)` を除去
- [x] Phase 5b の `git add` / `commit` / `push` から `$(...)` を除去し 1 コマンド 1 行に
- [x] `push` のブランチ名を `worktree-<plan-name>` の直書きに変更（Phase 0.5 で plan-name 確定済み）

### 003 — dev-run / dev-impl に制約本体を追加

- [x] 両ファイルの「ルール・制約」に共通文言を全文追加
- [x] `dev-impl` に「ファイル生成は Write / Edit ツール」を独立した1行として強調
- [x] 両ファイルの絶対パス行を差し替え
- [x] `dev-impl` の `wc -l` 例からコマンド置換を除去
- [x] `dev-impl` のクイックモード（worktree 外で起動されうる）に適用されない旨を明記
- [x] サブエージェント用プロンプトテンプレート3種（impl / debug / verify）にも制約を追加。`impl` と `verify` の `wc -l` 例からもコマンド置換を除去

### 004 — dev-debug / dev-verify / dev-cleanup / dev-loop に再掲

- [x] 4ファイルすべてに 1 行の再掲を追加。3つの禁止パターンと Write / Edit を維持
- [x] `dev-verify` 70行目・`dev-loop` 105/187行目のコマンド置換を解消
- [x] `dev-cleanup` 165行目の既存の注意書き（本体チェックアウトを対象にする理由）は保持
- [x] `dev-cleanup` は「Step 5 の `ExitWorktree` より前」と条件を明示し、worktree を出たあとの汎用手順（`MAIN="$(git worktree list ...)"`）には適用されないと明記
- [x] `dev-loop` の Step 2 の説明文からもコマンド置換の記述を除去

### 005 — MANUAL.md に運用上の注意を追加

- [x] 「worktree 隔離ガードによる Bash の拒否」節を強制モードの運用上の注意の直後に追加
- [x] 「enso 側では無効化も緩和もできない」と明記。無効化手順の案内なし
- [x] 回避方法3点（1コマンドずつ / Write・Edit / 絶対パス直書き）を記載
- [x] 拒否メッセージ全文を引用（メッセージで検索して辿り着ける）
- [x] 強制モードを使っていないプロジェクトでも `EnterWorktree` で同じ制約がかかる旨を記載
- [x] ガードを問題として書かず、安全機構として位置づけている

## 信号機サマリ

- 🔴 なし
- 🟡 2件
  - `dev-loop` を Issue の影響範囲表に無いが対象に追加した（187行目に Issue が名指しした形がそのまま規約化されていたため）
  - `dev-run` のサブエージェント用プロンプトテンプレート3種にも制約を追加した（サブエージェントも同じガードの下で動くため）
- 🔵 それ以外

## 残存事項

なし。分析系スキル（`bug-analysis` / `impact-analysis` 等）の絶対パス規約は worktree の外でも実行されるため意図的に変更していない（Issue の対象範囲外）。
