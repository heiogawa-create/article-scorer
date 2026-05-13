import { useState } from 'react';
import ArticleInput from './components/ArticleInput.jsx';
import AutoFix from './components/AutoFix.jsx';
import FileUpload from './components/FileUpload.jsx';
import ScoreDisplay from './components/ScoreDisplay.jsx';
import ScoreHistory from './components/ScoreHistory.jsx';
import { improveArticle, scoreArticle } from './utils/anthropicApi.js';
import { injectText } from './utils/htmlParser.js';

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

function ApiKeySetup({ onSave }) {
  const [key, setKey] = useState('');
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-slate-100" style={{background:'#0f172a'}}>
      <div className="w-full max-w-md rounded-[2rem] border border-slate-700 bg-[#1e293b] p-8 shadow-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white">AI記事スコアラー</h1>
          <p className="mt-2 text-slate-400 text-sm leading-6">
            このアプリはAnthropicのAPIキーが必要です。<br />
            キーはブラウザのセッション内にのみ保存され、外部には送信されません。
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-300">Anthropic APIキー</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            className="w-full rounded-xl border border-slate-600 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
          />
          <p className="text-xs text-slate-500">
            APIキーは{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">
              console.anthropic.com
            </a>{' '}
            で取得できます。
          </p>
        </div>
        <button
          onClick={() => key.trim() && onSave(key.trim())}
          disabled={!key.trim()}
          className="w-full rounded-2xl bg-cyan-500 py-3 font-black text-white shadow-lg disabled:opacity-40 hover:bg-cyan-400 transition-all"
        >
          はじめる →
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('anthropic_key') || '');
  const [inputTab, setInputTab] = useState('text');
  const [article, setArticle] = useState('');
  const [originalHtml, setOriginalHtml] = useState('');
  const [scoringResult, setScoringResult] = useState(null);
  const [improvedArticle, setImprovedArticle] = useState('');
  const [improvedHtml, setImprovedHtml] = useState('');
  const [scoreHistory, setScoreHistory] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isLoading = Boolean(loadingMessage);

  function handleSaveKey(key) {
    sessionStorage.setItem('anthropic_key', key);
    setApiKey(key);
  }

  if (!apiKey) return <ApiKeySetup onSave={handleSaveKey} />;

  async function runScoring(targetArticle = article) {
    if (!targetArticle.trim()) { setError('採点する記事を入力してください。'); return; }
    setError(''); setNotice('');
    setLoadingMessage('AIが記事を採点しています...');
    try {
      const result = await scoreArticle(targetArticle, apiKey);
      setScoringResult(result);
      setScoreHistory((h) => [...h, {
        iteration: h.length + 1,
        total: result.total,
        timestamp: new Intl.DateTimeFormat('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date()),
      }]);
      setNotice('採点が完了しました。');
    } catch (e) {
      setError(e.message || '採点に失敗しました。');
    } finally {
      setLoadingMessage('');
    }
  }

  async function runAutoFix() {
    if (!article.trim() || !scoringResult) { setError('自動修正には記事と採点結果が必要です。'); return; }
    setError(''); setNotice('');
    setLoadingMessage('AIが記事を自動修正しています...');
    try {
      const fixedText = await improveArticle(article, scoringResult, apiKey);
      setImprovedArticle(fixedText);
      if (inputTab === 'html' && originalHtml) {
        setImprovedHtml(injectText(originalHtml, fixedText));
      }
      setNotice('自動修正が完了しました。');
    } catch (e) {
      setError(e.message || '自動修正に失敗しました。');
    } finally {
      setLoadingMessage('');
    }
  }

  async function handleCopy() {
    if (!improvedArticle) return;
    await navigator.clipboard.writeText(improvedArticle);
    setNotice('修正後の記事をコピーしました。');
  }

  function handleDownloadHtml() {
    if (!improvedHtml) return;
    const blob = new Blob([improvedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'fixed_article.html'; a.click();
    URL.revokeObjectURL(url);
    setNotice('修正済みHTMLをダウンロードしました。');
  }

  function handleDownloadText() {
    if (!improvedArticle) return;
    const blob = new Blob([improvedArticle], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'fixed_article.txt'; a.click();
    URL.revokeObjectURL(url);
    setNotice('修正済みテキストをダウンロードしました。');
  }

  function handleUseImproved() {
    setArticle(improvedArticle);
    runScoring(improvedArticle);
  }

  const TABS = [
    { id: 'text', label: '✏️ テキスト入力' },
    { id: 'html', label: '📄 HTMLファイル' },
    { id: 'pdf', label: '📑 PDFファイル' },
  ];

  return (
    <main className="min-h-screen px-4 py-6 text-slate-100 md:px-8 md:py-10">
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-[2rem] border border-slate-700 bg-[#1e293b]/90 p-6 shadow-2xl md:p-9">
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
              <p className="font-bold text-emerald-300">✅ APIキー設定済み</p>
              <button
                onClick={() => { sessionStorage.removeItem('anthropic_key'); setApiKey(''); }}
                className="mt-2 text-xs text-rose-400 underline hover:text-rose-300"
              >
                APIキーを変更する
              </button>
            </div>
          </div>
        </header>

        {(error || notice) && (
          <div className={`rounded-2xl border p-4 ${error ? 'border-rose-400/40 bg-rose-950/40 text-rose-100' : 'border-emerald-400/40 bg-emerald-950/30 text-emerald-100'}`}>
            {error || notice}
          </div>
        )}

        <div className="rounded-[2rem] border border-slate-700 bg-[#1e293b]/90 p-6 shadow-xl md:p-8">
          <div className="flex flex-wrap gap-2 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setInputTab(tab.id); setArticle(''); setOriginalHtml(''); setImprovedArticle(''); setImprovedHtml(''); }}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${inputTab === tab.id ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {inputTab === 'text' && (
            <ArticleInput article={article} onArticleChange={setArticle} onScore={() => runScoring()} isLoading={isLoading} />
          )}

          {(inputTab === 'html' || inputTab === 'pdf') && (
            <div className="space-y-4">
              <FileUpload activeTab={inputTab} setActiveTab={setInputTab} onTextExtracted={setArticle} onHtmlLoaded={setOriginalHtml} />
              {article && (
                <button onClick={() => runScoring()} disabled={isLoading} className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 py-4 font-black text-white shadow-lg disabled:opacity-50">
                  🔍 採点する
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          <ScoreDisplay result={scoringResult} />
          <ScoreHistory history={scoreHistory} />
        </div>

        <AutoFix
          originalArticle={article}
          improvedArticle={improvedArticle}
          improvedHtml={improvedHtml}
          inputTab={inputTab}
          scoringResult={scoringResult}
          onImprove={runAutoFix}
          onUseImproved={handleUseImproved}
          onCopy={handleCopy}
          onDownloadHtml={handleDownloadHtml}
          onDownloadText={handleDownloadText}
          canImprove={Boolean(scoringResult && article.trim())}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
}
