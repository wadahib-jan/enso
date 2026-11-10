---
id: "002"
title: "uat-test-design を Entry スキルとして整備する"
status: done
priority: 2
dependencies: ["001"]
estimated_complexity: low
---

# Task: uat-test-design を Entry スキルとして整備する

## Goal

どちらの層にも属さず自動発火できない `uat-test-design` の description を Entry 書式（トリガー語列 + 説明）に直し、ユーザーの発話で起動できるようにする。

## Interfaces

現状（`skills/uat-test-design/SKILL.md:2`）— Entry 書式でも Internal 書式でもない:

```yaml
description: 任意のリポジトリを探索し、UAT（業務受入）・受入試験（システム受入）・非機能受入の試験項目一覧を L1/L2/L3 の3階層で生成します。巨大プロジェクト対応のため親は項目本文を読まず、抽出はサブエージェントへ並列委譲します
```

変更後の形（CLAUDE.md「スキルの2層構造」の Entry 書式に準拠）:

```yaml
# 🔵 書式は CLAUDE.md の Entry 定義に完全準拠
description: This skill should be used when the user asks to "uat-test-design", "UAT項目を作成", "受入試験の項目を作る", "受入テストの一覧を作る", "UAT test design", "acceptance test items", "非機能受入の項目", "試験項目一覧を生成". 任意のリポジトリを探索し、UAT（業務受入）・受入試験（システム受入）・非機能受入の試験項目一覧を L1/L2/L3 の3階層で生成する。巨大プロジェクト対応のため親は項目本文を読まず、抽出はサブエージェントへ並列委譲する。
```

- トリガー語は 🟡（既存スキルのトリガー語列の粒度に合わせた推測。語数・日本語/英語の混在比率は `dev-webtest` / `rev-docs` に倣う）
- 機能説明部分は現行 description の内容を保つ（🔵）
- `allowed-tools` 行は変更しない（🔵）

## Test Strategy

- [ ] description が `This skill should be used when the user asks to "uat-test-design", ...` で始まる
- [ ] トリガー語列に日本語トリガー（「UAT項目を作成」「受入試験の項目を作る」）と英語トリガーの両方が含まれる
- [ ] トリガー語列の後に機能説明が残っており、L1/L2/L3 の3階層生成と並列委譲の記述が失われていない
- [ ] `name` / `allowed-tools` など他のフロントマターキーが変わっていない
- [ ] エッジケース: 既存 Entry スキルのトリガー語と衝突する語（「テスト」単体など汎用語）を含めない。誤発火を増やさないため
- [ ] `pnpm secretlint && pnpm check` が通る

## Implementation Notes

- Entry 書式の定義は `CLAUDE.md` の「スキルの2層構造」表を参照
- 参考にする既存 Entry スキル: `skills/dev-webtest/SKILL.md:3`（トリガー語の粒度）、`skills/rev-docs/SKILL.md:3`（日英混在の並べ方）
- フロントマターに `name:` が無い場合はディレクトリ名が使われるため、追加しない
- SKILL.md の本文（Phase 1〜4 の手順）は変更しない

## Files

- 変更: `skills/uat-test-design/SKILL.md`（フロントマターの `description` のみ）
- テスト: なし（Markdown のみ）
