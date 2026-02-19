import type { DayForecast, LocationInfo, PaintType, RawDayData } from '../types';

interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    relative_humidity_2m_mean: number[];
    precipitation_probability_max: number[];
    windspeed_10m_max: number[];
    weathercode: number[];
  };
}

/** Open-Meteo から生気象データを取得する（スコア計算は含まない） */
export async function fetchWeather(location: LocationInfo): Promise<RawDayData[]> {
  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'relative_humidity_2m_mean',
      'precipitation_probability_max',
      'windspeed_10m_max',
      'weathercode',
    ].join(','),
    timezone: 'auto',
    forecast_days: '7',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('天気データの取得に失敗しました');

  const data: OpenMeteoResponse = await res.json();
  const { daily } = data;

  return daily.time.map((date, i) => ({
    date,
    tempMax: daily.temperature_2m_max[i],
    tempMin: daily.temperature_2m_min[i],
    humidity: daily.relative_humidity_2m_mean[i],
    precipProb: daily.precipitation_probability_max[i],
    windspeed: daily.windspeed_10m_max[i],
    weatherCode: daily.weathercode[i],
  }));
}

/** 生気象データ + 塗料種別 → スコア付き予報リストに変換する */
export function calcForecasts(rawData: RawDayData[], paintType: PaintType): DayForecast[] {
  return rawData.map((d) => {
    const { score, reasons } = calcPaintingScore(d, paintType);
    return {
      date: d.date,
      temperatureMax: d.tempMax,
      temperatureMin: d.tempMin,
      humidity: d.humidity,
      precipitationProbabilityMax: d.precipProb,
      windspeedMax: d.windspeed,
      weatherCode: d.weatherCode,
      paintingScore: score,
      scoreLabel: scoreToLabel(score),
      reasons,
    };
  });
}

// ---------------------------------------------------------------------------
// スコア計算ロジック
// ---------------------------------------------------------------------------

interface HumidityThreshold {
  veryHigh: number;   // この値超 → 大きく減点
  high: number;       // この値超 → 中程度減点
  slightly: number;   // この値超 → 小減点
  low: number;        // この値未満 → 低湿度減点
}

const HUMIDITY_THRESHOLDS: Record<PaintType, HumidityThreshold> = {
  lacquer:   { veryHigh: 70, high: 60, slightly: 50, low: 30 },
  enamel:    { veryHigh: 75, high: 65, slightly: 55, low: 30 },
  waterbase: { veryHigh: 85, high: 75, slightly: 65, low: 35 },
};

const PAINT_LABEL: Record<PaintType, string> = {
  lacquer:   'ラッカー系',
  enamel:    'エナメル系',
  waterbase: '水性アクリル',
};

function calcHumidityScore(
  humidity: number,
  paintType: PaintType,
): { penalty: number; reason: string } {
  const t = HUMIDITY_THRESHOLDS[paintType];
  const label = PAINT_LABEL[paintType];

  if (humidity > t.veryHigh) {
    const reason = paintType === 'waterbase'
      ? `湿度が高すぎます（${humidity}%）。水性アクリルでも乾燥が著しく遅くなり仕上がりに影響します`
      : `湿度が高すぎます（${humidity}%）。${label}は乾燥・仕上がりに重大な悪影響があります`;
    return { penalty: paintType === 'waterbase' ? 35 : 40, reason };
  }
  if (humidity > t.high) {
    let reason: string;
    if (paintType === 'lacquer') {
      reason = `湿度がやや高め（${humidity}%）。ラッカー系は白化（カブリ）リスクがあります`;
    } else if (paintType === 'waterbase') {
      reason = `湿度がやや高め（${humidity}%）。水性アクリルは比較的耐性がありますが乾燥が遅くなります`;
    } else {
      reason = `湿度がやや高め（${humidity}%）。エナメル系は乾燥が遅くなります`;
    }
    return { penalty: paintType === 'waterbase' ? 15 : 20, reason };
  }
  if (humidity > t.slightly) {
    const reason = paintType === 'waterbase'
      ? `湿度は許容範囲内（${humidity}%）。水性アクリルは問題なく使用できます`
      : `湿度はやや高め（${humidity}%）。${label}は注意しながら作業しましょう`;
    return { penalty: 5, reason };
  }
  if (humidity >= t.low) {
    return {
      penalty: 0,
      reason: `湿度は良好（${humidity}%）`,
    };
  }
  return {
    penalty: paintType === 'waterbase' ? 5 : 10,
    reason: `湿度がやや低め（${humidity}%）。静電気・乾燥速すぎに注意`,
  };
}

function calcPaintingScore(
  input: RawDayData,
  paintType: PaintType,
): { score: number; reasons: string[] } {
  const { tempMax, tempMin, humidity, precipProb, windspeed, weatherCode } = input;
  let score = 100;
  const reasons: string[] = [];

  // 湿度（塗料種別で閾値が変わる）
  const { penalty: humidityPenalty, reason: humidityReason } = calcHumidityScore(humidity, paintType);
  score -= humidityPenalty;
  reasons.push(humidityReason);

  // 気温
  const tempAvg = (tempMax + tempMin) / 2;
  if (tempAvg < 5) {
    score -= 35;
    reasons.push(`気温が低すぎます（最高${tempMax}°C）。塗料の乾燥が著しく遅くなります`);
  } else if (tempAvg < 10) {
    score -= 20;
    reasons.push(`気温がやや低め（最高${tempMax}°C）。乾燥時間が長くなります`);
  } else if (tempAvg > 35) {
    score -= 30;
    reasons.push(`気温が高すぎます（最高${tempMax}°C）。急乾燥・ブラシ詰まりのリスクがあります`);
  } else if (tempAvg > 30) {
    score -= 10;
    reasons.push(`気温がやや高め（最高${tempMax}°C）。エアブラシの詰まりに注意`);
  } else {
    reasons.push(`気温は良好（最高${tempMax}°C）`);
  }

  // 降水確率
  if (precipProb > 70) {
    score -= 30;
    reasons.push(`降水確率が高い（${precipProb}%）。屋外作業は不向きです`);
  } else if (precipProb > 40) {
    score -= 15;
    reasons.push(`降水確率がやや高め（${precipProb}%）`);
  } else if (precipProb > 20) {
    score -= 5;
    reasons.push(`降水確率は低め（${precipProb}%）`);
  } else {
    reasons.push(`降水確率は良好（${precipProb}%）`);
  }

  // 風速
  if (windspeed > 30) {
    score -= 20;
    reasons.push(`風が強い（${windspeed}km/h）。スプレー・エアブラシ作業に影響があります`);
  } else if (windspeed > 20) {
    score -= 10;
    reasons.push(`風がやや強め（${windspeed}km/h）`);
  } else {
    reasons.push(`風は穏やか（${windspeed}km/h）`);
  }

  // 天気コード補正
  if (weatherCode >= 95) {
    score -= 15;
    reasons.push('雷雨の可能性があります');
  } else if (weatherCode >= 61 && weatherCode <= 67) {
    score -= 10;
    reasons.push('雨の予報です');
  } else if (weatherCode >= 71 && weatherCode <= 77) {
    score -= 15;
    reasons.push('雪の予報です');
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

function scoreToLabel(score: number): DayForecast['scoreLabel'] {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ja`
    );
    if (!res.ok) return '';
    const data = await res.json();
    const addr = data.address;
    return addr.city ?? addr.town ?? addr.village ?? addr.county ?? '';
  } catch {
    return '';
  }
}
