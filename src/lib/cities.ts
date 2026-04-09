export interface City {
  name: string;
  slug: string;
  lat: number;
  lon: number;
  region: string;
}

export const CITIES: City[] = [
  // 北海道
  { name: '札幌',     slug: 'sapporo',    lat: 43.0642, lon: 141.3469, region: '北海道' },
  // 東北
  { name: '青森',     slug: 'aomori',     lat: 40.8222, lon: 140.7475, region: '東北' },
  { name: '盛岡',     slug: 'morioka',    lat: 39.7036, lon: 141.1527, region: '東北' },
  { name: '仙台',     slug: 'sendai',     lat: 38.2688, lon: 140.8721, region: '東北' },
  { name: '秋田',     slug: 'akita',      lat: 39.7186, lon: 140.1023, region: '東北' },
  { name: '山形',     slug: 'yamagata',   lat: 38.2404, lon: 140.3633, region: '東北' },
  { name: '福島',     slug: 'fukushima',  lat: 37.7500, lon: 140.4676, region: '東北' },
  // 関東
  { name: '水戸',     slug: 'mito',       lat: 36.3418, lon: 140.4468, region: '関東' },
  { name: '宇都宮',   slug: 'utsunomiya', lat: 36.5551, lon: 139.8828, region: '関東' },
  { name: '前橋',     slug: 'maebashi',   lat: 36.3895, lon: 139.0633, region: '関東' },
  { name: 'さいたま', slug: 'saitama',    lat: 35.8617, lon: 139.6456, region: '関東' },
  { name: '千葉',     slug: 'chiba',      lat: 35.6073, lon: 140.1063, region: '関東' },
  { name: '東京',     slug: 'tokyo',      lat: 35.6895, lon: 139.6917, region: '関東' },
  { name: '横浜',     slug: 'yokohama',   lat: 35.4437, lon: 139.6380, region: '関東' },
  // 中部
  { name: '新潟',     slug: 'niigata',    lat: 37.9026, lon: 139.0232, region: '中部' },
  { name: '富山',     slug: 'toyama',     lat: 36.6953, lon: 137.2113, region: '中部' },
  { name: '金沢',     slug: 'kanazawa',   lat: 36.5613, lon: 136.6562, region: '中部' },
  { name: '福井',     slug: 'fukui',      lat: 36.0652, lon: 136.2216, region: '中部' },
  { name: '甲府',     slug: 'kofu',       lat: 35.6636, lon: 138.5685, region: '中部' },
  { name: '長野',     slug: 'nagano',     lat: 36.6513, lon: 138.1813, region: '中部' },
  { name: '岐阜',     slug: 'gifu',       lat: 35.4232, lon: 136.7607, region: '中部' },
  { name: '静岡',     slug: 'shizuoka',   lat: 34.9756, lon: 138.3828, region: '中部' },
  { name: '名古屋',   slug: 'nagoya',     lat: 35.1815, lon: 136.9066, region: '中部' },
  // 近畿
  { name: '津',       slug: 'tsu',        lat: 34.7303, lon: 136.5086, region: '近畿' },
  { name: '大津',     slug: 'otsu',       lat: 35.0045, lon: 135.8686, region: '近畿' },
  { name: '京都',     slug: 'kyoto',      lat: 35.0116, lon: 135.7681, region: '近畿' },
  { name: '大阪',     slug: 'osaka',      lat: 34.6937, lon: 135.5022, region: '近畿' },
  { name: '神戸',     slug: 'kobe',       lat: 34.6913, lon: 135.1830, region: '近畿' },
  { name: '奈良',     slug: 'nara',       lat: 34.6851, lon: 135.8050, region: '近畿' },
  { name: '和歌山',   slug: 'wakayama',   lat: 34.2260, lon: 135.1675, region: '近畿' },
  // 中国
  { name: '鳥取',     slug: 'tottori',    lat: 35.5011, lon: 134.2351, region: '中国' },
  { name: '松江',     slug: 'matsue',     lat: 35.4681, lon: 133.0485, region: '中国' },
  { name: '岡山',     slug: 'okayama',    lat: 34.6618, lon: 133.9350, region: '中国' },
  { name: '広島',     slug: 'hiroshima',  lat: 34.3853, lon: 132.4553, region: '中国' },
  { name: '山口',     slug: 'yamaguchi',  lat: 34.1861, lon: 131.4706, region: '中国' },
  // 四国
  { name: '徳島',     slug: 'tokushima',  lat: 34.0657, lon: 134.5593, region: '四国' },
  { name: '高松',     slug: 'takamatsu',  lat: 34.3401, lon: 134.0434, region: '四国' },
  { name: '松山',     slug: 'matsuyama',  lat: 33.8416, lon: 132.7657, region: '四国' },
  { name: '高知',     slug: 'kochi',      lat: 33.5597, lon: 133.5311, region: '四国' },
  // 九州
  { name: '福岡',     slug: 'fukuoka',    lat: 33.5902, lon: 130.4017, region: '九州' },
  { name: '佐賀',     slug: 'saga',       lat: 33.2494, lon: 130.2990, region: '九州' },
  { name: '長崎',     slug: 'nagasaki',   lat: 32.7503, lon: 129.8779, region: '九州' },
  { name: '熊本',     slug: 'kumamoto',   lat: 32.7898, lon: 130.7417, region: '九州' },
  { name: '大分',     slug: 'oita',       lat: 33.2382, lon: 131.6126, region: '九州' },
  { name: '宮崎',     slug: 'miyazaki',   lat: 31.9077, lon: 131.4202, region: '九州' },
  { name: '鹿児島',   slug: 'kagoshima',  lat: 31.5966, lon: 130.5571, region: '九州' },
  // 沖縄
  { name: '那覇',     slug: 'naha',       lat: 26.2124, lon: 127.6809, region: '沖縄' },
];

export const CITY_REGIONS = [...new Set(CITIES.map((c) => c.region))];

export function getCityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function getCityByName(name: string): City | undefined {
  return CITIES.find((c) => c.name === name);
}
