import type { MetadataRoute } from 'next';
import { getAllColumns } from '@/lib/mdx';

const BASE_URL = 'https://paintingdayfinder.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const columns = getAllColumns();

  const columnEntries: MetadataRoute.Sitemap = columns.map((col) => ({
    url: `${BASE_URL}/column/${col.slug}`,
    lastModified: new Date(col.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/column`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...columnEntries,
  ];
}
