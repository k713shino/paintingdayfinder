export type PaintType = 'lacquer' | 'waterbase' | 'enamel';

export interface DayForecast {
  date: string; // YYYY-MM-DD
  temperatureMax: number;
  temperatureMin: number;
  humidity: number; // average relative humidity %
  precipitationProbabilityMax: number; // %
  windspeedMax: number; // km/h
  weatherCode: number; // WMO weather code
  paintingScore: number; // 0-100
  scoreLabel: 'excellent' | 'good' | 'fair' | 'poor';
  reasons: string[];
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
  city?: string;
}

/** Open-Meteo の current パラメータで取得するリアルタイム天気 */
export interface CurrentWeather {
  temperature: number; // °C (整数丸め)
  humidity: number;    // %
  weatherCode: number; // WMO code
  windspeed: number;   // km/h
  precipitation: number; // mm (直近1時間)
  isDay: boolean;
}

/** fetchRawWeather が返す生気象データ（1日分） */
export interface RawDayData {
  date: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  precipProb: number;
  windspeed: number;
  weatherCode: number;
}
