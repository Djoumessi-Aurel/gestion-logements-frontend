import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

  return [
    {
      url:              `${baseUrl}/presentation`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         1.0,
    },
  ];
}
