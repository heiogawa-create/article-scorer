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

- 記事本文の入力と文字数カウント
- Claude Sonnet 4による6項目スコアリング
- 合計スコア、プログレスバー、改善コメント表示
- 採点結果を踏まえたAI自動修正
- 修正前・修正後の2カラム比較、コピー機能
- 修正後の記事での再採点とスコア履歴
