import type { DayForecast } from '../types';

const config: Record<DayForecast['scoreLabel'], { bg: string; text: string; label: string }> = {
  excellent: { bg: 'bg-green-100 border-green-400', text: 'text-green-700', label: '最適' },
  good: { bg: 'bg-blue-100 border-blue-400', text: 'text-blue-700', label: '良好' },
  fair: { bg: 'bg-yellow-100 border-yellow-400', text: 'text-yellow-700', label: 'やや注意' },
  poor: { bg: 'bg-red-100 border-red-400', text: 'text-red-700', label: '不向き' },
};

export function ScoreBadge({ label, score }: { label: DayForecast['scoreLabel']; score: number }) {
  const c = config[label];
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border-2 px-3 py-2 ${c.bg}`}>
      <span className={`text-2xl font-bold ${c.text}`}>{score}</span>
      <span className={`text-xs font-semibold ${c.text}`}>{c.label}</span>
    </div>
  );
}
