import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDir = path.join(process.cwd(), 'src/content');

export interface ColumnMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
}

export interface Column extends ColumnMeta {
  content: string;
}

// 全記事のメタ情報一覧を取得
export function getAllColumns(): ColumnMeta[] {
  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.mdx'));

  return files
    .map((filename) => {
      const slug = filename.replace('.mdx', '');
      const filePath = path.join(contentDir, filename);
      const { data } = matter(fs.readFileSync(filePath, 'utf-8'));
      return {
        slug,
        title: data.title ?? '',
        description: data.description ?? '',
        date: data.date ?? '',
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // 新しい順
}

// スラグから記事を1件取得
export function getColumnBySlug(slug: string): Column | null {
  const filePath = path.join(contentDir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const { data, content } = matter(fs.readFileSync(filePath, 'utf-8'));
  return {
    slug,
    title: data.title ?? '',
    description: data.description ?? '',
    date: data.date ?? '',
    content,
  };
}

// 全スラグ一覧（generateStaticParams用）
export function getAllSlugs(): string[] {
  return fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace('.mdx', ''));
}
