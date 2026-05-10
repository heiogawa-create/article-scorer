const scoreItems = [
  { key: 'hook', label: 'タイトル・冒頭フック力' },
  { key: 'depth', label: '情報の深さ・専門性' },
  { key: 'readability', label: '読みやすさ・構成' },
  { key: 'seo', label: 'SEO・検索意図との一致' },
  { key: 'empathy', label: '感情的共鳴・共感度' },
  { key: 'cta', label: 'CTA・購買促進力' },
];

function getScoreColor(score) {
  const percent = score * 5;

  if (percent >= 80) {
    return 'bg-emerald-400';
  }

  if (percent >= 60) {
    return 'bg-amber-300';
  }

  return 'bg-rose-400';
}

export default function ScoreDisplay({ result }) {
  if (!result) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-700 bg-[#1e293b]/60 p-8 text-center text-slate-400">
        採点結果がここに表示されます。
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-700 bg-[#1e293b]/95 p-5 shadow-2xl shadow-slate-950/30 md:p-7">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-300">Score Result</p>
          <h2 className="text-2xl font-bold text-white">採点結果</h2>
        </div>
        <div className="rounded-3xl border border-cyan-400/30 bg-slate-950/80 px-7 py-5 text-center">
          <p className="text-sm text-slate-400">合計スコア</p>
          <p className="text-5xl font-black text-cyan-300">{result.total}</p>
          <p className="text-sm text-slate-500">/ 100</p>
        </div>
      </div>

      <p className="mb-6 rounded-2xl bg-slate-900/70 p-4 leading-7 text-slate-200">{result.summary}</p>

      <div className="space-y-5">
        {scoreItems.map((item) => {
          const score = Number(result.scores?.[item.key] ?? 0);
          const percent = Math.min(Math.max(score * 5, 0), 100);

          return (
            <article key={item.key} className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-bold text-white">{item.label}</h3>
                <span className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-sm font-bold text-slate-200">
                  {score} / 20
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full rounded-full ${getScoreColor(score)}`} style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-3 leading-7 text-slate-300">{result.feedback?.[item.key]}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
