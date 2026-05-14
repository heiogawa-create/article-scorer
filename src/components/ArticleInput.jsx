export default function ArticleInput({ article, onArticleChange, onScore, isLoading }) {
  const characterCount = article.length;
  const canScore = article.trim().length > 0 && !isLoading;
  return (
    <section className="rounded-3xl border border-slate-700 bg-[#1e293b]/95 p-5 shadow-2xl shadow-slate-950/30 md:p-7">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-300">Article Input</p>
          <h2 className="text-2xl font-bold text-white">記事入力</h2>
        </div>
        <span className="rounded-full bg-slate-900 px-4 py-2 text-sm text-slate-300">
          {characterCount.toLocaleString()} 文字
        </span>
      </div>
      <textarea
        className="min-h-[30rem] w-full resize-y rounded-2xl border border-slate-600 bg-slate-950/70 p-4 leading-7 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
        rows={20}
        value={article}
        onChange={(event) => onArticleChange(event.target.value)}
        placeholder="note.com向けの長文記事をここに貼り付けてください。タイトル、見出し、本文、CTAを含めるとより正確に採点できます。"
      />
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-400 space-y-1">
          <p>6項目×20点で、合計<span className="font-bold text-white">120点満点</span>としてAIが採点します。</p>
          <p>売れやすい記事の目安：<span className="font-bold text-cyan-300">100点以上</span>　バズり候補：<span className="font-bold text-rose-300">110点以上</span></p>
        </div>
        <button
          className="rounded-2xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300 disabled:opacity-40"
          type="button"
          onClick={onScore}
          disabled={!canScore}
        >
          採点する
        </button>
      </div>
    </section>
  );
}
