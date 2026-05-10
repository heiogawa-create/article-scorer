export default function ScoreHistory({ history }) {
  return (
    <section className="rounded-3xl border border-slate-700 bg-[#1e293b]/95 p-5 shadow-2xl shadow-slate-950/30 md:p-7">
      <div className="mb-5">
        <p className="text-sm font-semibold text-cyan-300">History</p>
        <h2 className="text-2xl font-bold text-white">スコア履歴</h2>
      </div>

      {history.length === 0 ? (
        <p className="rounded-2xl bg-slate-900/60 p-4 text-slate-400">採点を実行すると改善回数ごとのスコアが記録されます。</p>
      ) : (
        <ol className="space-y-3">
          {history.map((entry, index) => (
            <li key={`${entry.timestamp}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <div>
                <p className="font-bold text-white">{entry.iteration}回目の採点</p>
                <p className="text-sm text-slate-500">{entry.timestamp}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-cyan-300">{entry.total}</p>
                <p className="text-xs text-slate-500">/ 120</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
