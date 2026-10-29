import { siteConfig } from '@/lib/site';
import { features } from '@/lib/content/features';
import { solutionPages } from '@/lib/content/solutions';

export default function sitemap() {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes = [
    { path: '', priority: 1.0 },
    { path: '/features', priority: 0.9 },
    { path: '/solutions', priority: 0.9 },
    { path: '/pricing', priority: 0.9 },
    { path: '/about', priority: 0.7 },
    { path: '/contact', priority: 0.8 },
    { path: '/login', priority: 0.6 },
    { path: '/register', priority: 0.8 },
    { path: '/forgot-password', priority: 0.4 },
    { path: '/privacy', priority: 0.4 },
    { path: '/terms', priority: 0.4 },
  ].map((item) => ({
    url: `${base}${item.path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: item.priority,
  }));

  const featureRoutes = features.map((f) => ({
    url: `${base}/features/${f.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const solutionRoutes = solutionPages.map((s) => ({
    url: `${base}/solutions/${s.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...featureRoutes, ...solutionRoutes];
}

