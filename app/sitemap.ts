import type { MetadataRoute } from 'next';
import { SITE_URL, sitemapRoutes } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return sitemapRoutes().map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFreq as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: r.priority,
  }));
}
