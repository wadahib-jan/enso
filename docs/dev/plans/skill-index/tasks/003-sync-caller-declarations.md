---
id: "003"
title: "内部スキルの呼び出し元記述を実態に同期する"
status: done
priority: 2
dependencies: ["002"]
estimated_complexity: medium
---

# Task: 内部スキルの呼び出し元記述を実態に同期する

## Goal

各内部スキルの description と CLAUDE.md の Internal 一覧に書かれた呼び出し元を、SKILL.md で実際に内部実行されている関係に合わせる。README の一覧（004）が正しい情報を写せる土台を作る。

## Interfaces

**「呼び出し元」の定義**: 呼び出し元スキルの手順内で内部実行されるものだけを数える。「修正は dev-debug へ引き継ぐ」のような**案内は呼び出しに含めない**（🔵 CLAUDE.md の Internal 定義「呼び出し元と `/enso:<name>` の明示指定でのみ動く」に準拠）。

確定した呼び出し元（実測）:

```
dev-context       ← dev-plan / dev-impl / dev-run / dev-screen-spec / dev-webtest-plan   # 🔵 dev-verify を除去
dev-impl          ← dev-run                                                              # 🔵 dev-loop を除去
dev-run           ← dev-loop                                                             # 🔵 変更なし
dev-verify        ← dev-run / dev-loop                                                   # 🔵 変更なし
dev-debug         ← dev-run                                                              # 🔵 dev-loop / ipa-security-guide を除去
dev-webtest-plan  ← dev-webtest                                                          # 🔵 dev-plan を除去
ipa-security-check ← dev-loop                                                            # 🔵 enso-issue-fix を除去
task-breakdown    ← dev-plan（インライン適用）                                            # 🔵 変更なし
```

根拠（行番号は変更前のもの）:

| 変更 | 根拠 |
|---|---|
| `dev-context` から `dev-verify` を除去 | `skills/dev-verify/SKILL.md` に `dev-context` の内部実行が無い。実際に内部実行するのは dev-plan(`:24`) / dev-impl(`:232`) / dev-run(`:43`) / dev-screen-spec(`:100`) / dev-webtest-plan(`:99`) |
| `dev-impl` / `dev-debug` から `dev-loop` を除去 | `dev-loop` が直接起動するのは `dev-run`(Step 4) / `dev-verify`(Step 6) / `ipa-security-check`(Step 8) のみ。impl と debug は `dev-run` が内部で回す（`skills/dev-run/SKILL.md:3`） |
| `dev-webtest-plan` から `dev-plan` を除去 | `dev-plan` に `dev-webtest-plan` の記述が無い。内部実行するのは `dev-webtest`(`:166`) のみ。`dev-screen-spec`(`:228,467`) は生成コマンドを案内するだけ |
| `ipa-security-check` から `enso-issue-fix` を除去 | `skills/enso-issue-fix/SKILL.md:280` は「承認後に dev-loop が行う流れ」の説明であり、自身が起動するわけではない |

## Test Strategy

- [ ] `skills/dev-context/SKILL.md` の description と本文(`:17`)の呼び出し元列から `dev-verify` が消え、5スキルになっている
- [ ] `skills/dev-impl/SKILL.md` の description の呼び出し元が `dev-run` のみになっている
- [ ] `skills/dev-debug/SKILL.md` の description の呼び出し元が `dev-run` のみになっている（001 で `ipa-security-guide` は除去済み）
- [ ] `skills/dev-webtest-plan/SKILL.md` の description の呼び出し元が `dev-webtest` のみになっている
- [ ] `skills/ipa-security-check/SKILL.md` の description の呼び出し元が `dev-loop` のみになっている
- [ ] CLAUDE.md「スキルの2層構造」の Internal 一覧が 8 行になり、各行の呼び出し元が上記と一致する
- [ ] CLAUDE.md 本文の「Internal は9つです。」が 8 に更新されている
- [ ] エッジケース: description の後半（機能説明）を削っていない。Internal でも機能説明は省略しない規約（CLAUDE.md）に反するため
- [ ] エッジケース: 「引き継ぎ先の案内」（`bug-analysis` → `dev-debug` 等）を呼び出し元として書き加えていない
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- 変更するのは各 SKILL.md のフロントマター `description` の冒頭部分と、`dev-context/SKILL.md:17` の呼び出し元列
- Internal 書式は `<呼び出し元> から呼ばれる内部スキル。ユーザーからの直接呼び出しは想定しない。<説明>`（CLAUDE.md）。区切りは既存に倣い ` / ` を使う
- `dev-webtest-plan` の description は「dev-plan / dev-webtest から呼ばれる」となっているので `dev-webtest` のみに直す
- CLAUDE.md の Internal 一覧表は `| スキル | 呼び出し元 |` の2列。`dev-webtest-plan` の行も `dev-webtest` に直す

## Files

- 変更: `skills/dev-context/SKILL.md` / `skills/dev-impl/SKILL.md` / `skills/dev-debug/SKILL.md` / `skills/dev-webtest-plan/SKILL.md` / `skills/ipa-security-check/SKILL.md` / `CLAUDE.md`
- テスト: なし（Markdown のみ）
