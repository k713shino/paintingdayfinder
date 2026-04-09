import { ImageResponse } from 'next/og';
import { getCityBySlug } from '@/lib/cities';
import { fetchWeather, calcForecasts, calcFailureRate } from '@/lib/weather';

export const runtime = 'edge';
export const alt = '塗装日和';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const LABEL_MAP = {
  excellent: { text: '🟢 最適',    bg: '#dcfce7', fg: '#166534' },
  good:      { text: '🔵 良好',    bg: '#dbeafe', fg: '#1e40af' },
  fair:      { text: '🟡 やや注意', bg: '#fef9c3', fg: '#854d0e' },
  poor:      { text: '🔴 不向き',  bg: '#fee2e2', fg: '#991b1b' },
};

export default async function Image({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);

  if (!city) {
    return new ImageResponse(
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#4f46e5', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'white', fontSize: 48 }}>塗装日和</span>
      </div>,
      size,
    );
  }

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let score = 0;
  let scoreLabel: keyof typeof LABEL_MAP = 'fair';

  try {
    const { daily, hourlyByDate } = await fetchWeather({ latitude: city.lat, longitude: city.lon, city: city.name });
    const forecasts = calcForecasts(daily, 'lacquer', hourlyByDate);
    const todayF = forecasts.find((f) => f.date === today);
    if (todayF) {
      score = todayF.paintingScore;
      scoreLabel = todayF.scoreLabel;
    }
  } catch {
    // フォールバック: スコア非表示
  }

  const label = LABEL_MAP[scoreLabel];
  const failureRate = calcFailureRate(score);
  const dateLabel = `${now.getMonth() + 1}/${now.getDate()}`;

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
        padding: '56px 72px',
        fontFamily: 'sans-serif',
      }}
    >
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
        <span style={{ fontSize: 36 }}>🎨</span>
        <span style={{ fontSize: 28, fontWeight: 700, color: '#4338ca', letterSpacing: 2 }}>塗装日和</span>
        <span style={{ fontSize: 20, color: '#6366f1', marginLeft: 8 }}>模型塗装の最適日チェッカー</span>
      </div>

      {/* 都市名 + 日付 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32 }}>
        <span style={{ fontSize: 64, fontWeight: 900, color: '#1e1b4b' }}>{city.name}</span>
        <span style={{ fontSize: 28, color: '#6366f1' }}>{dateLabel}の塗装スコア</span>
      </div>

      {/* スコア + ラベル */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 140, fontWeight: 900, color: '#4f46e5', lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 22, color: '#6b7280', marginTop: 4 }}>/ 100</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: label.bg,
              color: label.fg,
              borderRadius: 16,
              padding: '12px 28px',
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            {label.text}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 22, color: '#6b7280' }}>ラッカー系 · 室内基準</span>
            <span style={{ fontSize: 22, color: '#9ca3af' }}>失敗リスク {failureRate}%</span>
          </div>
        </div>
      </div>

      {/* フッター */}
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 20, color: '#a5b4fc' }}>paintingdayfinder.vercel.app</span>
      </div>
    </div>,
    size,
  );
}
