import type { Metadata } from 'next';
import Link from 'next/link';
import { columns } from '@/lib/columns';

export const metadata: Metadata = {
  title: '塗装テクニックコラム',
  description:
    '模型・ホビー塗装のテクニックを解説するコラム一覧。湿度・気温・塗料の種類など、塗装日和をより活用するための知識を紹介します。',
};

export default function ColumnListPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        <header className="mb-6">
          <Link href="/" className="text-xs text-indigo-500 hover:underline">
            ← トップに戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">📖 塗装テクニックコラム</h1>
          <p className="text-gray-500 text-sm mt-1">
            湿度・気温・塗料の知識で、もっと上手く塗装しよう
          </p>
        </header>

        <div className="space-y-3">
          {columns.map((col) => (
            <Link
              key={col.slug}
              href={`/column/${col.slug}`}
              className="block bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <p className="text-xs text-gray-400 mb-1">{formatDate(col.date)}</p>
              <h2 className="text-base font-semibold text-gray-800 leading-snug">{col.title}</h2>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{col.description}</p>
              <p className="text-xs text-indigo-500 mt-2">続きを読む →</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            🎨 今日の塗装スコアを確認する
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
