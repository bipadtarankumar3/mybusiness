import { siteConfig } from '@/lib/site';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/dashboard/', '/api/', '/reset-password'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}

