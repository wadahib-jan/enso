---
id: "004"
title: "README.md のスキル一覧を Entry / Internal に再編する"
status: done
priority: 3
dependencies: ["001", "002"]
estimated_complexity: low
---

# Task: README.md のスキル一覧を Entry / Internal に再編する

## Goal

README.md の「利用可能なコマンド」を、人が呼ぶスキルと内部スキルが一目で区別できる構成に再編する。読者が「自分が打つのはどれか」を迷わない状態にする。

## Interfaces

**変更 A: 「Dev Skills」テーブルの分割** 🔵

現行の13行1テーブル（`README.md:71-90`）を2テーブルにする。

```
### Dev Skills（統合開発ワークフロー）

（前置き）

#### 人が呼ぶスキル
| dev-init | dev-plan | dev-loop | dev-cleanup | dev-screen-spec | dev-webtest |

#### 内部スキル（他スキルから自動的に呼ばれる）
| dev-context | dev-impl | dev-run | dev-verify | dev-debug | dev-webtest-plan |
```

内部スキルのテーブルには「呼び出し元」列を設け、`dev-navigate` の行は削除する。内部スキル節の冒頭に、これらは通常ユーザーが直接打つ必要がなく、`/enso:<name>` で明示的に呼ぶこともできる旨を1文で添える。

**変更 B: ユーティリティスキル節** 🔵

```diff
  | スキル | 説明 |
  |-------|------|
- | `dev-navigate` | やりたいことをヒアリングし、最適なスキルと実行順序を案内 |
  | `enso-policy` | プロジェクトごとの強制モード設定（worktree/PR ガード） |
```

**変更 C: クイックスタートの整理** 🔵

「Dev Skillsによる開発フロー（既存プロジェクト）」（`README.md:171-188`）から手順1（`/enso:dev-context`）と手順2（`/enso:dev-navigate`）を削除し、`dev-plan` から始まる形に採番し直す。

「Webテストフロー」の手順2（`/enso:dev-webtest-plan`）は内部スキルになるため、`dev-plan` の出力から自動生成される旨の注記に置き換えるか、明示実行例として残す場合はその旨を添える。

「Dev Skillsによる開発フロー（新規プロジェクト）」の手順3（`/enso:dev-run`）・手順4（`/enso:dev-verify`）も内部スキルになるため、`dev-loop` に一本化した流れへ差し替える。

**維持** 🔵: 「分析スキル」「Issue 連携」「リバースエンジニアリングスキル」の各節は全て Entry のため構成を変更しない。

## Test Strategy

- [ ] `grep -n "dev-navigate" README.md` が 0 件
- [ ] 「Dev Skills」節に「人が呼ぶスキル」と「内部スキル」の2テーブルが存在する
- [ ] 内部スキルのテーブルに `dev-context` / `dev-impl` / `dev-run` / `dev-verify` / `dev-debug` / `dev-webtest-plan` の6行があり、それぞれ呼び出し元が書かれている
- [ ] 人が呼ぶスキルのテーブルに `dev-init` / `dev-plan` / `dev-loop` / `dev-cleanup` / `dev-screen-spec` / `dev-webtest` の6行がある
- [ ] クイックスタートのコマンド例に `/enso:dev-context` と `/enso:dev-navigate` が現れない
- [ ] エッジケース: README に列挙されたスキル名の集合が、実際の `skills/` 配下のディレクトリ名の集合と一致する（過不足なし）
- [ ] エッジケース: MANUAL.md へのアンカーリンク（`#dev-skills` / `#分析スキル` / `#issue-連携`）が 005 の再編後も解決する

## Implementation Notes

- 参照すべき既存コード: `README.md:69-135`（利用可能なコマンド）、`README.md:137-215`（クイックスタート）
- 005 で MANUAL.md の見出しを変更するため、README からのアンカーリンクが壊れないよう 005 と見出し名を揃える
- Biome は Markdown を対象外にするため整形上の制約はない

## Files

- 変更: `README.md`
- テスト: なし（grep による確認）
