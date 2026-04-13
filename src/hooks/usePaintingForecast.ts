'use client';

import { useEffect, useState } from 'react';
import type { CurrentWeather, DayForecast, LocationInfo, PaintType, RawDayData, RawHourlySlot, WorkEnvironment } from '@/types';
import { fetchWeather, reverseGeocode, calcForecasts } from '@/lib/weather';
import { CITIES } from '@/lib/cities';
import { getTodayString } from '@/lib/utils';

type Status = 'idle' | 'locating' | 'loading' | 'success' | 'error';
export type LocationMode = 'gps' | 'city';

export interface PaintingForecastState {
  status: Status;
  error: string;
  location: LocationInfo | null;
  forecasts: DayForecast[];
  paintType: PaintType;
  workEnvironment: WorkEnvironment;
  copied: boolean;
  setCopied: (v: boolean) => void;
  showRecordModal: boolean;
  setShowRecordModal: (v: boolean) => void;
  notifPerm: NotificationPermission;
  mounted: boolean;
  currentWeather: CurrentWeather | null;
  locationMode: LocationMode;
  selectedCityName: string;
  today: string;
  bestDay: DayForecast | null;
  saturday: DayForecast | undefined;
  sunday: DayForecast | undefined;
  todayForecast: DayForecast | undefined;
  handlePaintTypeChange: (type: PaintType) => void;
  handleEnvironmentChange: (env: WorkEnvironment) => void;
  handleLocationModeChange: (mode: LocationMode) => void;
  handleCityChange: (cityName: string) => void;
  reload: () => void;
  requestNotification: () => Promise<void>;
}

export function usePaintingForecast(): PaintingForecastState {
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

  const today = getTodayString();

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

  const bestDay = forecasts.reduce<DayForecast | null>(
    (best, d) => (!best || d.paintingScore > best.paintingScore ? d : best),
    null
  );

  const saturday = forecasts.find((f) => new Date(f.date).getDay() === 6);
  const sunday = forecasts.find((f) => new Date(f.date).getDay() === 0);
  const todayForecast = forecasts.find((f) => f.date === today);

  return {
    status,
    error,
    location,
    forecasts,
    paintType,
    workEnvironment,
    copied,
    setCopied,
    showRecordModal,
    setShowRecordModal,
    notifPerm,
    mounted,
    currentWeather,
    locationMode,
    selectedCityName,
    today,
    bestDay,
    saturday,
    sunday,
    todayForecast,
    handlePaintTypeChange,
    handleEnvironmentChange,
    handleLocationModeChange,
    handleCityChange,
    reload: () => load(),
    requestNotification,
  };
}
