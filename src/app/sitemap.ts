import type { MetadataRoute } from 'next';
import { getAllColumns } from '@/lib/mdx';
import { CITIES } from '@/lib/cities';

const BASE_URL = 'https://paintingdayfinder.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const columns = getAllColumns();

  const columnEntries: MetadataRoute.Sitemap = columns.map((col) => ({
    url: `${BASE_URL}/column/${col.slug}`,
    lastModified: new Date(col.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const forecastEntries: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${BASE_URL}/forecast/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
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
    ...forecastEntries,
    ...columnEntries,
  ];
}
