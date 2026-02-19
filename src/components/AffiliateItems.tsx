// PA-APIが使えるようになったら api/products.ts を使う版に切り替えてください

interface Product {
  asin: string;
  name: string;
  description: string;
  price: string;
  tag: string;
}

const PRODUCTS: Product[] = [
  {
    asin: 'B0DLW4S914',
    name: 'ミネシマ(Mineshima) プラモのためのガラスヤスリ ホビー用ツール GF-1',
    description: 'ゲート処理・表面仕上げに最適なガラスヤスリ',
    price: '¥700前後',
    tag: '工具',
  },
  {
    asin: 'B0013ES7KW',
    name: 'GSIクレオス Mr.うすめ液 特大 400ml',
    description: 'ラッカー系塗料の希釈・洗浄に必須',
    price: '¥680前後',
    tag: 'ラッカー系',
  },
  {
    asin: 'B0CN8W5TV9',
    name: 'タミヤ マスキングテープ 18mm',
    description: '塗り分けに必須の消耗品',
    price: '¥400前後',
    tag: 'マスキング',
  },
  {
    asin: 'B0FT81W68Y',
    name: 'GSIクレオス Mr.サーフェイサー 1500 スプレー グレー',
    description: '塗装前の下地処理に必須',
    price: '¥800前後',
    tag: 'サーフェイサー',
  },
  {
    asin: 'B07L4QNZVF',
    name: 'SwitchBot 温湿度計',
    description: '塗装前の湿度チェックに最適',
    price: '¥2,000前後',
    tag: '湿度管理',
  },
  {
    asin: 'B0BNM9WPWT',
    name: 'タミヤ モデリングブラシ HGII 面相筆 細',
    description: '細部の塗り分けに定番の筆',
    price: '¥500前後',
    tag: '筆',
  },
];

interface Props {
  score: number;
}

export function AffiliateItems({ score }: Props) {
  if (score < 60) return null;

  return (
    <section aria-label="おすすめ塗装グッズ" className="mt-5">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-amber-700 mb-3">
          🛒 塗装日和のおすすめアイテム
        </p>

        <div className="space-y-2">
          {PRODUCTS.map((p) => (
            <a
              key={p.asin}
              href={`https://www.amazon.co.jp/dp/${p.asin}?tag=k713shino-22`}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center justify-between bg-white rounded-xl border border-amber-100 hover:border-amber-300 hover:shadow-sm transition-all px-3 py-2.5 gap-2"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                {p.tag && (
                  <span className="text-[10px] text-indigo-500 font-semibold">
                    {p.tag}
                  </span>
                )}
                <span className="text-sm text-gray-700 leading-tight truncate">
                  {p.name}
                </span>
                {p.description && (
                  <span className="text-[11px] text-gray-400">
                    {p.description}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end shrink-0">
                {p.price && (
                  <span className="text-xs font-semibold text-amber-600">
                    {p.price}
                  </span>
                )}
                <span className="text-[10px] text-indigo-400 mt-0.5">
                  Amazonで見る →
                </span>
              </div>
            </a>
          ))}
        </div>

        <p className="text-[10px] text-gray-400 mt-3">
          ※ Amazonアソシエイトリンクを含みます
        </p>
      </div>
    </section>
  );
}
