import { useState } from 'react';
import ArticleInput from './components/ArticleInput.jsx';
import AutoFix from './components/AutoFix.jsx';
import ScoreDisplay from './components/ScoreDisplay.jsx';
import ScoreHistory from './components/ScoreHistory.jsx';
import { improveArticle, scoreArticle } from './utils/anthropicApi.js';

function LoadingOverlay({ message }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-6 backdrop-blur-sm">
      <div className="rounded-3xl border border-cyan-400/30 bg-[#1e293b] p-8 text-center shadow-2xl shadow-slate-950/50">
        <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-300" />
        <p className="font-bold text-white">{message}</p>
        <p className="mt-2 text-sm text-slate-400">長文の場合は少し時間がかかります。</p>
      </div>
    </div>
  );
}

export default function App() {
  const [article, setArticle] = useState('');
  const [scoringResult, setScoringResult] = useState(null);
  const [improvedArticle, setImprovedArticle] = useState('');
  const [scoreHistory, setScoreHistory] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isLoading = Boolean(loadingMessage);

  async function runScoring(targetArticle = article) {
    if (!targetArticle.trim()) {
      setError('採点する記事を入力してください。');
      return;
    }

    setError('');
    setNotice('');
    setLoadingMessage('AIが記事を採点しています...');

    try {
      const result = await scoreArticle(targetArticle);
      setScoringResult(result);
      setScoreHistory((currentHistory) => [
        ...currentHistory,
        {
          iteration: currentHistory.length + 1,
          total: result.total,
          timestamp: new Intl.DateTimeFormat('ja-JP', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date()),
        },
      ]);
      setNotice('採点が完了しました。');
    } catch (caughtError) {
      setError(caughtError.message || '採点に失敗しました。');
    } finally {
      setLoadingMessage('');
    }
  }

  async function runAutoFix() {
    if (!article.trim() || !scoringResult) {
      setError('自動修正には記事と採点結果が必要です。');
      return;
    }

    setError('');
    setNotice('');
    setLoadingMessage('AIが記事を自動修正しています...');

    try {
      const fixedArticle = await improveArticle(article, scoringResult);
      setImprovedArticle(fixedArticle);
      setNotice('自動修正が完了しました。');
    } catch (caughtError) {
      setError(caughtError.message || '自動修正に失敗しました。');
    } finally {
      setLoadingMessage('');
    }
  }

  async function handleCopy() {
    if (!improvedArticle) {
      return;
    }

    await navigator.clipboard.writeText(improvedArticle);
    setNotice('修正後の記事をコピーしました。');
  }

  function handleUseImproved() {
    setArticle(improvedArticle);
    runScoring(improvedArticle);
  }

  return (
    <main className="min-h-screen px-4 py-6 text-slate-100 md:px-8 md:py-10">
      {isLoading && <LoadingOverlay message={loadingMessage} />}

      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-[2rem] border border-slate-700 bg-[#1e293b]/90 p-6 shadow-2xl shadow-slate-950/30 md:p-9">
          <p className="mb-3 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200">
            note.com向け長文記事診断
          </p>
          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">AI記事スコアラー & 自動修正</h1>
              <p className="mt-4 max-w-3xl leading-8 text-slate-300">
                Claude Sonnet 4が、フック・専門性・読みやすさ・SEO・共感・CTAの6軸で記事を採点し、改善案を反映したリライトまで支援します。
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950/70 p-5 text-sm leading-7 text-slate-300">
              <p className="font-bold text-white">利用前の確認</p>
              <p>.env に VITE_ANTHROPIC_API_KEY を設定してください。</p>
            </div>
          </div>
        </header>

        {(error || notice) && (
          <div className={`rounded-2xl border p-4 ${error ? 'border-rose-400/40 bg-rose-950/40 text-rose-100' : 'border-emerald-400/40 bg-emerald-950/30 text-emerald-100'}`}>
            {error || notice}
          </div>
        )}

        <ArticleInput article={article} onArticleChange={setArticle} onScore={() => runScoring()} isLoading={isLoading} />

        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          <ScoreDisplay result={scoringResult} />
          <ScoreHistory history={scoreHistory} />
        </div>

        <AutoFix
          originalArticle={article}
          improvedArticle={improvedArticle}
          onImprove={runAutoFix}
          onUseImproved={handleUseImproved}
          onCopy={handleCopy}
          canImprove={Boolean(scoringResult && article.trim())}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
}
