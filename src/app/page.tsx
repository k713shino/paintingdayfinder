'use client';

import { useEffect, useState } from 'react';
import type { DayForecast, LocationInfo, PaintType, RawDayData } from '@/types';
import { fetchWeather, reverseGeocode, calcForecasts } from '@/lib/weather';
import { DayCard } from '@/components/DayCard';
import { AffiliateItems } from '@/components/AffiliateItems';
import Link from 'next/link';

type Status = 'idle' | 'locating' | 'loading' | 'success' | 'error';
type LocationMode = 'gps' | 'city';

const PAINT_TYPE_OPTIONS: { type: PaintType; label: string; description: string }[] = [
  { type: 'lacquer',   label: 'ラッカー', description: '湿度に最も敏感。白化リスクあり' },
  { type: 'waterbase', label: '水性',     description: '湿度耐性が高め。乾燥は遅め' },
  { type: 'enamel',    label: 'エナメル', description: '中間的な湿度耐性' },
];

type City = { name: string; lat: number; lon: number; region: string };

const MAJOR_CITIES: City[] = [
  { name: '札幌',     lat: 43.0642, lon: 141.3469, region: '北海道' },
  { name: '仙台',     lat: 38.2688, lon: 140.8721, region: '東北' },
  { name: '東京',     lat: 35.6895, lon: 139.6917, region: '関東' },
  { name: '横浜',     lat: 35.4437, lon: 139.6380, region: '関東' },
  { name: 'さいたま', lat: 35.8617, lon: 139.6456, region: '関東' },
  { name: '千葉',     lat: 35.6073, lon: 140.1063, region: '関東' },
  { name: '新潟',     lat: 37.9026, lon: 139.0232, region: '中部' },
  { name: '金沢',     lat: 36.5613, lon: 136.6562, region: '中部' },
  { name: '静岡',     lat: 34.9756, lon: 138.3828, region: '中部' },
  { name: '名古屋',   lat: 35.1815, lon: 136.9066, region: '中部' },
  { name: '大阪',     lat: 34.6937, lon: 135.5022, region: '近畿' },
  { name: '京都',     lat: 35.0116, lon: 135.7681, region: '近畿' },
  { name: '神戸',     lat: 34.6913, lon: 135.1830, region: '近畿' },
  { name: '広島',     lat: 34.3853, lon: 132.4553, region: '中国' },
  { name: '岡山',     lat: 34.6618, lon: 133.9350, region: '中国' },
  { name: '高松',     lat: 34.3401, lon: 134.0434, region: '四国' },
  { name: '高知',     lat: 33.5597, lon: 133.5311, region: '四国' },
  { name: '福岡',     lat: 33.5902, lon: 130.4017, region: '九州' },
  { name: '熊本',     lat: 32.7898, lon: 130.7417, region: '九州' },
  { name: '鹿児島',   lat: 31.5966, lon: 130.5571, region: '九州' },
  { name: '那覇',     lat: 26.2124, lon: 127.6809, region: '沖縄' },
];

const CITY_REGIONS = [...new Set(MAJOR_CITIES.map((c) => c.region))];

export default function HomePage() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [forecasts, setForecasts] = useState<DayForecast[]>([]);
  const [paintType, setPaintType] = useState<PaintType>('lacquer');
  const [rawWeatherData, setRawWeatherData] = useState<RawDayData[] | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>('gps');
  const [selectedCityName, setSelectedCityName] = useState<string>(MAJOR_CITIES[0].name);

  function handlePaintTypeChange(newType: PaintType) {
    setPaintType(newType);
    if (rawWeatherData) {
      setForecasts(calcForecasts(rawWeatherData, newType));
    }
  }

  async function load(overrideMode?: LocationMode, overrideCityName?: string) {
    const mode = overrideMode ?? locationMode;
    const cityName = overrideCityName ?? selectedCityName;

    setError('');

    let loc: LocationInfo;

    if (mode === 'gps') {
      setStatus('locating');
      let pos: GeolocationPosition;
      try {
        pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        );
      } catch {
        setStatus('error');
        setError('位置情報の取得に失敗しました。ブラウザの位置情報を許可してください。');
        return;
      }
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setStatus('loading');
      const city = await reverseGeocode(lat, lon);
      loc = { latitude: lat, longitude: lon, city };
    } else {
      const city = MAJOR_CITIES.find((c) => c.name === cityName)!;
      loc = { latitude: city.lat, longitude: city.lon, city: city.name };
      setStatus('loading');
    }

    setLocation(loc);

    try {
      const rawData = await fetchWeather(loc);
      setRawWeatherData(rawData);
      setForecasts(calcForecasts(rawData, paintType));
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : '天気データの取得に失敗しました');
    }
  }

  function handleLocationModeChange(mode: LocationMode) {
    setLocationMode(mode);
    if (mode === 'gps') {
      load('gps');
    } else {
      load('city', selectedCityName);
    }
  }

  function handleCityChange(cityName: string) {
    setSelectedCityName(cityName);
    load('city', cityName);
  }

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const bestDay = forecasts.reduce<DayForecast | null>(
    (best, d) => (!best || d.paintingScore > best.paintingScore ? d : best),
    null
  );

  function handleShare() {
    const paintLabel = PAINT_TYPE_OPTIONS.find((o) => o.type === paintType)!.label;
    const text = bestDay
      ? `🎨 塗装日和チェック！ ${formatDateJa(bestDay.date)}が${paintLabel}系塗装におすすめ（スコア ${bestDay.paintingScore}）`
      : '🎨 今日の塗装日和をチェック！';
    const url = 'https://paintingdayfinder.vercel.app/';

    if (navigator.share) {
      navigator.share({ title: '塗装日和', text, url }).catch(() => {});
    } else {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=塗装日和,プラモデル,ガンプラ`;
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    }
  }

  const currentPaintOption = PAINT_TYPE_OPTIONS.find((o) => o.type === paintType)!;

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ヘッダー */}
        <header className="mb-4 text-center">
          <h1 className="text-3xl font-bold text-gray-800">🎨 塗装日和</h1>
          <p className="text-gray-500 mt-1 text-sm">
            模型・ホビー塗装に最適な日をお知らせします
          </p>
          {/* コラムへのナビゲーション */}
          <Link
            href="/column"
            className="inline-block mt-2 text-xs text-indigo-500 hover:text-indigo-700 underline"
          >
            📖 塗装テクニックコラム
          </Link>
        </header>

        {/* 条件設定カード */}
        <div className="mb-5 bg-white rounded-2xl border border-gray-200 shadow-sm">

          {/* 塗料の種類 */}
          <div className="p-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">塗料の種類</p>
            <div className="flex gap-2">
              {PAINT_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handlePaintTypeChange(opt.type)}
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
            <p className="text-xs text-gray-400 mt-2">{currentPaintOption.description}</p>
          </div>

          <div className="border-t border-gray-100 mx-4" />

          {/* 場所 */}
          <div className="p-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">場所</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleLocationModeChange('gps')}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-colors border ${
                  locationMode === 'gps'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                📍 現在地
              </button>
              <button
                type="button"
                onClick={() => handleLocationModeChange('city')}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-colors border ${
                  locationMode === 'city'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                🏙️ 都市を選択
              </button>
            </div>

            {locationMode === 'city' && (
              <select
                value={selectedCityName}
                onChange={(e) => handleCityChange(e.target.value)}
                aria-label="都市を選択"
                className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:border-indigo-400"
              >
                {CITY_REGIONS.map((region) => (
                  <optgroup key={region} label={region}>
                    {MAJOR_CITIES.filter((c) => c.region === region).map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}

            {location && (
              <p className="mt-2 text-xs text-gray-500">
                現在：{location.city || `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
                {locationMode === 'gps' && (
                  <button
                    type="button"
                    onClick={() => load('gps')}
                    className="ml-2 text-indigo-500 hover:text-indigo-700 underline"
                  >
                    再読み込み
                  </button>
                )}
              </p>
            )}
          </div>
        </div>

        {/* 結果セクション見出し */}
        {(status === 'loading' || status === 'locating' || status === 'success') && (
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            7日間の塗装スコア
          </p>
        )}

        {/* ローディング */}
        {(status === 'locating' || status === 'loading') && (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-10 h-10 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-gray-500">
              {status === 'locating' ? '位置情報を取得中...' : '天気データを取得中...'}
            </p>
          </div>
        )}

        {/* エラー */}
        {status === 'error' && (
          <div className="bg-red-50 border border-red-300 rounded-2xl p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => load()}
              className="px-5 py-2 bg-indigo-600 text-white rounded-full text-sm hover:bg-indigo-700 transition-colors"
            >
              再試行
            </button>
          </div>
        )}

        {/* 初期状態 */}
        {status === 'idle' && (
          <div className="text-center py-16">
            <button
              type="button"
              onClick={() => load()}
              className="px-8 py-3 bg-indigo-600 text-white rounded-full text-base font-semibold hover:bg-indigo-700 transition-colors shadow"
            >
              天気を取得する
            </button>
          </div>
        )}

        {/* 最適日バナー */}
        {status === 'success' && bestDay && bestDay.scoreLabel !== 'poor' && (
          <div className="bg-linear-to-r from-green-100 to-emerald-100 border border-green-300 rounded-2xl p-4 mb-5 text-center">
            <p className="text-sm text-green-700 font-semibold">今後7日間の塗装おすすめ日</p>
            <p className="text-lg font-bold text-green-800 mt-0.5">
              {formatDateJa(bestDay.date)}（スコア {bestDay.paintingScore}）
            </p>
            <button
              type="button"
              onClick={handleShare}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 bg-white border border-green-300 text-green-700 rounded-full text-xs font-semibold hover:bg-green-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              結果をシェア
            </button>
          </div>
        )}

        {/* 予報リスト */}
        {status === 'success' && (
          <main>
            {/* 凡例（リストの直前に配置） */}
            <div className="flex gap-3 mb-3 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />最適</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />良好</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />やや注意</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />不向き</span>
            </div>

            <div className="space-y-3">
              {forecasts.map((f) => (
                <DayCard key={f.date} forecast={f} isToday={f.date === today} />
              ))}
            </div>
            <AffiliateItems score={bestDay?.paintingScore ?? 0} />
          </main>
        )}

        {/* コラムへの誘導 */}
        <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
          <p className="text-sm font-semibold text-indigo-700 mb-1">📖 塗装をもっと上手くなりたい方へ</p>
          <p className="text-xs text-indigo-500 mb-3">湿度・気温・塗料の関係を解説したコラムを公開中</p>
          <Link
            href="/column"
            className="inline-block px-5 py-2 bg-indigo-600 text-white rounded-full text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            コラムを読む
          </Link>
        </div>

        <footer className="mt-6 text-center text-xs text-gray-400">
          気象データ:{' '}
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline">
            Open-Meteo
          </a>
          　地名:{' '}
          <a href="https://nominatim.org/" target="_blank" rel="noopener noreferrer" className="underline">
            Nominatim/OSM
          </a>
        </footer>
      </div>
    </div>
  );
}

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
function formatDateJa(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日（${DAY_NAMES[d.getDay()]}）`;
}
