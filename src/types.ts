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
