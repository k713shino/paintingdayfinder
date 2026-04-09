import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CITIES, getCityBySlug } from '@/lib/cities';
import { fetchWeather, calcForecasts, calcFailureRate } from '@/lib/weather';
import { DayCard } from '@/components/DayCard';
import type { PaintType } from '@/types';

export const revalidate = 1800; // 30分キャッシュ

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return {};
  return {
    title: `${city.name}の塗装日和 | 模型・ホビー塗装に最適な日`,
    description: `${city.name}の天気予報から模型塗装に最適な7日間を自動判定。湿度・気温・風速・降水確率を総合スコア化して表示します。`,
    openGraph: {
      title: `${city.name}の塗装日和`,
      description: `${city.name}の塗装スコア7日間予報`,
    },
  };
}

const PAINT_TYPES: { type: PaintType; label: string }[] = [
  { type: 'lacquer',   label: 'ラッカー' },
  { type: 'waterbase', label: '水性' },
  { type: 'enamel',    label: 'エナメル' },
];

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

export default async function CityForecastPage({ params }: Props) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  const { daily, hourlyByDate } = await fetchWeather({
    latitude: city.lat,
    longitude: city.lon,
    city: city.name,
  });

  // 3種の塗料すべてのスコアを計算
  const forecastsByType = Object.fromEntries(
    PAINT_TYPES.map(({ type }) => [type, calcForecasts(daily, type, hourlyByDate)])
  ) as Record<PaintType, ReturnType<typeof calcForecasts>>;

  const lacquerForecasts = forecastsByType['lacquer'];
  const bestDay = lacquerForecasts.reduce((best, d) =>
    d.paintingScore > best.paintingScore ? d : best
  );

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const scoreColor: Record<string, string> = {
    excellent: 'text-green-600',
    good:      'text-blue-600',
    fair:      'text-amber-600',
    poor:      'text-red-600',
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* パンくずリスト */}
        <nav className="text-xs text-gray-400 mb-4" aria-label="パンくずリスト">
          <Link href="/" className="hover:underline">トップ</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-600">{city.name}の塗装日和</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🎨 {city.name}の塗装日和</h1>
          <p className="text-gray-500 text-sm mt-1">
            {city.region} · 7日間の模型塗装スコア予報
          </p>
        </header>

        {/* 塗料別スコア比較 */}
        <div className="mb-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">
            今日の塗料別スコア（{today}）
          </p>
          <div className="grid grid-cols-3 gap-3">
            {PAINT_TYPES.map(({ type, label }) => {
              const todayF = forecastsByType[type].find((f) => f.date === today);
              if (!todayF) return null;
              return (
                <div key={type} className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${scoreColor[todayF.scoreLabel]}`}>
                    {todayF.paintingScore}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    失敗リスク {calcFailureRate(todayF.paintingScore)}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 今週のベスト日 */}
        {bestDay && (
          <div className="mb-5 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-1">
              今週の最適日（ラッカー基準）
            </p>
            <p className="text-base font-bold text-indigo-800">
              {(() => {
                const d = new Date(bestDay.date);
                return `${d.getMonth() + 1}/${d.getDate()}（${DAY_NAMES[d.getDay()]}）`;
              })()}
              <span className="ml-2 text-sm font-normal text-indigo-600">
                スコア {bestDay.paintingScore}
              </span>
            </p>
          </div>
        )}

        {/* 7日間リスト（ラッカー） */}
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">
          7日間の塗装スコア（ラッカー系）
        </p>
        <div className="space-y-3 mb-6">
          {lacquerForecasts.map((f) => (
            <DayCard key={f.date} forecast={f} isToday={f.date === today} />
          ))}
        </div>

        {/* CTA */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-1">
            現在地や別の塗料でチェックしたい方は
          </p>
          <p className="text-xs text-gray-400 mb-3">
            塗装日和のメインページではGPS・塗料種類の切り替えが可能です
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            🎨 インタラクティブ版を使う
          </Link>
        </div>

        {/* 他の都市リンク */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">他の都市</p>
          <div className="flex flex-wrap gap-2">
            {CITIES.filter((c) => c.slug !== slug).map((c) => (
              <Link
                key={c.slug}
                href={`/forecast/${c.slug}`}
                className="text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
