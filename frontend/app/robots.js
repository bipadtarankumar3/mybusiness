import { siteConfig } from '@/lib/site';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/user', '/user/', '/dashboard', '/dashboard/', '/api/', '/reset-password'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}

