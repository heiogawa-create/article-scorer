export default function AutoFix({ originalArticle, improvedArticle, onImprove, onUseImproved, onCopy, canImprove, isLoading }) {
  return (
    <section className="rounded-3xl border border-slate-700 bg-[#1e293b]/95 p-5 shadow-2xl shadow-slate-950/30 md:p-7">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-300">Auto Fix</p>
          <h2 className="text-2xl font-bold text-white">AI自動修正</h2>
          <p className="mt-2 text-sm text-slate-400">採点フィードバックを反映して、記事全文を改善します。</p>
        </div>
        <button
          className="rounded-2xl bg-violet-500 px-6 py-3 font-bold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400"
          type="button"
          onClick={onImprove}
          disabled={!canImprove || isLoading}
        >
          AIで自動修正
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
          <h3 className="mb-3 font-bold text-slate-100">修正前</h3>
          <div className="max-h-[34rem] overflow-auto whitespace-pre-wrap leading-7 text-slate-300">
            {originalArticle || '記事を入力するとここに表示されます。'}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-bold text-slate-100">修正後</h3>
            <button
              className="rounded-xl border border-cyan-400/40 px-3 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
              type="button"
              onClick={onCopy}
              disabled={!improvedArticle}
            >
              コピー
            </button>
          </div>
          <div className="max-h-[34rem] overflow-auto whitespace-pre-wrap leading-7 text-slate-300">
            {improvedArticle || 'AI修正後の記事がここに表示されます。'}
          </div>
        </div>
      </div>

      {improvedArticle && (
        <div className="mt-5 flex justify-end">
          <button
            className="rounded-2xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-300"
            type="button"
            onClick={onUseImproved}
          >
            修正後の記事で再採点
          </button>
        </div>
      )}
    </section>
  );
}
