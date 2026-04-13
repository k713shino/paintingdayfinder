import type { DayForecast } from '@/types';

const BAR_COLOR: Record<DayForecast['scoreLabel'], string> = {
  excellent: '#4ade80', // green-400
  good:      '#60a5fa', // blue-400
  fair:      '#facc15', // yellow-400
  poor:      '#f87171', // red-400
};

const CHART_H   = 80;  // バー描画エリアの高さ (px)
const LABEL_H   = 18;  // 下部日付ラベルの高さ
const SCORE_H   = 14;  // 上部スコアテキストの高さ
const SVG_H     = CHART_H + LABEL_H + SCORE_H;
const BAR_GAP   = 0.2; // バー幅に対するギャップ比率

interface Props {
  forecasts: DayForecast[];
}

export function ScoreChart({ forecasts }: Props) {
  if (forecasts.length === 0) return null;

  const n = forecasts.length;
  // viewBox 幅を 100 単位に固定し、バー幅を均等割り
  const unitW = 100 / n;
  const barW  = unitW * (1 - BAR_GAP);
  const barX  = (i: number) => unitW * i + unitW * (BAR_GAP / 2);
  const barH  = (score: number) => (score / 100) * CHART_H;
  const barY  = (score: number) => SCORE_H + (CHART_H - barH(score));

  return (
    <div className="mb-4 bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
        スコア推移
      </p>
      <svg
        viewBox={`0 0 100 ${SVG_H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: SVG_H * 3 }}
        aria-label="塗装スコアの棒グラフ"
        role="img"
      >
        {forecasts.map((f, i) => {
          const x   = barX(i);
          const h   = barH(f.paintingScore);
          const y   = barY(f.paintingScore);
          const color = BAR_COLOR[f.scoreLabel];
          const d   = new Date(f.date);
          const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;

          return (
            <g key={f.date}>
              {/* バー */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                fill={color}
                rx={1.5}
              />
              {/* スコア（バー上部） */}
              <text
                x={x + barW / 2}
                y={SCORE_H - 2}
                textAnchor="middle"
                fontSize={5}
                fill="#374151"
                fontWeight="600"
              >
                {f.paintingScore}
              </text>
              {/* 日付ラベル（バー下部） */}
              <text
                x={x + barW / 2}
                y={SCORE_H + CHART_H + LABEL_H - 3}
                textAnchor="middle"
                fontSize={4.5}
                fill="#9ca3af"
              >
                {dateLabel}
              </text>
            </g>
          );
        })}
        {/* 基準線 80点 */}
        <line
          x1={0}
          y1={SCORE_H + CHART_H - barH(80)}
          x2={100}
          y2={SCORE_H + CHART_H - barH(80)}
          stroke="#d1d5db"
          strokeWidth={0.4}
          strokeDasharray="2 1"
        />
      </svg>
      <p className="text-[10px] text-gray-400 text-right mt-1">--- 80点（最適ライン）</p>
    </div>
  );
}
