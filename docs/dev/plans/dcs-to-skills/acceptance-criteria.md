# Acceptance Criteria: dcs-to-skills

## AC-001: DCS コマンドが削除されている

- **Given** リポジトリをクローンした状態で
- **When** `ls commands/` を実行すると
- **Then** `dcs/` ディレクトリが存在しない

検証:
```bash
test ! -d commands/dcs && echo OK
```

## AC-002: 削除した3本への参照が残っていない

- **Given** ドキュメントとコマンド定義がすべて更新された状態で
- **When** `incremental-dev` / `code-question` / `test-performance-analysis` を全文検索すると
- **Then** 利用者向け文書とコマンド／スキル定義に1件もヒットしない

計画ドキュメント（`docs/dev/plans/`）は削除の判断を記録するために名前を挙げるため、検証対象から除外する。

検証:
```bash
grep -rn "incremental-dev\|code-question\|test-performance-analysis" \
  --include="*.md" --include="*.json" . \
  | grep -v node_modules | grep -v "docs/dev/plans/"
# → 出力が空であること
```

## AC-003: `dcs:` 表記が利用者向け文書から消えている

- **Given** README / MANUAL / help / dev-navigate が更新された状態で
- **When** `dcs` を検索すると
- **Then** 旧 `.dcs/` からの移行を説明する注記以外にヒットしない

## AC-004: 7スキルが読み込める形で存在する

- **Given** `skills/` 配下に7ディレクトリが作成された状態で
- **When** 各 `SKILL.md` の frontmatter を確認すると
- **Then** `name` と `description` を持ち、`name` がディレクトリ名と一致する

検証:
```bash
for s in impact-analysis edgecase-analysis bug-analysis feature-rubber-duck \
         sequence-diagram-analysis state-transition-analysis performance-analysis; do
  test -f "skills/$s/SKILL.md" && grep -q "^name: $s$" "skills/$s/SKILL.md" \
    && echo "OK $s" || echo "NG $s"
done
```

## AC-005: SKILL.md が行数規約を満たす

- **Given** 7スキルが作成された状態で
- **When** 各 `SKILL.md` の行数を数えると
- **Then** すべて 500 行以内である

検証:
```bash
wc -l skills/{impact-analysis,edgecase-analysis,bug-analysis,feature-rubber-duck,sequence-diagram-analysis,state-transition-analysis,performance-analysis}/SKILL.md
```

## AC-006: テンプレートが references に切り出されている

- **Given** 7スキルが作成された状態で
- **When** 各スキルの `references/` を確認すると
- **Then** 元コマンドのテンプレートブロックが対応するファイルとして存在し、内容が失われていない

## AC-007: 出力先が `docs/dev/analysis/` になっている

- **Given** 7スキルと refine 系コマンドが更新された状態で
- **When** 出力先の記述を確認すると
- **Then** 新規の出力先として `.dcs/` が指定されている箇所が無い

旧パスからの移行を説明する注記（MANUAL の注意事項、`uat-test-design` の情報源一覧）は対象外とする。

検証:
```bash
grep -rn '"\.dcs/\|出力ディレクトリ=".dcs"' skills/*/SKILL.md skills/*/references/ commands/
# → 出力が空であること
```

## AC-008: 固有プロジェクト名が混入していない

- **Given** スキル定義とテンプレートが作成された状態で
- **When** 作者固有のプロジェクト名・パスを検索すると
- **Then** 1件もヒットしない

検証:
```bash
grep -rn "Prismatix\|prismatix\|ensemble-si\|makotan" skills/
# → 出力が空であること
```

## AC-009: 引き継ぎ導線が存在する

- **Given** `bug-analysis` と `feature-rubber-duck` が作成された状態で
- **When** それぞれの最終ステップを確認すると
- **Then** `bug-analysis` は `dev-debug` への、`feature-rubber-duck` は `dev-plan` への呼び出し例を提示している

## AC-010: 使い分けが明示されている

- **Given** 各 SKILL.md と MANUAL が更新された状態で
- **When** `bug-analysis` / `performance-analysis` の記述を確認すると
- **Then** それぞれ `dev-debug` / `timeout-fix` との使い分けが表または明示的な文で示されている

## AC-011: 品質ゲートを通過する

- **Given** すべての変更が適用された状態で
- **When** 品質ゲートを実行すると
- **Then** secretlint と Biome がエラーなく完了する

検証:
```bash
pnpm secretlint && pnpm check
```

## AC-012: プラグインとして検証を通過する

- **Given** すべての変更が適用された状態で
- **When** `claude plugin validate .` を実行すると
- **Then** 検証を通過する（`commands/tech-stack.md` の frontmatter 警告は本作業以前から存在する既知事象）

## AC-013: 投入差分が意図通りである

- **Given** すべての変更が適用された状態で
- **When** `./scripts/install-local.sh --dry-run` を実行すると
- **Then** `commands/dcs/` の削除と7スキルの追加のみが差分として現れる

## 横断的基準

- ドキュメントの記述はすべて日本語であること
- コミットメッセージは Conventional Commits 形式であること
- 分析結果内のファイルパスは相対パス、Bash コマンドは絶対パスという既存規約を各スキルが踏襲していること
