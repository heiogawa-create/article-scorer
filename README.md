# 記事スコアラー

note.com向けの日本語長文記事をAIが採点し、採点フィードバックをもとに自動修正するReact + Viteアプリです。

## セットアップ

```bash
npm install
cp .env.example .env
# .env に VITE_ANTHROPIC_API_KEY を設定
npm run dev
```

## 主な機能

- テキスト入力・HTMLファイル・PDFファイルの3タブ入力と文字数カウント
- HTMLファイルのドラッグ&ドロップアップロード、iframeプレビュー、bodyテキスト抽出
- PDFファイルのドラッグ&ドロップアップロード、pdf.js CDNによるテキスト抽出
- Claude Sonnet 4による6項目・合計120点スコアリング
- 合計スコア、売れやすさバナー、プログレスバー、改善コメント表示
- 採点結果を踏まえたAI自動修正
- 修正前・修正後の2カラム比較、コピー、ダウンロード機能
- HTML修正後は画像・表・head/style/scriptを保持したHTMLとしてダウンロード
- PDF修正後はプレーンテキストとしてダウンロード
- 修正後の記事での再採点とスコア履歴
