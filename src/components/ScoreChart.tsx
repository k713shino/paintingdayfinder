import type { DayForecast } from '@/types';

const BAR_COLOR: Record<DayForecast['scoreLabel'], string> = {
  excellent: '#4ade80', // green-400
  good:      '#60a5fa', // blue-400
  fair:      '#facc15', // yellow-400
  poor:      '#f87171', // red-400
};

const BAR_SLOT  = 20;  // 1本分の横幅（SVG単位）
const BAR_RATIO = 0.65; // バー幅 / スロット幅
const SCORE_H   = 12;  // 上部スコアテキスト領域
const CHART_H   = 72;  // バー描画エリア
const LABEL_H   = 28;  // -45° 回転ラベル領域
const SVG_H     = SCORE_H + CHART_H + LABEL_H;

interface Props {
  forecasts: DayForecast[];
}

export function ScoreChart({ forecasts }: Props) {
  if (forecasts.length === 0) return null;

  const n      = forecasts.length;
  const VIEW_W = n * BAR_SLOT;
  const barW   = BAR_SLOT * BAR_RATIO;
  const barX   = (i: number) => i * BAR_SLOT + BAR_SLOT * ((1 - BAR_RATIO) / 2);
  const barH   = (score: number) => (score / 100) * CHART_H;
  const barY   = (score: number) => SCORE_H + (CHART_H - barH(score));
  // ラベルの回転原点: バー中心の直下
  const labelX = (i: number) => barX(i) + barW / 2;
  const labelY = SCORE_H + CHART_H + 5;

  return (
    <div className="mb-4 bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
        スコア推移
      </p>
      <svg
        viewBox={`0 0 ${VIEW_W} ${SVG_H}`}
        className="w-full"
        aria-label="塗装スコアの棒グラフ"
        role="img"
      >
        {/* 基準線 80点 */}
        <line
          x1={0}
          y1={SCORE_H + CHART_H - barH(80)}
          x2={VIEW_W}
          y2={SCORE_H + CHART_H - barH(80)}
          stroke="#d1d5db"
          strokeWidth={0.5}
          strokeDasharray="3 2"
        />

        {forecasts.map((f, i) => {
          const x     = barX(i);
          const h     = barH(f.paintingScore);
          const y     = barY(f.paintingScore);
          const lx    = labelX(i);
          const color = BAR_COLOR[f.scoreLabel];
          const d     = new Date(f.date);
          const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;

          return (
            <g key={f.date}>
              {/* バー */}
              <rect x={x} y={y} width={barW} height={h} fill={color} rx={1.5} />

              {/* スコア（バー上部） */}
              <text
                x={lx}
                y={SCORE_H - 1}
                textAnchor="middle"
                fontSize={5.5}
                fill="#374151"
                fontWeight="600"
              >
                {f.paintingScore}
              </text>

              {/* 日付ラベル（-45° 回転） */}
              <text
                x={lx}
                y={labelY}
                textAnchor="end"
                fontSize={5.5}
                fill="#9ca3af"
                transform={`rotate(-45, ${lx}, ${labelY})`}
              >
                {dateLabel}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-[10px] text-gray-400 text-right mt-0.5">--- 80点（最適ライン）</p>
    </div>
  );
}
