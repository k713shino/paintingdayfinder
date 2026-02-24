# 塗装日和

模型・ガンプラ・ミニチュアなどのホビー塗装に最適な日を天気予報から自動判定するWebアプリです。

**URL:** https://paintingdayfinder.vercel.app/

## 概要

ブラウザの位置情報を使い、現在地の7日間天気予報を取得。湿度・気温・降水確率・風速をもとに塗装適性スコア（0〜100点）を算出して一覧表示します。塗料の種類（ラッカー系・エナメル系・水性アクリル）によってスコアの閾値が変わります。

## 機能

- **塗装スコア判定** — 湿度・気温・降水確率・風速・天気コードを総合して0〜100点でスコア化
- **塗料種別対応** — ラッカー系 / エナメル系 / 水性アクリルの3種類で閾値を切り替え
- **7日間予報** — Open-Meteo API（無料・APIキー不要）を使用
- **現在地取得** — Geolocation API + Nominatim（OpenStreetMap）による逆ジオコーディング
- **コラム記事** — 湿度・温度・風など塗装に関するMDX形式のコラムを掲載

## スコア基準

| スコア | ラベル | 目安 |
|--------|--------|------|
| 80〜100 | Excellent | 最高の塗装日和 |
| 60〜79 | Good | 良好 |
| 40〜59 | Fair | 注意が必要 |
| 0〜39 | Poor | 避けた方が無難 |

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript (strict) |
| スタイリング | Tailwind CSS v4 |
| コンテンツ | MDX (next-mdx-remote + remark-gfm) |
| 天気データ | [Open-Meteo API](https://open-meteo.com/) |
| 逆ジオコーディング | [Nominatim (OpenStreetMap)](https://nominatim.org/) |
| デプロイ | Vercel |

## ディレクトリ構成

```
src/
├── app/
│   ├── page.tsx              # メインページ（天気取得・スコア表示）
│   ├── layout.tsx            # ルートレイアウト・メタデータ
│   ├── column/               # コラム一覧・記事ページ
│   ├── api/products/         # アフィリエイト商品APIルート
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── DayCard.tsx           # 1日分の予報カード
│   ├── ScoreBadge.tsx        # スコアバッジ
│   ├── WeatherIcon.tsx       # 天気アイコン
│   └── AffiliateItems.tsx    # アフィリエイト商品表示
├── lib/
│   ├── weather.ts            # 天気取得・スコア計算ロジック
│   └── mdx.ts                # MDXファイル読み込み
├── content/                  # コラム記事（MDX）
└── types.ts                  # 共通型定義
```

## 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# Lintチェック
npm run lint
```

開発サーバー起動後、[http://localhost:3000](http://localhost:3000) をブラウザで開いてください。

## 環境変数

`.env.local` に以下を設定します（現状、外部APIキーは不要です）。

```
# 例: アフィリエイト商品APIなどを追加する場合に使用
```

## ライセンス

Private
