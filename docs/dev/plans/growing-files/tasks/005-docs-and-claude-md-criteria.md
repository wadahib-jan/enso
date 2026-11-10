---
id: "005"
title: "enso-tidy をドキュメントに追加し、判断軸を CLAUDE.md に記載する"
status: done
priority: 3
dependencies: ["001", "002", "003", "004"]
estimated_complexity: low
---

# Task: enso-tidy をドキュメントに追加し、判断軸を CLAUDE.md に記載する

## Goal

利用者が enso-tidy を知って実行できるように README.md と MANUAL.md を更新する。あわせて、enso 本体を開発する人（新しいスキルを追加する人）が「整頓と無駄の排除」と「定期的に削除してよいファイル」の判断軸を参照できるよう、CLAUDE.md に短く記載する。

## Interfaces

```text
README.md スキル一覧: 人が呼ぶスキルの件数 +1、表に enso-tidy（蓄積ファイルの削除 PR と、AI 開発の設定・ドキュメントの冗長点検）  🔵
MANUAL.md: 「## ディレクトリ構造」の前に「## 整頓（enso-tidy）」を新設                                                              🔵
CLAUDE.md: 「## スキルの2層構造」の後に「## 整頓の判断軸」を新設                                                                 🔵
```

CLAUDE.md に書く内容（正本は enso-tidy の SKILL.md「判断軸」。CLAUDE.md は開発者向けの要約とスキル追加時のルール）:

```markdown
## 整頓の判断軸

enso を整頓するときの基準は `skills/enso-tidy/SKILL.md` の「判断軸」が正本です。要点は次の2つです。

- **整頓と無駄の排除を第一優先にする。** ただし、消す・まとめることで手順・分岐・判定が複雑になるなら行わず、見送った理由を残す。挙動を変えない。迷ったら残す
- **定期的に削除してよいのは、後で読む処理が無く、進行中の作業に使われず、失っても作り直せる（または git 履歴から戻せる）ファイルだけ。** 自動で消すのは enso-tidy の削除対象の表にパスと削除条件を明示したものに限る

**新しいスキルがファイルを出力するとき**は、実行のたびに増えるかを先に決めます。増えるなら、固定名で上書きできないかを検討し、できないなら enso-tidy の削除対象の表に「パス・削除条件・残すもの」を追加します。後で読む処理がある場合は、読まれる版（最新・open など）を残す条件にします。
```

## Test Strategy

- [ ] README.md のスキル一覧に enso-tidy があり、件数表記が実数と一致し、MANUAL の新設節へのリンクが切れていない
- [ ] MANUAL.md の新設節に: 用途（削除と点検）、実行方法（`/enso:enso-tidy`）、全体の流れ（削除候補と点検結果の提示 → 削除の確認と直す指摘の選択 → 削除 PR → dev-cleanup でマージ → 選んだ指摘を dev-plan に引き継ぎ）、削除対象の表と残すもの（SKILL.md と一致）、点検範囲（enso 本体 / 導入先はソースコードを含まない）
- [ ] CLAUDE.md に「## 整頓の判断軸」があり、正本（enso-tidy の SKILL.md）への参照と、スキル追加時のルール（増える出力は固定名 or 削除対象の表に追加）がある
- [ ] SKILL.md の削除対象の表と MANUAL の表が一致している（対象パスを grep で突き合わせる）
- [ ] 定期実行（クラウドルーティン）の記述がどこにも無い
- [ ] `pnpm secretlint` / `pnpm check` が通る

## Implementation Notes

- MANUAL.md はタスク 001（強制モードの説明）と 004（ipa の出力先）でも変更するので、その後に実施する
- MANUAL の承認ゲート一覧には追加しない（開発サイクル外のため、新設節の中で dev-cleanup と dev-plan への引き継ぎとして説明する）
- CLAUDE.md の Internal スキルの表は変更しない（enso-tidy は Entry。「これ以外はすべて Entry」で足りる）
- CLAUDE.md の記述は要約にとどめ、判断軸の全文を複製しない（重複を作らない）

## Files

- 変更: README.md, MANUAL.md, CLAUDE.md
