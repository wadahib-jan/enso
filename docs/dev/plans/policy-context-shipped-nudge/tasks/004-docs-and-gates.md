---
id: "004"
title: "ドキュメント整合を確認し品質ゲートを通す"
status: done
priority: 3
dependencies: ["003"]
estimated_complexity: low
---

# Task: ドキュメント整合を確認し品質ゲートを通す

## Goal

hook の役割を説明しているドキュメントが、変更後の挙動と矛盾しないことを確認する。矛盾があれば直す。そのうえで品質ゲートを通す。

## Interfaces

確認対象:

```
CLAUDE.md       強制モード（hooks）の表
                「policy-context.mjs | UserPromptSubmit |
                 強制対象スキル・ブランチ・loop-state.yaml の状況を注入」  🟡 要確認

MANUAL.md       強制モードの「何が起きるか」表
                「ユーザーの発話ごと | 経由すべきスキル・現在のブランチ・
                 loop-state.yaml の状況・次にすべきことがコンテキストに注入される」  🟡 要確認
```

どちらも「`loop-state.yaml` の状況」「次にすべきこと」という粒度の記述で、個々の分岐を列挙していない。**そのままで矛盾しない可能性が高いが、実際に読んで判断する。** 🟡

品質ゲート:

```bash
pnpm secretlint
pnpm check          # policy-context.mjs / policy.mjs は JS なので Biome の lint 対象
claude plugin validate .
```

> 信号機: 🟡 はドキュメントを読んでからでないと「直す / 直さない」を確定できない

## Test Strategy

- [ ] `CLAUDE.md` の hooks 表の記述が、変更後の `policy-context.mjs` の役割と矛盾しない（矛盾するなら修正済み）
- [ ] `MANUAL.md` の強制モード節の記述が同様に矛盾しない
- [ ] `dev-cleanup` / `dev-loop` の SKILL.md に「hook が誘導する」旨の記述があれば、実態と合っている
- [ ] `pnpm secretlint` が成功する
- [ ] `pnpm check` が成功する（**JS を変更しているので今回は Biome が実質的に効く**）
- [ ] `claude plugin validate .` が成功する
- [ ] エッジケース: 追加した JSDoc コメントが Biome の lint 規則に違反しない

## Implementation Notes

- 参照すべき既存コード: `CLAUDE.md` の「強制モード（hooks）」節、`MANUAL.md` の「強制モード」→「何が起きるか」節
- 実装のヒント: ドキュメントは「何を注入するか」を粒度粗く書いており、分岐の詳細には踏み込んでいない。**過剰に書き足さない**のが方針に沿う（最低限をシンプルに保つ）
- 注意事項: 前回の Plan で Markdown は Biome 対象外と確認済み。今回は **JS を変更するため `pnpm check` が実際に検査する**。整形エラーは `pnpm check:fix` で直せる

## Files

- 変更: `CLAUDE.md`（矛盾があった場合のみ）
- 変更: `MANUAL.md`（矛盾があった場合のみ）
