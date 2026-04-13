import type { DayForecast, PaintType } from '@/types';

/** スコアを下げている主因を reasons から読み取り、失敗率の根拠として1行で返す */
export function getFailureRateCause(forecast: DayForecast): string {
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

/** 現在のスコアをSNSシェアまたはURLコピーする */
export async function shareScore(
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

/** ヒーローカード用クイック3項目（ラッカー・水性・トップコート） */
export function getHeroItems(
  forecast: DayForecast,
): { label: string; status: string; level: 'ok' | 'warn' | 'ng' }[] {
  const { humidity, precipitationProbabilityMax } = forecast;

  let lacquerStatus: string;
  let lacquerLevel: 'ok' | 'warn' | 'ng';
  if (humidity < 50 && precipitationProbabilityMax < 20) {
    lacquerStatus = '終日OK'; lacquerLevel = 'ok';
  } else if (humidity < 65) {
    lacquerStatus = '午前推奨'; lacquerLevel = 'warn';
  } else {
    lacquerStatus = '今日は避けて'; lacquerLevel = 'ng';
  }

  let waterbaseStatus: string;
  let waterbaseLevel: 'ok' | 'warn' | 'ng';
  if (humidity < 70) {
    waterbaseStatus = '夜もOK'; waterbaseLevel = 'ok';
  } else if (humidity < 82) {
    waterbaseStatus = '乾燥時間多め'; waterbaseLevel = 'warn';
  } else {
    waterbaseStatus = '乾燥不良注意'; waterbaseLevel = 'ng';
  }

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

export function getDayAdvice(forecast: DayForecast): Advice[] {
  const { humidity, temperatureMax, temperatureMin, windspeedMax, precipitationProbabilityMax } = forecast;
  const tempAvg = (temperatureMax + temperatureMin) / 2;

  let lacquer: Omit<Advice, 'label'>;
  if (humidity < 50 && precipitationProbabilityMax < 20) {
    lacquer = { icon: '✅', message: '終日OK', color: 'text-green-600' };
  } else if (humidity < 65) {
    lacquer = { icon: '🕐', message: '午前中推奨', color: 'text-yellow-600' };
  } else {
    lacquer = { icon: '❌', message: '今日は避けて', color: 'text-red-600' };
  }

  let waterbase: Omit<Advice, 'label'>;
  if (humidity < 70) {
    waterbase = { icon: '✅', message: '夜もOK', color: 'text-green-600' };
  } else if (humidity < 82) {
    waterbase = { icon: '⚠️', message: '乾燥時間を多めに', color: 'text-yellow-600' };
  } else {
    waterbase = { icon: '❌', message: '乾燥不良に注意', color: 'text-red-600' };
  }

  let spray: Omit<Advice, 'label'>;
  if (precipitationProbabilityMax > 50 || windspeedMax > 25) {
    spray = { icon: '❌', message: '室内推奨', color: 'text-red-600' };
  } else if (windspeedMax > 15 || precipitationProbabilityMax > 20) {
    spray = { icon: '⚠️', message: '風向きに注意', color: 'text-yellow-600' };
  } else {
    spray = { icon: '✅', message: '屋外推奨', color: 'text-green-600' };
  }

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

export function getTodayHint(forecast: DayForecast): { emoji: string; technique: string; hint: string } {
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

export function getWeekendVerdict(
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

export function wCodeToIcon(code: number): string {
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

export function wCodeToLabel(code: number): string {
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
