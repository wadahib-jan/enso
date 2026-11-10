# IPA セキュリティチェック レポート: dev-cleanup

実行日: 2026-09-06
対象: 本 PR の差分（`worktree-dev-cleanup` と `main` の差分）

## スコープ解決の結果

| 変更ファイル | 種別 | 検査対象 |
|---|---|---|
| `hooks/guard-bash.mjs` | JavaScript (ESM) | ✅ **実行コード。重点対象** |
| `hooks/lib/policy.mjs` | JavaScript (ESM) | ✅ 実行コード |
| `skills/enso-policy/references/enso.json.template` | JSON | ✅ 設定ファイル |
| `skills/**/SKILL.md` / `README.md` / `MANUAL.md` | Markdown | 対象外（ただしスキルが指示する処理は追跡した） |
| `docs/dev/plans/**` | Markdown / YAML | 計画成果物（実行されない） |

前回（issue-skills）と異なり、**本 PR には実行コードの変更が含まれる**。しかも変更対象は**セキュリティガードそのもの**（`guard-bash.mjs`）であるため、通常の脆弱性カテゴリに加えて「**ガードのバイパス**」を重点的に検査した。

## 検出結果

| # | 重大度 | カテゴリ | 対象 | 状態 |
|---|---|---|---|---|
| 1 | **High** | アクセス制御の不備（ガードのバイパス） | `guard-bash.mjs` `branchDeletePushTargets` | ✅ 修正済み |
| 2 | **High** | アクセス制御の不備（ガードのバイパス） | `guard-bash.mjs` `destructiveTargets` | ✅ 修正済み |
| 3 | Medium | アクセス制御の不備（誤判定） | `guard-bash.mjs` `branchOfWorktree` | ✅ 修正済み |
| 5 | Medium | アクセス制御の不備（保護ブランチの削除） | `sync-after-merge.sh` 削除ループ | ✅ 修正済み |
| 4 | Low | OS コマンド・インジェクション | `guard-bash.mjs` `execFileSync` の使用 | ✅ 問題なし（確認のみ） |

1〜3 は**本 PR で新規に書いたコードの欠陥**。5 は既存コードの穴だが、**本 PR のリモートブランチ削除追加によって影響が拡大する**ため本 PR で対処した。

---

### 1. 複数 refspec によるブランチ削除ガードのバイパス（High）

| 項目 | 内容 |
|---|---|
| rule_id | `IPA-SWS-1-ACCESS-001`（手動検出） |
| カテゴリ | `access_control` |
| CWE | CWE-863（不適切な認可） |
| 対象 | `hooks/guard-bash.mjs` `branchDeletePushTargets`（旧 `branchDeletePushTarget`） |

**問題**

緩和のために追加した「ブランチ削除の push は worktree ガードを免除する」判定が、**削除対象を1つしか見ていなかった**。

```js
// 修正前
const long = segment.match(/\s(?:--delete|-d)\s+(?:\S+\s+)?(\S+)/);
if (long) return long[1];   // ← 最初の1つだけ
```

`git push` は複数の refspec を一度に処理できるため、**許可される名前を先頭に置いて保護ブランチを道連れに削除**できた。

```bash
git push origin --delete feature main    # feature を見て許可 → main も消える
git push origin :feature :main           # 同上
```

保護ブランチ（`main` / `master` / `develop`）をリモートから削除できてしまう。**worktree ガードの目的そのものを無効化する。**

**IPA 原典**

| | |
|---|---|
| document | 安全なウェブサイトの作り方 改訂第7版 |
| section | 1.11 アクセス制御や認可制御の欠落 |
| page | 51-54 |
| url | https://www.ipa.go.jp/security/vuln/websecurity/about.html |

**根本的解決**: 「認可判定を、処理対象すべてに対して行う」

**対応**

削除対象を**全件返す**関数に変更し、**1つでも保護ブランチが混じっていれば拒否**する。

```js
function branchDeletePushTargets(segment) { /* ... */ return targets; }

const deleted = branchDeletePushTargets(segment);
if (deleted.length > 0) {
  return deleted.some((branch) => protectedBranches.includes(branch));
}
```

`--delete` 以降のオペランドは、リモート名とブランチ名を確実に判別できないため**全てを対象とみなす**（安全側に倒す）。

---

### 2. 複数ブランチ指定による削除確認のバイパス（High）

| 項目 | 内容 |
|---|---|
| rule_id | `IPA-SWS-1-ACCESS-002`（手動検出） |
| カテゴリ | `access_control` |
| CWE | CWE-863 |
| 対象 | `hooks/guard-bash.mjs` `destructiveTargets`（旧 `destructiveTarget`） |

**問題**

「マージ済みなら確認を省く」緩和も、対象を1つしか見ていなかった。

```bash
git branch -D merged-branch unmerged-branch
# merged-branch を見て「マージ済み」と判定 → 確認を省略
# → 未マージの unmerged-branch が確認なしで消える
```

`-D` は強制削除なので、git 自身の未マージチェックも効かない。**未マージの作業が無言で失われる。**

**IPA 原典**: 上記1と同じ（1.11 アクセス制御や認可制御の欠落）

**対応**

対象を全件返し、**すべてがマージ済みと確認できたときだけ**確認を省く。

```js
const refs = isWorktreeRemove ? [branchOfWorktree(cwd, segment)] : destructiveTargets(segment);
if (refs.length === 0) return true;                      // 判定不能 → 確認する
return !refs.every((ref) => isMergedIntoBase(cwd, ref, base));
```

---

### 3. worktree パスの部分一致による誤判定（Medium）

| 項目 | 内容 |
|---|---|
| rule_id | `IPA-SWS-1-ACCESS-003`（手動検出） |
| カテゴリ | `access_control` |
| CWE | CWE-1023（比較ロジックの不完全性） |
| 対象 | `hooks/guard-bash.mjs` `branchOfWorktree` |

**問題**

worktree のパス照合に `endsWith` を使っていた。

```js
else if (line.startsWith("branch ") && path?.endsWith(target[1])) {
```

`git worktree remove cleanup` が `.../worktrees/dev-cleanup` に一致しうる。**別 worktree のマージ状態で判定し、未マージの worktree を確認なしで削除**する経路になる。

**IPA 原典**

| | |
|---|---|
| document | 安全なウェブサイトの作り方 改訂第7版 |
| section | 1.3 パス名パラメータの未チェック／ディレクトリ・トラバーサル |
| page | 17-20 |
| url | https://www.ipa.go.jp/security/vuln/websecurity/about.html |

**対応**

`resolve()` で絶対パスに正規化し、**完全一致**で突き合わせる。

```js
const wanted = resolve(cwd, operand);
// ...
if (line.startsWith("worktree ")) path = resolve(line.slice(9));
else if (line.startsWith("branch ") && path === wanted) { /* ... */ }
```

---

### 5. 保護ブランチが削除対象に含まれうる（Medium）

| 項目 | 内容 |
|---|---|
| rule_id | `IPA-SWS-1-ACCESS-004`（手動検出） |
| カテゴリ | `access_control` |
| CWE | CWE-863 |
| 対象 | `scripts/sync-after-merge.sh` マージ済みブランチ削除ループ |

**問題**

タスク 010 でリモートブランチ削除を追加した際に発見した。既存のループは `$BASE_BRANCH`（`main`）しか除外していない。

```bash
while IFS= read -r branch; do
  [[ "$branch" == "$BASE_BRANCH" ]] && continue    # main だけ
  if git_main merge-base --is-ancestor "$branch" "$BASE_BRANCH"; then
```

`develop` や `master` のような長命ブランチがローカルに存在し、`main` の祖先の位置にあれば「マージ済み」と判定されて**削除される**。

実際に使い捨てリポジトリで再現した。

```
=== 各ブランチが main の祖先か（＝旧ロジックでの削除対象か）
  develop: 祖先（旧ロジックなら削除される）
  feature: 祖先（旧ロジックなら削除される）
```

**ローカル削除だけなら reflog から復旧できるが、リモートも消すと影響が大きく変わる。** タスク 010 のリモート削除追加が、この既存の穴を増幅する形になっていた。

**IPA 原典**

| | |
|---|---|
| document | 安全なウェブサイトの作り方 改訂第7版 |
| section | 1.11 アクセス制御や認可制御の欠落 |
| page | 51-54 |
| url | https://www.ipa.go.jp/security/vuln/websecurity/about.html |

**対応**

`.claude/enso.json` の `enforce.protectedBranches` と揃えた除外リストを追加した。

```bash
PROTECTED_BRANCHES=("main" "master" "develop")

is_protected() { ... }

while IFS= read -r branch; do
  [[ "$branch" == "$BASE_BRANCH" ]] && continue
  is_protected "$branch" && continue
```

検証で `develop` が対象外になり、`feature` のみが削除対象になることを確認した。

**残存（🟡）**: 除外リストはスクリプト内にハードコードしており、`.claude/enso.json` の設定を読んでいない。既定値と一致しているため現状は問題ないが、`protectedBranches` をカスタマイズしたプロジェクトでは乖離する。スクリプトは enso 専用であり enso は既定値を使っているため、JSON パースの依存を増やすより固定値のほうが妥当と判断した。

---

### 4. `execFileSync` の使用（Low・問題なし）

| 項目 | 内容 |
|---|---|
| カテゴリ | `os_command_injection` |
| CWE | CWE-78 |
| 対象 | `hooks/guard-bash.mjs` `isMergedIntoBase` / `branchOfWorktree` |

**確認内容**

hook はユーザーが打った Bash コマンド文字列を受け取り、そこから抽出したブランチ名・パスを `git` に渡す。文字列の出所が信頼できないため、コマンド実行の形を検査した。

```js
execFileSync("git", ["merge-base", "--is-ancestor", ref, baseBranch], { cwd, stdio: "ignore" });
```

**問題なし。** `execFileSync` は引数配列を渡す形式で**シェルを経由しない**（`shell: true` を指定していない）。`ref` に `; rm -rf /` のような文字列が入っても、`git` の引数として渡るだけで解釈されない。

**IPA 原典**

| | |
|---|---|
| document | 安全なウェブサイトの作り方 改訂第7版 |
| section | 1.2 OS コマンド・インジェクション |
| page | 13-16 |
| url | https://www.ipa.go.jp/security/vuln/websecurity/about.html |

**根本的解決**: 「シェルを起動できる言語機能の利用を避ける」— すでに満たしている。

念のため `ref` に `!!bad!!` を渡す検証を行い、`git` がエラーを返して `false`（＝確認する）にフォールバックすることを確認した。

---

## 検証

修正後、`guard-bash.mjs` から関数定義を抽出して実データで 24 ケースを評価した。

```
=== 緩和1: ブランチ削除の push（8件）           全て ok
=== バイパス防止: 複数 refspec（5件）           全て ok
=== 緩和2/3: 全対象マージ済みのときだけ省く（5件） 全て ok
=== branchOfWorktree のパス完全一致（4件）       全て ok
=== 例外時のフォールバック（2件）                全て ok

ALL PASS  pass=24 fail=0
```

**緩和が広がりすぎていないことも確認済み。**

| ケース | 結果 |
|---|---|
| `git push origin worktree-x`（通常の push） | 拒否 |
| `git commit -m "x"` | 拒否 |
| `git push origin HEAD:main`（削除でない） | 拒否 |
| `echo "git push"`（偽陽性） | 対象外 |

## 偽陽性候補

なし。

## サマリ

| 重大度 | 件数 | 対応済み |
|---|---|---|
| Critical | 0 | — |
| High | 2 | 2 |
| Medium | 2 | 2 |
| Low | 1 | 1（確認のみ、修正不要） |

**未対応の指摘は無い。** 指摘5に軽微な残存（除外リストのハードコード）があるが、enso 専用スクリプトであり既定値と一致しているため許容する。

## 検査の限界

- 自動シグネチャによるスキャンは実施していない。変更された JS はセキュリティガード自体であり、汎用シグネチャより「ガードのバイパス」の観点で手動追跡するほうが有効と判断した
- **hook としての実行経路は未検証。** 検証したのは判定ロジックであり、stdin の JSON パースから `emitDecision` の出力までの経路は、投入・再起動後でないと確認できない
- `dev-cleanup` スキル本体は Markdown であり、実行されるのは Claude がそれを読んで組み立てるコマンドである。スキル本文が指示する処理の入力経路（PR 番号・ブランチ名）は追跡したが、網羅性は保証されない
