---
id: "003"
title: "dev-run と dev-impl のルール・制約に制約本体を追加する"
status: done
priority: 2
dependencies: ["001"]
estimated_complexity: low
---

# Task: dev-run と dev-impl のルール・制約に制約本体を追加する

## Goal

`skills/dev-run/SKILL.md` と `skills/dev-impl/SKILL.md` の「ルール・制約」に、001 で確定した共通文言を全文追加し、既存の絶対パス規約を整理する。

## Interfaces

追加位置 🔵: 両ファイルの「## ルール・制約」の末尾（既存の絶対パス行の直前）。

追加する文言は 001 で確定した共通文言の全文。加えて、`dev-impl` にはファイル生成の観点を強調した 1 行を添える 🟡。

```markdown
- **ファイルの新規作成・編集は Write / Edit ツールを使う。** `cat > file <<'EOF'` の形は
  worktree 隔離ガードに拒否される
```

既存の絶対パス行の差し替え（両ファイル共通、002 と同じ文言） 🔵

```markdown
- Bash コマンドはプロジェクトルートの **絶対パス** を使用する。worktree セッション中は
  `$(git rev-parse --show-toplevel)` のようなコマンド置換を使わず、worktree ルートの
  確定した絶対パスを直接書く（ガードに拒否されるため）
```

`skills/dev-impl/SKILL.md` の 78 行目にある `wc -l "$(git rev-parse --show-toplevel)/<ファイルの相対パス>"` も同じ理由で書き換える 🔵。

## Test Strategy

- [ ] `skills/dev-run/SKILL.md` の「ルール・制約」に共通文言が全文含まれている
- [ ] `skills/dev-impl/SKILL.md` の「ルール・制約」に共通文言が全文含まれている
- [ ] `dev-impl` に「ファイル生成は Write / Edit ツール」を強調する記述がある
- [ ] 両ファイルの絶対パス行がコマンド置換を使わない文言に差し替わっている
- [ ] `dev-impl` 78 行目の `wc -l` 例に `$(git rev-parse --show-toplevel)` が含まれない
- [ ] 文言が 001 の共通文言と一致している（禁止パターンの数・順序を含む）
- [ ] エッジケース: `dev-impl` のクイックモード（Plan なし・worktree 外で起動されうる）でも矛盾しない書き方になっている
- [ ] 両ファイルが 500 行以内（現在 273 行 / 242 行）
- [ ] `pnpm secretlint` と `pnpm check` が通る

## Implementation Notes

- 参照すべき既存コード: `skills/dev-run/SKILL.md` の 255-265 行目、`skills/dev-impl/SKILL.md` の 78・228-236 行目
- 実装のヒント: 両ファイルとも「## ルール・制約」は箇条書き。共通文言は引用ブロックではなく、箇条書きの1項目＋ネストした列挙で置くと既存の体裁に合う
- 注意事項: `dev-run` はサブエージェントにプロンプトを渡す。サブエージェント側も同じガードの下で動くため、**プロンプトテンプレート（`references/*-prompt-template.md`）にも同じ制約を入れるか**を実装時に判断し、入れた場合は Files に追記する 🟡
- 注意事項: 001 の文言をそのまま転記する。要約・言い換えをしない

## Files

- 変更: `skills/dev-run/SKILL.md`, `skills/dev-impl/SKILL.md`
- 変更（判断次第）: `skills/dev-run/references/impl-prompt-template.md`, `skills/dev-run/references/debug-prompt-template.md`, `skills/dev-run/references/verify-prompt-template.md`
- 新規: なし
- テスト: なし（品質ゲートは `pnpm secretlint && pnpm check`）
