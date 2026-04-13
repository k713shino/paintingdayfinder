'use client';

import { useEffect, useState } from 'react';
import type { CurrentWeather, DayForecast, LocationInfo, PaintType, RawDayData, RawHourlySlot, WorkEnvironment } from '@/types';
import { fetchWeather, reverseGeocode, calcForecasts, calcFailureRate, calcCurrentScore } from '@/lib/weather';
import { CITIES, CITY_REGIONS } from '@/lib/cities';
import { getTodayString } from '@/lib/utils';
import { DayCard } from '@/components/DayCard';
import { AffiliateItems } from '@/components/AffiliateItems';
import { RecordModal } from '@/components/RecordModal';
import Link from 'next/link';

type Status = 'idle' | 'locating' | 'loading' | 'success' | 'error';
type LocationMode = 'gps' | 'city';

const PAINT_TYPE_OPTIONS: { type: PaintType; label: string; description: string }[] = [
  { type: 'lacquer',   label: 'ラッカー', description: '湿度に最も敏感。白化リスクあり' },
  { type: 'waterbase', label: '水性',     description: '湿度耐性が高め。乾燥は遅め' },
  { type: 'enamel',    label: 'エナメル', description: '中間的な湿度耐性' },
];

/** 現在のスコアをSNSシェアまたはURLコピーする */
async function shareScore(
  cityName: string | undefined,
  score: number,
  label: string,
  setCopied: (v: boolean) => void,
) {
  const labelMap: Record<string, string> = { excellent: '最適', good: '良好', fair: 'やや注意', poor: '不向き' };
  const text = `${cityName ? `【${cityName}】` : ''}今日の塗装スコアは ${score}点（${labelMap[label] ?? label}）！ #塗装日和`;
  const url = typeof window !== 'undefined' ? window.location.href : 'https://paintingdayfinder.vercel.app/';
  if (typeof navigator !== 'undefined' && navigator.share) {
    await navigator.share({ title: '塗装日和', text, url }).catch(() => {});
  } else {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
}

/** スコアを下げている主因を reasons から読み取り、失敗率の根拠として1行で返す */
function getFailureRateCause(forecast: DayForecast): string {
  const r = forecast.reasons;
  const hasHumidity = r.some((s) => s.includes('湿度が高') || s.includes('白化'));
  const hasTemp = r.some((s) => s.includes('気温が低') || s.includes('気温が高'));
  const hasRain = r.some((s) => s.includes('降水確率が高') || s.includes('雨') || s.includes('雷'));
  const causes: string[] = [];
  if (hasHumidity) causes.push('高湿度');
  if (hasTemp) causes.push('気温');
  if (hasRain) causes.push('降水');
  if (causes.length === 0) return '※ 気象条件から算出した参考値';
  return `※ ${causes.join('・')}の影響による推定値`;
}

export default function HomePage() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [forecasts, setForecasts] = useState<DayForecast[]>([]);
  const [paintType, setPaintType] = useState<PaintType>('lacquer');
  const [workEnvironment, setWorkEnvironment] = useState<WorkEnvironment>('indoor');
  const [copied, setCopied] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>('default');
  const [mounted, setMounted] = useState(false);
  const [rawWeatherData, setRawWeatherData] = useState<RawDayData[] | null>(null);
  const [hourlyByDate, setHourlyByDate] = useState<Record<string, RawHourlySlot[]> | null>(null);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>(() => {
    if (typeof window === 'undefined') return 'gps';
    return (localStorage.getItem('locationMode') as LocationMode) ?? 'gps';
  });
  const [selectedCityName, setSelectedCityName] = useState<string>(() => {
    if (typeof window === 'undefined') return CITIES[0].name;
    return localStorage.getItem('selectedCityName') ?? CITIES[0].name;
  });

  function handlePaintTypeChange(newType: PaintType) {
    setPaintType(newType);
    if (rawWeatherData) {
      setForecasts(calcForecasts(rawWeatherData, newType, hourlyByDate ?? undefined, workEnvironment));
    }
  }

  function handleEnvironmentChange(env: WorkEnvironment) {
    setWorkEnvironment(env);
    if (rawWeatherData) {
      setForecasts(calcForecasts(rawWeatherData, paintType, hourlyByDate ?? undefined, env));
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
      const city = CITIES.find((c) => c.name === cityName)!;
      loc = { latitude: city.lat, longitude: city.lon, city: city.name };
      setStatus('loading');
    }

    setLocation(loc);

    try {
      const { daily, current, hourlyByDate: hbd } = await fetchWeather(loc);
      setRawWeatherData(daily);
      setHourlyByDate(hbd);
      setCurrentWeather(current);
      setForecasts(calcForecasts(daily, paintType, hbd, workEnvironment));
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : '天気データの取得に失敗しました');
    }
  }

  function handleLocationModeChange(mode: LocationMode) {
    setLocationMode(mode);
    localStorage.setItem('locationMode', mode);
    if (mode === 'gps') {
      load('gps');
    } else {
      load('city', selectedCityName);
    }
  }

  function handleCityChange(cityName: string) {
    setSelectedCityName(cityName);
    localStorage.setItem('selectedCityName', cityName);
    load('city', cityName);
  }

  useEffect(() => {
    setMounted(true);
    load();
    if (typeof Notification !== 'undefined') {
      setNotifPerm(Notification.permission);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 翌日スコアが高い場合、1日1回だけ通知する
  useEffect(() => {
    if (notifPerm !== 'granted' || forecasts.length < 2) return;
    const lastDate = localStorage.getItem('lastNotifDate');
    if (lastDate === today) return;
    const tomorrow = forecasts[1];
    if (tomorrow && tomorrow.paintingScore >= 75) {
      new Notification('🎨 塗装日和', {
        body: `明日（${tomorrow.date.slice(5).replace('-', '/')}）の塗装スコアは${tomorrow.paintingScore}点！塗装チャンスです`,
        icon: '/icon-192x192.png',
      });
      localStorage.setItem('lastNotifDate', today);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forecasts, notifPerm]);

  async function requestNotification() {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
  }

  const today = getTodayString();

  const bestDay = forecasts.reduce<DayForecast | null>(
    (best, d) => (!best || d.paintingScore > best.paintingScore ? d : best),
    null
  );

  const currentPaintOption = PAINT_TYPE_OPTIONS.find((o) => o.type === paintType)!;
  const saturday = forecasts.find((f) => new Date(f.date).getDay() === 6);
  const sunday = forecasts.find((f) => new Date(f.date).getDay() === 0);
  const todayForecast = forecasts.find((f) => f.date === today);

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 to-indigo-50 py-5 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ヘッダー（コンパクト） */}
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">🎨 塗装日和</h1>
            <p className="text-gray-400 text-xs">模型塗装の最適日チェッカー</p>
          </div>
          <Link
            href="/column"
            className="text-xs text-indigo-500 hover:text-indigo-700 underline"
          >
            📖 コラム
          </Link>
        </header>

        {/* 条件設定カード */}
        <div className="mb-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
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

          <div className="p-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">作業環境</p>
            <div className="flex gap-2">
              {([
                { env: 'indoor',  label: '🏠 室内', desc: '風・雨の影響なし。湿度・気温を重視' },
                { env: 'outdoor', label: '🌤️ 屋外', desc: '風・雨・降水確率もスコアに影響' },
              ] as const).map(({ env, label }) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => handleEnvironmentChange(env)}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-colors border ${
                    workEnvironment === env
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {workEnvironment === 'indoor'
                ? '🏠 室内作業：風・雨の影響なし。湿度・気温を重視'
                : '🌤️ 屋外作業：風・雨・降水確率もスコアに影響'}
            </p>
          </div>

          <div className="border-t border-gray-100 mx-4" />

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
                    {CITIES.filter((c) => c.region === region).map((c) => (
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

          {mounted && notifPerm !== 'granted' && (
            <>
              <div className="border-t border-gray-100 mx-4" />
              <div className="px-4 py-3 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  明日のスコアが高いときに通知を受け取る
                </p>
                <button
                  type="button"
                  onClick={requestNotification}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-full px-3 py-1 transition-colors"
                >
                  🔔 通知を有効化
                </button>
              </div>
            </>
          )}
          {mounted && notifPerm === 'granted' && (
            <>
              <div className="border-t border-gray-100 mx-4" />
              <p className="px-4 py-3 text-xs text-green-600">🔔 通知が有効です（翌日スコア75以上で通知）</p>
            </>
          )}
        </div>

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

        {status === 'success' && (
          <>
            {/* ① ヒーローカード：今日の結論（ファーストビューの核心） */}
            {todayForecast && (() => {
              const heroConf = {
                excellent: { accent: 'bg-green-500',  labelColor: 'text-green-600',  label: 'おすすめ',  dot: '🟢' },
                good:      { accent: 'bg-blue-500',   labelColor: 'text-blue-600',   label: '良好',      dot: '🔵' },
                fair:      { accent: 'bg-amber-400',  labelColor: 'text-amber-600',  label: 'やや注意',  dot: '🟡' },
                poor:      { accent: 'bg-red-500',    labelColor: 'text-red-600',    label: '不向き',    dot: '🔴' },
              }[todayForecast.scoreLabel];
              const heroItems = getHeroItems(todayForecast);
              const d = new Date(todayForecast.date);
              const dayName = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
              const currentScore = currentWeather ? calcCurrentScore(currentWeather, paintType, workEnvironment) : null;
              const currentScoreBadge = currentScore ? ({
                excellent: 'bg-green-100 text-green-700',
                good:      'bg-blue-100 text-blue-700',
                fair:      'bg-amber-100 text-amber-700',
                poor:      'bg-red-100 text-red-700',
              } as const)[currentScore.scoreLabel] : '';
              return (
                <div className="mb-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className={`h-2 ${heroConf.accent}`} />
                  <div className="p-5">
                    {/* 判定ヘッド */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">
                            今日の塗装判定・{d.getMonth() + 1}/{d.getDate()}（{dayName}）
                          </p>
                          <button
                            type="button"
                            onClick={() => shareScore(location?.city, todayForecast.paintingScore, todayForecast.scoreLabel, setCopied)}
                            className="text-[10px] text-gray-400 hover:text-indigo-500 transition-colors px-1.5 py-0.5 rounded border border-gray-200 hover:border-indigo-300"
                          >
                            {copied ? '✅ コピー済' : '🔗 シェア'}
                          </button>
                        </div>
                        <p className={`text-2xl font-bold mt-1 ${heroConf.labelColor}`}>
                          {heroConf.dot} 今日の塗装：{heroConf.label}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">塗装スコア</p>
                        <p className={`text-4xl font-bold leading-none ${heroConf.labelColor}`}>
                          {todayForecast.paintingScore}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1.5">
                          失敗リスク:{' '}
                          <span className={`font-bold text-sm ${heroConf.labelColor}`}>
                            {calcFailureRate(todayForecast.paintingScore)}%
                          </span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                          {getFailureRateCause(todayForecast)}
                        </p>
                      </div>
                    </div>

                    {/* 現在の天気 */}
                    {currentWeather && currentScore && (
                      <div className="flex items-center gap-2 text-xs bg-sky-50 rounded-xl px-3 py-2 mb-4 flex-wrap">
                        <span className="text-[10px] font-bold text-sky-500 shrink-0">今の天気</span>
                        <span>{wCodeToIcon(currentWeather.weatherCode)}</span>
                        <span className="text-gray-700 font-semibold">{wCodeToLabel(currentWeather.weatherCode)}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-600">{currentWeather.temperature}°C</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-600">湿度{currentWeather.humidity}%</span>
                        {currentWeather.windspeed >= 10 && (
                          <>
                            <span className="text-gray-400">·</span>
                            <span className="text-gray-600">風{currentWeather.windspeed}km/h</span>
                          </>
                        )}
                        <span className={`ml-auto shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${currentScoreBadge}`}>
                          今のスコア {currentScore.score}
                        </span>
                      </div>
                    )}

                    {/* クイック3項目 */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                      {heroItems.map((item) => (
                        <div key={item.label} className="text-center">
                          <p className="text-[10px] text-gray-400 mb-1">{item.label}</p>
                          <p className={`text-xs font-bold leading-snug ${
                            item.level === 'ok'   ? 'text-green-600' :
                            item.level === 'warn' ? 'text-amber-600' :
                                                    'text-red-600'
                          }`}>
                            {item.level === 'ok' ? '✅' : item.level === 'warn' ? '⚠️' : '❌'}
                            <br />{item.status}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* 記録ボタン */}
                    <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                      <button
                        type="button"
                        onClick={() => setShowRecordModal(true)}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold"
                      >
                        📝 今日の塗装を記録する
                      </button>
                      <Link href="/records" className="ml-4 text-xs text-gray-400 hover:text-gray-600">
                        記録一覧 →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 塗装記録モーダル */}
            {showRecordModal && todayForecast && (
              <RecordModal
                date={today}
                score={todayForecast.paintingScore}
                paintType={paintType}
                environment={workEnvironment}
                onClose={() => setShowRecordModal(false)}
                onSaved={() => setShowRecordModal(false)}
              />
            )}

            {/* ② 週末モデリング予報（習慣化装置） */}
            {(saturday || sunday) && (
              <div className="mb-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500">🗓️ 週末のモデリング予報</p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  {([saturday, sunday] as const).map((day, i) => {
                    const dayLabel = i === 0 ? '土曜日' : '日曜日';
                    if (!day) {
                      return (
                        <div key={i} className="p-4 text-center text-xs text-gray-400 flex items-center justify-center">
                          {dayLabel}は予報範囲外
                        </div>
                      );
                    }
                    const verdict = getWeekendVerdict(day, paintType);
                    const d = new Date(day.date);
                    const colorMap = {
                      excellent: { score: 'text-green-600', badge: 'bg-green-100 text-green-700' },
                      good:      { score: 'text-blue-600',  badge: 'bg-blue-100 text-blue-700' },
                      fair:      { score: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
                      poor:      { score: 'text-red-600',   badge: 'bg-red-100 text-red-700' },
                    }[day.scoreLabel];
                    return (
                      <div key={day.date} className="p-4 text-center">
                        <p className="text-xs text-gray-400 mb-1">
                          {d.getMonth() + 1}/{d.getDate()}（{dayLabel[0]}）
                        </p>
                        <p className="text-[10px] text-gray-400 mb-0.5">塗装スコア</p>
                        <p className={`text-3xl font-bold leading-none ${colorMap.score}`}>{day.paintingScore}</p>
                        <p className="text-[11px] text-gray-500 mt-1.5">
                          失敗リスク:{' '}
                          <span className={`font-bold ${colorMap.score}`}>{calcFailureRate(day.paintingScore)}%</span>
                        </p>
                        <p className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5 ${colorMap.badge}`}>
                          {verdict.label}
                        </p>
                        {verdict.note && (
                          <p className="text-[11px] text-red-500 mt-1">⚠ {verdict.note}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ③ 今日のアドバイス（行動提案ゾーン） */}
            {todayForecast && (
              <>
                <div className="mb-3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-500">💡 今日の塗装アドバイス</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {getDayAdvice(todayForecast).map((advice) => (
                      <div key={advice.label} className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm text-gray-600">{advice.label}</span>
                        <span className={`text-sm font-semibold flex items-center gap-1.5 ${advice.color}`}>
                          <span>{advice.icon}</span>
                          {advice.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 今日の模型ヒント */}
                {(() => {
                  const hint = getTodayHint(todayForecast);
                  return (
                    <div className="mb-4 flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">
                      <span className="text-xl leading-none mt-0.5">{hint.emoji}</span>
                      <div>
                        <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wide mb-0.5">
                          今日の模型ヒント・{hint.technique}
                        </p>
                        <p className="text-sm text-indigo-800 font-medium leading-snug">{hint.hint}</p>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* ④ 7日間の詳細リスト */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
              7日間の塗装スコア
            </p>
            <main>
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
          </>
        )}

        {/* ⑤ コラム（SEO専用・最下部） */}
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

        <footer className="mt-6 space-y-3 text-center text-xs text-gray-400">
          <div className="flex justify-center">
            <a
              href="https://my-boardgame-site.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-[0.7rem] font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
            >
              🎲 Dice Journal — 霧島市発のボードゲーム情報メディア
            </a>
          </div>
          <div>
            気象データ:{' '}
            <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline">
              Open-Meteo
            </a>
            　地名:{' '}
            <a href="https://nominatim.org/" target="_blank" rel="noopener noreferrer" className="underline">
              Nominatim/OSM
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ヘルパー関数
// ---------------------------------------------------------------------------


/** ヒーローカード用クイック3項目（ラッカー・水性・トップコート） */
function getHeroItems(
  forecast: DayForecast,
): { label: string; status: string; level: 'ok' | 'warn' | 'ng' }[] {
  const { humidity, precipitationProbabilityMax } = forecast;

  // ラッカー
  let lacquerStatus: string;
  let lacquerLevel: 'ok' | 'warn' | 'ng';
  if (humidity < 50 && precipitationProbabilityMax < 20) {
    lacquerStatus = '終日OK'; lacquerLevel = 'ok';
  } else if (humidity < 65) {
    lacquerStatus = '午前推奨'; lacquerLevel = 'warn';
  } else {
    lacquerStatus = '今日は避けて'; lacquerLevel = 'ng';
  }

  // 水性
  let waterbaseStatus: string;
  let waterbaseLevel: 'ok' | 'warn' | 'ng';
  if (humidity < 70) {
    waterbaseStatus = '夜もOK'; waterbaseLevel = 'ok';
  } else if (humidity < 82) {
    waterbaseStatus = '乾燥時間多め'; waterbaseLevel = 'warn';
  } else {
    waterbaseStatus = '乾燥不良注意'; waterbaseLevel = 'ng';
  }

  // トップコート
  let topcoatStatus: string;
  let topcoatLevel: 'ok' | 'warn' | 'ng';
  if (precipitationProbabilityMax > 50 || humidity > 75) {
    topcoatStatus = '危険'; topcoatLevel = 'ng';
  } else if (humidity > 60 || precipitationProbabilityMax > 30) {
    topcoatStatus = '午前推奨'; topcoatLevel = 'warn';
  } else {
    topcoatStatus = 'OK'; topcoatLevel = 'ok';
  }

  return [
    { label: 'ラッカー',     status: lacquerStatus,   level: lacquerLevel },
    { label: '水性',         status: waterbaseStatus,  level: waterbaseLevel },
    { label: 'トップコート', status: topcoatStatus,    level: topcoatLevel },
  ];
}

type Advice = { label: string; icon: string; message: string; color: string };

function getDayAdvice(forecast: DayForecast): Advice[] {
  const { humidity, temperatureMax, temperatureMin, windspeedMax, precipitationProbabilityMax } = forecast;
  const tempAvg = (temperatureMax + temperatureMin) / 2;

  // ラッカー系
  let lacquer: Omit<Advice, 'label'>;
  if (humidity < 50 && precipitationProbabilityMax < 20) {
    lacquer = { icon: '✅', message: '終日OK', color: 'text-green-600' };
  } else if (humidity < 65) {
    lacquer = { icon: '🕐', message: '午前中推奨', color: 'text-yellow-600' };
  } else {
    lacquer = { icon: '❌', message: '今日は避けて', color: 'text-red-600' };
  }

  // 水性アクリル
  let waterbase: Omit<Advice, 'label'>;
  if (humidity < 70) {
    waterbase = { icon: '✅', message: '夜もOK', color: 'text-green-600' };
  } else if (humidity < 82) {
    waterbase = { icon: '⚠️', message: '乾燥時間を多めに', color: 'text-yellow-600' };
  } else {
    waterbase = { icon: '❌', message: '乾燥不良に注意', color: 'text-red-600' };
  }

  // 缶スプレー
  let spray: Omit<Advice, 'label'>;
  if (precipitationProbabilityMax > 50 || windspeedMax > 25) {
    spray = { icon: '❌', message: '室内推奨', color: 'text-red-600' };
  } else if (windspeedMax > 15 || precipitationProbabilityMax > 20) {
    spray = { icon: '⚠️', message: '風向きに注意', color: 'text-yellow-600' };
  } else {
    spray = { icon: '✅', message: '屋外推奨', color: 'text-green-600' };
  }

  // エアブラシ
  let airbrush: Omit<Advice, 'label'>;
  if (tempAvg < 10) {
    airbrush = { icon: '⚠️', message: '希釈を薄めに', color: 'text-yellow-600' };
  } else if (tempAvg > 30) {
    airbrush = { icon: '⚠️', message: '急乾燥に注意', color: 'text-yellow-600' };
  } else if (humidity > 75) {
    airbrush = { icon: '⚠️', message: 'ニードル詰まりに注意', color: 'text-yellow-600' };
  } else {
    airbrush = { icon: '✅', message: '問題なし', color: 'text-green-600' };
  }

  return [
    { label: 'ラッカー系', ...lacquer },
    { label: '水性アクリル', ...waterbase },
    { label: '缶スプレー', ...spray },
    { label: 'エアブラシ', ...airbrush },
  ];
}

function getTodayHint(forecast: DayForecast): { emoji: string; technique: string; hint: string } {
  const { humidity, temperatureMax, temperatureMin, precipitationProbabilityMax, windspeedMax } = forecast;
  const tempAvg = (temperatureMax + temperatureMin) / 2;

  if (humidity < 40) {
    return { emoji: '🖌️', technique: 'ドライブラシ', hint: '低湿度でドライブラシが決まりやすい！エッジのハイライトに挑戦してみよう' };
  }
  if (humidity < 55 && tempAvg >= 15 && tempAvg <= 28 && precipitationProbabilityMax < 20) {
    return { emoji: '✨', technique: 'トップコート', hint: 'クリアコートに最適なコンディション。仕上げを一気に進めよう' };
  }
  if (humidity >= 50 && humidity < 68 && precipitationProbabilityMax < 40) {
    return { emoji: '🏷️', technique: 'デカール', hint: 'デカール貼りに適した湿度。水分でしっかり軟化させてから貼ろう' };
  }
  if (humidity >= 68 && humidity < 80) {
    return { emoji: '🔍', technique: '墨入れ', hint: '湿度が高めなので墨入れの乾燥は長めに。少量ずつ伸ばすと滲みを防げる' };
  }
  if (humidity >= 80) {
    return { emoji: '✂️', technique: 'ゲート処理', hint: '塗装には不向きな湿度。ゲート処理・合わせ目消しなど下準備に集中しよう' };
  }
  if (precipitationProbabilityMax > 60) {
    return { emoji: '⚒️', technique: 'スジ彫り', hint: '雨天は屋内作業日和。スジ彫りやディテールアップ加工に集中しよう' };
  }
  if (tempAvg < 12) {
    return { emoji: '⏳', technique: 'パテ硬化', hint: '低温でパテの硬化が遅め。乾燥時間を普段より1.5倍取ると安心' };
  }
  if (windspeedMax > 20) {
    return { emoji: '🔧', technique: '組み立て', hint: '風が強い日はスプレー系を避けて、組み立てや改造作業に集中しよう' };
  }
  return { emoji: '🎨', technique: 'エアブラシ', hint: '絶好の塗装日和！グラデーションや迷彩など、こだわりの塗装に挑戦しよう' };
}

function getWeekendVerdict(
  forecast: DayForecast,
  paintType: PaintType,
): { label: string; note?: string } {
  const { scoreLabel, humidity } = forecast;
  const topcoatRisk = paintType === 'lacquer' ? humidity > 60 : humidity > 75;

  if (scoreLabel === 'excellent') return { label: '最高の塗装日！' };
  if (scoreLabel === 'good') {
    if (topcoatRisk) return { label: '塗装OK', note: 'トップコートは慎重に' };
    return { label: '塗装日和' };
  }
  if (scoreLabel === 'fair') {
    if (topcoatRisk) return { label: 'やや注意', note: 'トップコートは避けて' };
    return { label: '条件に注意' };
  }
  // poor
  if (topcoatRisk) return { label: 'トップコート危険', note: '塗装全般を避けて' };
  return { label: '塗装は避けて' };
}


function wCodeToIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code === 3) return '☁️';
  if (code <= 49) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

function wCodeToLabel(code: number): string {
  if (code === 0) return '快晴';
  if (code <= 2) return '晴れ時々曇り';
  if (code === 3) return '曇り';
  if (code <= 49) return '霧';
  if (code <= 57) return '霧雨';
  if (code <= 67) return '雨';
  if (code <= 77) return '雪';
  if (code <= 82) return '雨のち晴れ';
  if (code <= 86) return '雪のち晴れ';
  return '雷雨';
}
