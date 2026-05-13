import { useState } from 'react';
import { generatePrompt } from '../utils/anthropicApi.js';

export default function AutoFix({
  originalArticle,
  improvedArticle,
  improvedHtml,
  inputTab,
  scoringResult,
  onImprove,
  onUseImproved,
  onCopy,
  onDownloadHtml,
  onDownloadText,
  canImprove,
  isLoading,
}) {
  const [promptCopied, setPromptCopied] = useState(false);
  const [articleCopied, setArticleCopied] = useState(false);

  async function handleCopyPrompt() {
    if (!originalArticle || !scoringResult) return;
    const prompt = generatePrompt(originalArticle, scoringResult);
    await navigator.clipboard.writeText(prompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }

  async function handleCopyArticle() {
    await onCopy();
    setArticleCopied(true);
    setTimeout(() => setArticleCopied(false), 2000);
  }

  return (
    <div className="rounded-[2rem] border border-slate-700 bg-[#1e293b]/90 p-6 shadow-xl md:p-8 space-y-6">
      <h2 className="text-xl font-black text-white">自動修正 & 改善プロンプト</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={onImprove}
          disabled={!canImprove || isLoading}
          className="rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 py-4 font-black text-white shadow-lg shadow-violet-500/30 transition-all hover:opacity-90 disabled:opacity-40"
        >
          ✨ AIで自動修正
          <span className="block text-xs font-normal mt-1 opacity-80">Anthropic APIで記事を自動リライト</span>
        </button>

        <button
          onClick={handleCopyPrompt}
          disabled={!canImprove}
          className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 font-black text-white shadow-lg shadow-emerald-500/30 transition-all hover:opacity-90 disabled:opacity-40"
        >
          {promptCopied ? '✅ コピーしました！' : '📋 改善プロンプトをコピー'}
          <span className="block text-xs font-normal mt-1 opacity-80">ChatGPT・Claudeにそのまま貼り付けOK</span>
        </button>
      </div>

      {canImprove && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-sm text-emerald-200 space-y-1">
          <p className="font-bold">📌 改善プロンプトの使い方</p>
          <p>「改善プロンプトをコピー」→ ChatGPTまたはClaude.aiを開いて貼り付けるだけで記事を改善できます。</p>
        </div>
      )}

      {improvedArticle && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-600 bg-slate-800/50 p-4">
              <p className="text-xs font-bold text-slate-400 mb-2">修正前</p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto leading-6">
                {originalArticle}
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4">
              <p className="text-xs font-bold text-cyan-300 mb-2">修正後</p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap max-h-64 overflow-y-auto leading-6">
                {improvedArticle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopyArticle}
              className="rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-600 transition-all"
            >
              {articleCopied ? '✅ コピー済み' : '📋 修正後テキストをコピー'}
            </button>

            {inputTab === 'html' && improvedHtml && (
              <button
                onClick={onDownloadHtml}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 transition-all"
              >
                ⬇️ HTMLでダウンロード（画像・表保持）
              </button>
            )}

            {inputTab === 'pdf' && (
              <button
                onClick={onDownloadText}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-all"
              >
                ⬇️ テキストでダウンロード
              </button>
            )}

            <button
              onClick={onUseImproved}
              disabled={isLoading}
              className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-500 transition-all disabled:opacity-40"
            >
              🔄 修正後で再採点
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
