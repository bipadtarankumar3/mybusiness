import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
  Inbox,
  Workflow,
  Megaphone,
  BarChart3,
} from 'lucide-react';
import { features, featureBySlug } from '@/lib/content/features';
import { FinalCtaSection } from '@/components/marketing/BottomSections';
import { siteConfig } from '@/lib/site';
import styles from '@/styles/marketingPages.module.css';

const iconMap = {
  Users,
  Inbox,
  Workflow,
  Megaphone,
  Sparkles,
  BarChart3,
};

export function generateStaticParams() {
  return features.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const feature = featureBySlug[slug];
  if (!feature) return {};
  return {
    title: `${feature.name} — ${feature.headline}`,
    description: feature.intro,
    alternates: { canonical: `/features/${feature.slug}` },
  };
}

export default async function FeatureDetailPage({ params }) {
  const { slug } = await params;
  const feature = featureBySlug[slug];
  if (!feature) notFound();

  const Icon = iconMap[feature.icon] || Sparkles;
  const otherFeatures = features.filter((f) => f.slug !== feature.slug);

  return (
    <>
      <section className={styles.pageHero}>
        <div className={`container ${styles.pageHeroInner}`}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/features">Features</Link>
            <span aria-hidden="true">/</span>
            <span>{feature.name}</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className={`icon-tile tile-${feature.tone}`}>
              <Icon size={24} aria-hidden="true" />
            </span>
            <span className="badge badge-green">{feature.status}</span>
          </div>

          <h1>{feature.headline}</h1>
          <p>{feature.intro}</p>

          <div className={styles.heroActions}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Try {feature.name} Free <ArrowRight size={18} className="arrow" />
            </Link>
            <Link href="/pricing" className="btn btn-outline btn-lg">
              See Plan Limits
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Key Capabilities</span>
            <h2>What you can do with {feature.name}</h2>
            <p>{feature.short}</p>
          </div>

          <div className={styles.cardsGrid2}>
            {feature.details.map((d) => (
              <article key={d.title} className={`card ${styles.detailCard}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 size={20} color="#087F5B" aria-hidden="true" />
                  <h3>{d.title}</h3>
                </div>
                <p>{d.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--surface-2)' }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Explore More</span>
            <h2>Works seamlessly with the rest of {siteConfig.name}</h2>
          </div>

          <div className={styles.cardsGrid3}>
            {otherFeatures.slice(0, 3).map((other) => (
              <Link
                key={other.slug}
                href={`/features/${other.slug}`}
                className={`card ${styles.detailCard}`}
              >
                <span className="badge">{other.name}</span>
                <h3>{other.headline}</h3>
                <p>{other.short}</p>
                <span style={{ color: 'var(--green-deep)', fontWeight: 700, fontSize: '0.9rem' }}>
                  Explore {other.name} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FinalCtaSection />
    </>
  );
}

