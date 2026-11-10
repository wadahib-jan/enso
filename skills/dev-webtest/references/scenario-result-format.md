# scenario 中間ファイルフォーマット

計画テスト（Step 2a）でグループ実行を任された Agent が、各シナリオの結果を `tmp/webtest/results/<plan-name>/<scenario-index>-<scenario-name>.md` に書き出すときのフォーマット。メインAgentは Step 8 でこれらを Read してレポートに集約する。

```markdown
---
scenario: "<シナリオ名>"
url: "<テスト対象URL>"
result: passed | failed | skipped
---
## APIセットアップ: <成功/失敗/なし>
- <セットアップの実行結果（1行。なしの場合は「シナリオ固有セットアップなし」）>

## シナリオ結果: <passed/failed/skipped>
- <結果の要約（1-2行）>

## 視覚チェック: <判定>
- <所見（1-2行）>

## アクセシビリティ: <判定>
- 画像alt: <判定> (N/M)
- フォームラベル: <判定> (N/M)
- Heading階層: <判定>
- キーボード: <判定> Tab到達率 N% (N/M)
- ARIA: <判定>
- ランドマーク: <判定>

## レスポンシブ: <判定>
- mobile: <判定> <所見>
- tablet: <判定> <所見>
- desktop: <判定> <所見>

## フォームバリデーション: <判定>
- <パターン>: <判定> | ...

## 検出エラー
- <error.md へのパス>（エラーがない場合は「なし」）
```
