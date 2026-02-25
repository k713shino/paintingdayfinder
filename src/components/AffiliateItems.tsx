// PA-APIが使えるようになったら api/products.ts を使う版に切り替えてください
'use client';

import { useMemo } from 'react';

interface Product {
  asin: string;
  name: string;
  description: string;
  price: string;
  tag: string;
}

const PRODUCTS: Product[] = [
  // === 既存6件 ===
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
  // === 追加10件（ASINはAmazonで要確認） ===
  {
    asin: 'B0CH2QZH57',
    name: 'タミヤ クラフトツールシリーズ 先細薄刃ニッパー',
    description: 'ゲート跡が目立たない定番ニッパー',
    price: '¥3,000前後',
    tag: '工具',
  },
  {
    asin: 'B00E5W716A',
    name: 'GSIクレオス ガンダムマーカー 流し込みスミ入れペン ブラック GM301',
    description: '凹モールドを際立たせるパネルライン塗料',
    price: '¥500前後',
    tag: 'スミ入れ',
  },
  {
    asin: 'B000BMYWYC',
    name: 'タミヤ 流し込み接着剤',
    description: 'パーツの合わせ目消しに欠かせない接着剤、Amazonは高いので地元の模型店で買ったほうが安い',
    price: '¥350前後',
    tag: '接着剤',
  },
  {
    asin: 'B09VH99TDT',
    name: 'aurochs 超 極薄刃 ニッパー 片刃 精密 プラスチック専用 工具 プラモデル 模型 ゲートカット せなすけモデル （せなすけブルー/右手用）',
    description: '白化しにくい究極の薄刃ニッパー',
    price: '¥5,000前後',
    tag: '工具',
  },
  {
    asin: 'B0FT822TDR',
    name: 'GSIクレオス Mr.トップコート 水性プレミアムトップコートスプレー つや消し',
    description: '完成品の仕上げに必須のつや消しコート',
    price: '¥700前後',
    tag: 'トップコート',
  },
  {
    asin: 'B006MMP4BA',
    name: 'TAMIYA マークフィット ハードタイプ',
    description: 'デカールをなじませる軟化剤',
    price: '¥300前後',
    tag: 'デカール',
  },
  {
    asin: 'B07YGBG95Y',
    name: 'ゴッドハンド(GodHand) 神ヤス! スポンジ布ヤスリ 3mm厚 3種類セットB',
    description: '各番手を使い分けられる定番スポンジヤスリ',
    price: '¥500前後',
    tag: '工具',
  },
  {
    asin: 'B0CKRXT4J6',
    name: 'タミヤ 棒ヤスリ セット（平・半丸・丸）',
    description: 'パーツ整形・ゲート処理に使う金属ヤスリ',
    price: '¥600前後',
    tag: '工具',
  },
  {
    asin: 'B01EDX3KKG',
    name: 'GSIクレオス Mr.メタルプライマー改',
    description: 'メタルパーツへの塗料食いつきを改善',
    price: '¥1,700前後',
    tag: '下地処理',
  },
  {
    asin: 'B0CCLBCK3L',
    name: 'ウォーハンマー 40000 ペイント ツール セット',
    description: 'ミニチュア塗装に必要なブラシ・塗料・パレットが揃う入門セット',
    price: '¥4,800前後',
    tag: '水性塗料セット',
  },
];

const DISPLAY_COUNT = 5;

interface Props {
  score: number;
}

export function AffiliateItems({ score }: Props) {
  if (score < 60) return null;

  const displayed = useMemo(() => {
    const shuffled = [...PRODUCTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, DISPLAY_COUNT);
  }, []);

  return (
    <section aria-label="おすすめ塗装グッズ" className="mt-5">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-amber-700 mb-3">
          🛒 塗装日和のおすすめアイテム
        </p>

        <div className="space-y-2">
          {displayed.map((p) => (
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
