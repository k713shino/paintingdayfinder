import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://paintingdayfinder.vercel.app'),
  title: {
    default: '塗装日和 | 模型・ホビー塗装に最適な日をお知らせ',
    template: '%s | 塗装日和',
  },
  description:
    '模型・ガンプラ・ミニチュアなどのホビー塗装に最適な日を天気予報から自動判定。湿度・気温・風速・降水確率を総合スコア化して7日分表示します。',
  keywords: ['模型塗装', 'ガンプラ', 'ホビー塗装', 'ラッカー', 'エナメル', '天気', '湿度', '塗装日和', 'プラモデル'],
  authors: [{ name: '塗装日和' }],
  robots: { index: true, follow: true },
  icons: {
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://paintingdayfinder.vercel.app',
    siteName: '塗装日和',
    title: '塗装日和 | 模型・ホビー塗装に最適な日をお知らせ',
    description:
      '模型・ガンプラ・ミニチュアなどのホビー塗装に最適な日を天気予報から自動判定します。',
    images: [
      {
        url: '/ogp.png',
        width: 1200,
        height: 630,
        alt: '塗装日和',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '塗装日和 | 模型・ホビー塗装に最適な日をお知らせ',
    description: '模型塗装に最適な日を天気予報から自動判定。スコアで7日分を一覧表示。',
    images: ['/ogp.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: '塗装日和',
              url: 'https://paintingdayfinder.vercel.app/',
              description:
                '模型・ガンプラ・ミニチュアなどのホビー塗装に最適な日を天気予報から自動判定するWebアプリ',
              applicationCategory: 'UtilitiesApplication',
              operatingSystem: 'Any',
              inLanguage: 'ja',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
            }),
          }}
        />
      </head>
      <body className={notoSansJP.className}>{children}</body>
    </html>
  );
}
