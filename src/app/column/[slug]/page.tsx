import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getAllColumns, getAllSlugs, getColumnBySlug } from '@/lib/mdx';
import { formatDateFull } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const col = getColumnBySlug(slug);
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

export default async function ColumnPage({ params }: Props) {
  const { slug } = await params;
  const col = getColumnBySlug(slug);
  if (!col) notFound();

  // 関連記事のメタ情報を取得
  const allColumns = getAllColumns();
  const relatedColumns = col.related
    .map((s) => allColumns.find((c) => c.slug === s))
    .filter((c): c is NonNullable<typeof c> => c !== undefined)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 to-indigo-50 py-8 px-4">
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
          <p className="text-xs text-gray-400 mb-2">{formatDateFull(col.date)}</p>
          <h1 className="text-xl font-bold text-gray-800 leading-snug mb-2">{col.title}</h1>
          <p className="text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">{col.description}</p>

          <div className="article-body">
            <MDXRemote source={col.content} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
          </div>
        </article>

        {/* 関連記事 */}
        {relatedColumns.length > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">関連記事</p>
            <div className="space-y-2">
              {relatedColumns.map((related) => (
                <Link
                  key={related.slug}
                  href={`/column/${related.slug}`}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors group"
                >
                  <span className="text-lg leading-none mt-0.5">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700 leading-snug line-clamp-2">
                      {related.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{related.description}</p>
                  </div>
                  <span className="text-gray-300 group-hover:text-indigo-400 shrink-0 mt-1">›</span>
                </Link>
              ))}
            </div>
          </div>
        )}

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
