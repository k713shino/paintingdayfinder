export interface City {
  name: string;
  slug: string;
  lat: number;
  lon: number;
  region: string;
}

export const CITIES: City[] = [
  { name: '札幌',     slug: 'sapporo',   lat: 43.0642, lon: 141.3469, region: '北海道' },
  { name: '仙台',     slug: 'sendai',    lat: 38.2688, lon: 140.8721, region: '東北' },
  { name: '東京',     slug: 'tokyo',     lat: 35.6895, lon: 139.6917, region: '関東' },
  { name: '横浜',     slug: 'yokohama',  lat: 35.4437, lon: 139.6380, region: '関東' },
  { name: 'さいたま', slug: 'saitama',   lat: 35.8617, lon: 139.6456, region: '関東' },
  { name: '千葉',     slug: 'chiba',     lat: 35.6073, lon: 140.1063, region: '関東' },
  { name: '新潟',     slug: 'niigata',   lat: 37.9026, lon: 139.0232, region: '中部' },
  { name: '金沢',     slug: 'kanazawa',  lat: 36.5613, lon: 136.6562, region: '中部' },
  { name: '静岡',     slug: 'shizuoka',  lat: 34.9756, lon: 138.3828, region: '中部' },
  { name: '名古屋',   slug: 'nagoya',    lat: 35.1815, lon: 136.9066, region: '中部' },
  { name: '大阪',     slug: 'osaka',     lat: 34.6937, lon: 135.5022, region: '近畿' },
  { name: '京都',     slug: 'kyoto',     lat: 35.0116, lon: 135.7681, region: '近畿' },
  { name: '神戸',     slug: 'kobe',      lat: 34.6913, lon: 135.1830, region: '近畿' },
  { name: '広島',     slug: 'hiroshima', lat: 34.3853, lon: 132.4553, region: '中国' },
  { name: '岡山',     slug: 'okayama',   lat: 34.6618, lon: 133.9350, region: '中国' },
  { name: '高松',     slug: 'takamatsu', lat: 34.3401, lon: 134.0434, region: '四国' },
  { name: '高知',     slug: 'kochi',     lat: 33.5597, lon: 133.5311, region: '四国' },
  { name: '福岡',     slug: 'fukuoka',   lat: 33.5902, lon: 130.4017, region: '九州' },
  { name: '熊本',     slug: 'kumamoto',  lat: 32.7898, lon: 130.7417, region: '九州' },
  { name: '鹿児島',   slug: 'kagoshima', lat: 31.5966, lon: 130.5571, region: '九州' },
  { name: '那覇',     slug: 'naha',      lat: 26.2124, lon: 127.6809, region: '沖縄' },
];

export const CITY_REGIONS = [...new Set(CITIES.map((c) => c.region))];

export function getCityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function getCityByName(name: string): City | undefined {
  return CITIES.find((c) => c.name === name);
}
