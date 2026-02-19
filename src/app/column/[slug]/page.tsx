import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllSlugs, getColumnBySlug } from '@/lib/mdx';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const col = getColumnBySlug(params.slug);
  if (!col) return {};
  return {
    title: col.title,
    description: col.description,
    openGraph: {
      title: col.title,
      description: col.description,
      type: 'article',
      publishedTime: col.date,
    },
  };
}

export default function ColumnPage({ params }: Props) {
  const col = getColumnBySlug(params.slug);
  if (!col) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* パンくずリスト */}
        <nav className="text-xs text-gray-400 mb-4" aria-label="パンくずリスト">
          <Link href="/" className="hover:underline">トップ</Link>
          <span className="mx-1">/</span>
          <Link href="/column" className="hover:underline">コラム</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-600">{col.title}</span>
        </nav>

        <article className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-xs text-gray-400 mb-2">{formatDate(col.date)}</p>
          <h1 className="text-xl font-bold text-gray-800 leading-snug mb-2">{col.title}</h1>
          <p className="text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">{col.description}</p>

          <div className="prose prose-sm prose-gray max-w-none
            prose-headings:font-bold prose-headings:text-gray-800
            prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2
            prose-p:text-gray-600 prose-p:leading-relaxed
            prose-table:text-sm prose-td:py-1 prose-th:py-1
            prose-strong:text-gray-700
            prose-li:text-gray-600">
            <MDXRemote source={col.content} />
          </div>
        </article>

        <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
          <p className="text-sm font-semibold text-indigo-700 mb-1">今日の塗装スコアをチェック</p>
          <p className="text-xs text-indigo-500 mb-3">
            現在地の天気から塗装に最適な日を自動判定します
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2 bg-indigo-600 text-white rounded-full text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            🎨 塗装日和を見る
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/column" className="text-xs text-indigo-500 hover:underline">
            ← コラム一覧に戻る
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
