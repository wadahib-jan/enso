# 検証レポート: issue-24-approval-gate-record

実行日: 2026-09-09

## ゲート

| 項目 | 結果 |
|---|---|
| タスク | 5/5 完了 |
| テスト | N/A（このリポジトリに単体テストは無い。代わりに hook を実際に起動して確認した） |
| カバレッジ | N/A |
| ビルド | N/A |
| Lint（`pnpm check` / Biome） | OK — Checked 14 files, no fixes applied |
| 機密情報（`pnpm secretlint`） | OK |
| 500行ルール | OK（最大 386 行: `skills/dev-plan/SKILL.md`） |

## 確認項目の結果

### 001 — policy.mjs の承認記録の読み取り基盤

疑似 `loop-state.yaml` を作り、`hooks/lib/policy.mjs` を直接 import して確認した。

| 確認項目 | 結果 |
|---|---|
| `merge_approved_at` が `findLoopStates()` で読める | OK |
| `findLoopStateForPr(root, { prNumber: "24" })` が該当計画を返す | OK |
| 数値の `prNumber: 24` でも一致する | OK |
| `branch` 指定で一致する | OK |
| 該当なしで `null`（例外を投げない） | OK |
| `docs/dev/plans` が無いディレクトリでも `null` | OK |
| `approvalStatus(undefined/""/"null")` → `missing` | OK |
| 解釈できない文字列 → `invalid` | OK |
| 25 時間前 → `stale` / 23 時間前 → `ok` / 未来 → `ok` | OK |

### 002 — guard-bash.mjs の `gh pr merge` ガード

疑似プロジェクトに stdin JSON を流して hook を起動し、判定を確認した。

| 確認項目 | 結果 |
|---|---|
| 記録の無い計画の PR → `deny`、理由に `dev-cleanup` Step 3 への誘導を含む | OK |
| 承認直後の記録がある PR → 素通り | OK |
| 25 時間前の記録 → `deny`（「記録が古すぎます」） | OK |
| 対応する `loop-state.yaml` が無い PR → `ask`（`deny` ではない） | OK |
| `enforce.flow: false` → 一切介入しない | OK |
| `.claude/enso.json` が無いプロジェクト → 無出力で exit 0 | OK |
| `echo "gh pr merge 99"` の偽陽性で発火しない | OK |
| ブランチ名指定（`gh pr merge worktree-beta`）で解決する | OK |
| URL 指定（`.../pull/24`）で番号を拾う | OK |
| 対象省略（`gh pr merge`）で現在のブランチから解決する | OK（本 worktree で実地確認。PR 27 / 計画 issue-24-approval-gate-record を特定した） |

実地確認（本 worktree、記録を書く前の状態）:

```
$ gh pr merge 27 --merge
deny: enso 強制モード: マージ承認の記録がありません。
      対象の計画: issue-24-approval-gate-record
```

### 003〜005 — スキル定義とドキュメント

| 確認項目 | 結果 |
|---|---|
| `dev-cleanup` に Step 3.5（記録の書き込み・コミット・push）がある | OK |
| Step 3 の選択肢が Step 3.5 へ繋がり、「いいえ」では記録を書かないと定義されている | OK |
| コミットする理由（Step 6 の skip 回避）が記述されている | OK |
| `dev-cleanup` のルールに「記録を書かずにマージへ進まない」「先回りして書かない」がある | OK |
| `dev-plan` 5d に「承認フィールドはここでは書かない」と明記 | OK |
| `dev-plan` 5e で「はい」のとき `impl_approved_at` を記録すると定義 | OK |
| `dev-loop`「状態ファイル仕様」に2フィールドと承認フィールド節がある | OK |
| 「フィールドが無い＝未承認であって古い形式ではない」が両方に書かれている | OK |
| `MANUAL.md`「何が起きるか」に `gh pr merge` の行がある | OK |
| `MANUAL.md` の `flow` の説明が新ガードを含む | OK |
| `MANUAL.md` に承認記録の節（判定表・回避方法・`ask` に落ちる条件）がある | OK |
| `README.md` の強制モード概要に1行追加されている | OK |

## 既存挙動の退行確認

| 確認項目 | 結果 |
|---|---|
| worktree 内の `git commit` / `gh pr create` が通る | OK（無出力） |
| `git worktree remove` が確認プロンプトに落ちる | OK（`ask`） |
| `gh pr ready` のセキュリティ検査が従来どおり動く | OK |
| `guard-edit.mjs` が worktree 内の編集を通す | OK |
| `policy-context.mjs` がコンテキストを注入する | OK |

## 🟡 要確認

- `hooks/lib/policy.mjs` — 鮮度の既定値 `APPROVAL_MAX_AGE_HOURS = 24` は定数。設定項目にはしていない（Issue の例示どおり）
- `hooks/guard-bash.mjs` — 新ガードを `enforce.flow` に紐づけた。Issue はフラグを指定していないため、`worktree` / `security` と独立に切れる `flow` を選んだ
- `hooks/guard-bash.mjs` — 対応する `loop-state.yaml` が見つからない場合は `enforce.mode` に関わらず `ask`。enso 管理外の PR を締め出さないための意図的な緩和

## 🔴 要判断

なし。

## 補足

hooks は**セッション開始時に読み込まれる**ため、この変更が実際のガードとして効くのは `install-local.sh` による投入と Claude Code の再起動のあとになる。マージ直後の `dev-cleanup` はまだ旧 hook で動く。
