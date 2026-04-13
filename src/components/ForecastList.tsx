'use client';

import { useState } from 'react';
import type { DayForecast, PaintType } from '@/types';
import { DayCard } from './DayCard';

const PAINT_TYPE_OPTIONS: { type: PaintType; label: string }[] = [
  { type: 'lacquer',   label: 'ラッカー' },
  { type: 'waterbase', label: '水性' },
  { type: 'enamel',    label: 'エナメル' },
];

interface Props {
  forecastsByType: Record<PaintType, DayForecast[]>;
  today: string;
}

export function ForecastList({ forecastsByType, today }: Props) {
  const [paintType, setPaintType] = useState<PaintType>('lacquer');
  const forecasts = forecastsByType[paintType];

  return (
    <div>
      {/* 塗料タブ */}
      <div className="flex gap-2 mb-3">
        {PAINT_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => setPaintType(opt.type)}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-colors border ${
              paintType === opt.type
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 7日間リスト */}
      <div className="space-y-3">
        {forecasts.map((f) => (
          <DayCard key={f.date} forecast={f} isToday={f.date === today} />
        ))}
      </div>
    </div>
  );
}
