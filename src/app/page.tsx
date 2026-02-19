'use client';

import { useEffect, useState } from 'react';
import type { DayForecast, LocationInfo } from '@/types';
import { fetchWeather, reverseGeocode, calcForecasts } from '@/lib/weather';
import { DayCard } from '@/components/DayCard';
import { AffiliateItems } from '@/components/AffiliateItems';
import Link from 'next/link';

type Status = 'idle' | 'locating' | 'loading' | 'success' | 'error';

export default function HomePage() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [forecasts, setForecasts] = useState<DayForecast[]>([]);

  async function load() {
    setStatus('locating');
    setError('');

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
    const loc: LocationInfo = { latitude: lat, longitude: lon, city };
    setLocation(loc);

    try {
      const rawData = await fetchWeather(loc);
      const forecasts = calcForecasts(rawData, 'lacquer');
      setForecasts(forecasts);
      setStatus('success');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : '天気データの取得に失敗しました');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const bestDay = forecasts.reduce<DayForecast | null>(
    (best, d) => (!best || d.paintingScore > best.paintingScore ? d : best),
    null
  );

  function handleShare() {
    const text = bestDay
      ? `🎨 塗装日和チェック！ ${formatDateJa(bestDay.date)}が塗装におすすめ（スコア ${bestDay.paintingScore}）`
      : '🎨 今日の塗装日和をチェック！';
    const url = 'https://paintingdayfinder.vercel.app/';

    if (navigator.share) {
      navigator.share({ title: '塗装日和', text, url }).catch(() => {});
    } else {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=塗装日和,プラモデル,ガンプラ`;
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ヘッダー */}
        <header className="mb-6 text-center">
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

        {/* 位置情報表示 */}
        {location && (
          <div className="text-center mb-4 text-sm text-gray-600">
            📍 {location.city || `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
            <button
              type="button"
              onClick={load}
              className="ml-3 text-indigo-500 hover:text-indigo-700 underline text-xs"
            >
              再読み込み
            </button>
          </div>
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
              onClick={load}
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
              onClick={load}
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
            <div className="space-y-3">
              {forecasts.map((f) => (
                <DayCard key={f.date} forecast={f} isToday={f.date === today} />
              ))}
            </div>
            <AffiliateItems score={bestDay?.paintingScore ?? 0} />
          </main>
        )}

        {/* 凡例 */}
        {status === 'success' && (
          <section aria-label="スコア凡例" className="mt-6 bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">スコアの目安</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
                <span><strong>最適 (80〜100)</strong>: 迷わず塗装OK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />
                <span><strong>良好 (60〜79)</strong>: 概ね問題なし</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
                <span><strong>やや注意 (40〜59)</strong>: 条件に注意</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                <span><strong>不向き (0〜39)</strong>: 塗装は避けて</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-3">
              ※ スコアは湿度・気温・降水確率・風速を基に算出しています。主にラッカー系・エナメル系を想定しています。
            </p>
          </section>
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
