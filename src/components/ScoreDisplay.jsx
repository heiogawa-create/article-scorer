const SCORE_ITEMS = [
  { key: 'hook', label: 'タイトル・冒頭フック力' },
  { key: 'depth', label: '情報の深さ・専門性' },
  { key: 'readability', label: '読みやすさ・構成' },
  { key: 'seo', label: 'SEO・検索意図との一致' },
  { key: 'empathy', label: '感情的共鳴・共感度' },
  { key: 'cta', label: 'CTA・購買促進力' },
];

function getBarColor(score) {
  if (score >= 17) return 'bg-emerald-400';
  if (score >= 13) return 'bg-yellow-400';
  return 'bg-rose-400';
}

function getSalesBanner(total) {
  if (total >= 110) return { emoji: '🔥', text: 'バズり候補！今すぐ公開してください', bg: 'bg-rose-500/20 border-rose-400/40 text-rose-100' };
  if (total >= 100) return { emoji: '⭐', text: '売れやすい記事です！公開推奨', bg: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100' };
  if (total >= 85) return { emoji: '📈', text: 'もう少し！自動修正で100点超えを狙いましょう', bg: 'bg-yellow-500/20 border-yellow-400/40 text-yellow-100' };
  if (total >= 70) return { emoji: '✏️', text: '改善が必要です。自動修正を試してください', bg: 'bg-orange-500/20 border-orange-400/40 text-orange-100' };
  return { emoji: '⚠️', text: '大幅な見直しが必要です', bg: 'bg-slate-500/20 border-slate-400/40 text-slate-100' };
}

export default function ScoreDisplay({ result }) {
  if (!result) {
    return (
      <div className="rounded-[2rem] border border-slate-700 bg-[#1e293b]/90 p-6 shadow-xl md:p-8">
        <h2 className="text-xl font-black text-white mb-4">採点結果</h2>
        <p className="text-slate-400">記事を入力して採点ボタンを押してください。</p>
      </div>
    );
  }

  const { scores, total, feedback, summary } = result;
  const banner = getSalesBanner(total);

  return (
    <div className="rounded-[2rem] border border-slate-700 bg-[#1e293b]/90 p-6 shadow-xl md:p-8 space-y-6">
      <h2 className="text-xl font-black text-white">採点結果</h2>

      <div className="text-center">
        <div className="text-7xl font-black text-white">{total}</div>
        <div className="text-slate-400 text-sm mt-1">満点：120点 ｜ 売れる目安：100点以上</div>
      </div>

      <div className={`rounded-2xl border p-4 text-center font-bold ${banner.bg}`}>
        {banner.emoji} {banner.text}
      </div>

      <div className="space-y-4">
        {SCORE_ITEMS.map(({ key, label }) => {
          const score = scores?.[key] ?? 0;
          const pct = (score / 20) * 100;
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{label}</span>
                <span className="font-bold text-white">{score} / 20</span>
              </div>
              <div className="h-2 rounded-full bg-slate-700">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${getBarColor(score)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {feedback?.[key] && (
                <p className="mt-1 text-xs text-slate-400">{feedback[key]}</p>
              )}
            </div>
          );
        })}
      </div>

      {summary && (
        <div className="rounded-2xl bg-slate-800/60 p-4">
          <p className="text-sm font-bold text-slate-200 mb-1">総合コメント</p>
          <p className="text-sm text-slate-300 leading-6">{summary}</p>
        </div>
      )}
    </div>
  );
}
