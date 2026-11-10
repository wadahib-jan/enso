# Plan: redundancy-cleanup

## Requirements Summary

Enso 本体の冗長な記述と無駄な処理を整理する。**第一優先はコードの整頓と無駄の排除**で、修正によってかえって複雑になる項目は対応せず、理由を「見送り」に記録する。増え続けるファイル（docs/dev/plans の蓄積、policy-context の状態一覧）への対策は本計画の対象外。

受け入れ条件:

- hooks の allow / deny / ask の判定結果を変えない
- スキルの手順・分岐・マーカー・パスの記述を失わない（言い直しと重複だけを削る）
- 削除・移動した記述への参照切れが無い
- `pnpm secretlint && pnpm check` が通る

## Design Overview

| 領域 | 方針 |
|---|---|
| 壊れた参照 | user スコープ配置で解決できない `.claude/skills/...` を、既存規約（スキルのベースディレクトリ基準）に揃える。絶対パスが要る箇所だけ `<skill-dir>` / `{{SKILL_DIR}}` で渡す |
| 矛盾 | 正本を決めて他を合わせる（worktree 内のコマンド置換禁止 = dev-plan、セキュリティチェック条件 = dev-loop、修正しない = dev-webtest Step 7） |
| 重複 | 正本を1つ残して他を参照にする。**そのステップで実行する指示は残し、言い直しだけを削る** |
| 大きな SKILL.md | 毎回は読まない本文だけを references へ移す（dev-init の質問ツリー） |
| hooks / scripts | 必要条件の先行評価で git 起動を減らす、未使用 export・重複式・重複 git 呼び出しの削除 |

### 挙動が変わる点（PR 本文に明記）

- secretlint の glob をクォートし、検査範囲が全階層に広がる（従来はシェル展開で `*/*` 相当）
- sync-after-merge.sh は rsync が無い場合、ブランチ・worktree の削除より前に止まる

### 見送り

| 項目 | 理由 |
|---|---|
| dev-run のプロンプトテンプレートを dev-impl / dev-debug の SKILL.md の Read に置き換える | サブエージェントで実行できない手順の例外指示が要り、毎タスク 11KB の Read が増える。代わりに CLAUDE.md に同期の注意を1行置く |
| Docker 停止手順の3重複 | 実行経路が別で、どれを消してもどこかでコンテナが止まらなくなる |
| 信号機定義の共通化 | 基準がスキルごとに異なる |
| MANUAL と enso-policy の設定キー表 | 読み手が違い、enso-policy 側を変えると `show` の出力が変わる |
| dev-webtest Step 1 の docker-setup.md への移動、error.md テンプレートの references 化 | 毎回実行する手順と必要時の手順書が混ざる／受け渡しが1段増える |
| dev-webtest-plan のモード別の表の統合、スキル間の共通 reference 化 | モードは独立と宣言され中身も重ならない／10行程度で参照が増えるだけ |
| Entry スキル（worktree 外で動く）のコマンド置換を含むコードブロック | 今のまま動き、書き換えるとプレースホルダの受け渡しが増える |
| guard-bash の branch -d/-D の2つの正規表現の統一 | 一部入力で ask の有無が変わる |
| findLoopStates の二重呼び出しの統合 | 公開関数の引数変更が要り、節約は readdir 1回 |
| sync-after-merge.sh の ls-remote のローカル ref 化、worktree 一覧のキャッシュ | dry-run / single-branch clone で判定が変わる／節約はローカル git 1回 |
| 設定未検出時の警告（print-enforce） | Node と sh の間の取り決めを増やす追加実装で、整理ではない |
| sh 側フォールバック既定値の削除、claude_docker/settings.local.json | Node 不在時等に使用中／MANUAL から参照される意図的なサンプル |
| pnpm-lock.yaml の追跡と CI の `--frozen-lockfile` | 依存の固定という別目的で install を伴うため、別 PR |

### 範囲外で見つかった別件（Issue 候補）

- ipa-security-check の検査系 `agents/*.md` 14体が orchestrator から読まれていない
- dev-run / dev-webtest-plan が前提不足時に「`/dev-plan` を案内して終了」している（Internal は突き返さない原則と不一致）
- dev-run テンプレートと dev-impl / dev-debug の内容が既にずれている（flaky / タイムアウト分類、Intent コメント維持）
- dev-loop 通常経路で dev-run Step 7 の `docker compose down` の後に dev-verify がテストを実行する
- `git branch --delete <b>` が guard-bash の削除確認に当たらない
- ipa-security-check（[reports/ipa-security-report-2026-09-14.md](reports/ipa-security-report-2026-09-14.md)）が検出した既存のガードの限界。いずれも本計画の変更で生じたものではない（早期 return は既存のマッチャーと同じ条件）
  - guard-bash のセグメント分割・先頭トークン判定が `FOO=1 git push` / `(git push)` / `bash -c "git push"` 等を認識しない（medium）
  - guard-bash のオプション解析が値付きオプション（`gh -R owner/repo pr merge`、`git -c a=b -c c=d -C path commit`）で位置判定を誤る（medium）
  - `gh pr ready` のセキュリティゲートが対象 PR の計画の reports/ に紐付いていない（low）
  - policy.mjs `relativeToRoot` が realpath を解決せず、シンボリックリンク経由の編集が除外パターンで通過し得る（low）

## Task Dependency Graph

```
001 スキル内パス規約 ─┬─> 006 状態・後始末の説明
003 フロー図・表記 ───┤
002 Bash 記述 ────────┼─> 007 dev-init / enso-issue-fix（001, 002, 003）
                      └─> 008 webtest 系（002, 003）
004 hooks（独立）
005 scripts・マニフェスト（独立）
```

同じ SKILL.md に触るタスクは依存を付けて順に実行する。各タスクの行番号は計画時点の目安で、先行タスク適用後は見出しと文言で位置を探す。

| ID | タイトル | 複雑度 |
|---|---|---|
| 001 | スキル内の壊れたパスをベースディレクトリ基準に統一する | medium |
| 002 | Bash のルート取得に関する記述の矛盾を解消する | low |
| 003 | 古いフロー図・食い違う記述・旧呼び出し表記を整理する | medium |
| 004 | hooks の無駄な git 起動と重複した式を整理する | medium |
| 005 | scripts・マニフェスト・開発者向け記述の無駄と食い違いを整理する | low |
| 006 | 状態ファイル・承認ゲート・後始末の重複した説明を削る | low |
| 007 | dev-init の質問ツリーを切り出し、enso-issue-fix の不要な節を削る | medium |
| 008 | webtest 系スキルのファイル内の重複をまとめる | low |

## Cross-Plan Dependencies

なし（増え続けるファイルへの対策は後続の計画で扱う）。
