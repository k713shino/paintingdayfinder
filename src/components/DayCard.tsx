'use client';

import { useState } from 'react';
import type { DayForecast } from '@/types';
import { ScoreBadge } from './ScoreBadge';
import { WeatherIcon } from './WeatherIcon';
import { DAY_NAMES } from '@/lib/utils';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayName = DAY_NAMES[d.getDay()];
  return { month, day, dayName };
}

export function DayCard({ forecast, isToday }: { forecast: DayForecast; isToday: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { month, day, dayName } = formatDate(forecast.date);

  const borderColor: Record<DayForecast['scoreLabel'], string> = {
    excellent: 'border-green-400',
    good: 'border-blue-400',
    fair: 'border-yellow-400',
    poor: 'border-red-300',
  };

  return (
    <div
      className={`rounded-2xl border-2 bg-white shadow-sm transition-shadow hover:shadow-md ${borderColor[forecast.scoreLabel]} ${isToday ? 'ring-2 ring-offset-1 ring-indigo-400' : ''}`}
    >
      <button
        type="button"
        className="w-full text-left p-4"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          {/* 日付 */}
          <div className="flex flex-col items-center min-w-12">
            {isToday && (
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded mb-0.5">
                今日
              </span>
            )}
            <span className="text-lg font-bold text-gray-800">
              {month}/{day}
            </span>
            <span
              className={`text-xs font-medium ${dayName === '日' ? 'text-red-500' : dayName === '土' ? 'text-blue-500' : 'text-gray-500'}`}
            >
              ({dayName})
            </span>
          </div>

          {/* 天気アイコン */}
          <WeatherIcon code={forecast.weatherCode} />

          {/* 気象データ */}
          <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-sm text-gray-700">
            <span>🌡️ {forecast.temperatureMin}〜{forecast.temperatureMax}°C</span>
            <span>💧 湿度 {forecast.humidity}%</span>
            <span>🌂 降水確率 {forecast.precipitationProbabilityMax}%</span>
            <span>💨 風速 {forecast.windspeedMax}km/h</span>
          </div>

          {/* スコア */}
          <ScoreBadge label={forecast.scoreLabel} score={forecast.paintingScore} />

          {/* 展開矢印 */}
          <span className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {/* 詳細 */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100">
          {forecast.bestPeriod && (
            <div className="mb-3 flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2">
              <span className="text-base">⏰</span>
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">最適時間帯</p>
                <p className="text-sm font-semibold text-indigo-800">
                  {forecast.bestPeriod.startHour}時〜{forecast.bestPeriod.endHour}時
                  <span className="ml-2 text-xs font-normal text-indigo-500">
                    （スコア {forecast.bestPeriod.score}）
                  </span>
                </p>
              </div>
            </div>
          )}
          <p className="text-xs font-semibold text-gray-500 mb-2">塗装条件の詳細</p>
          <ul className="space-y-1">
            {forecast.reasons.map((r, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span>•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
