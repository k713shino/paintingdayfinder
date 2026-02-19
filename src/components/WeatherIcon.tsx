// WMO Weather Code to emoji mapping
function codeToEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code === 3) return '☁️';
  if (code <= 49) return '🌫️'; // fog/mist
  if (code <= 57) return '🌦️'; // drizzle
  if (code <= 67) return '🌧️'; // rain
  if (code <= 77) return '🌨️'; // snow
  if (code <= 82) return '🌦️'; // rain showers
  if (code <= 86) return '🌨️'; // snow showers
  if (code <= 99) return '⛈️'; // thunderstorm
  return '🌡️';
}

function codeToLabel(code: number): string {
  if (code === 0) return '快晴';
  if (code <= 2) return '晴れ時々曇り';
  if (code === 3) return '曇り';
  if (code <= 49) return '霧';
  if (code <= 57) return '霧雨';
  if (code <= 67) return '雨';
  if (code <= 77) return '雪';
  if (code <= 82) return '雨のち晴れ';
  if (code <= 86) return '雪のち晴れ';
  if (code <= 99) return '雷雨';
  return '不明';
}

export function WeatherIcon({ code }: { code: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-3xl">{codeToEmoji(code)}</span>
      <span className="text-xs text-gray-500">{codeToLabel(code)}</span>
    </div>
  );
}
