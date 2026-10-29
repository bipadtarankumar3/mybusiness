import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Workflow,
  MessageSquare,
  Store,
  GraduationCap,
  Scissors,
  UtensilsCrossed,
  Building2,
} from 'lucide-react';
import { solutionPages, solutionBySlug } from '@/lib/content/solutions';
import { featureBySlug } from '@/lib/content/features';
import { FinalCtaSection } from '@/components/marketing/BottomSections';
import { siteConfig } from '@/lib/site';
import styles from '@/styles/marketingPages.module.css';

const iconMap = {
  Store,
  GraduationCap,
  Scissors,
  UtensilsCrossed,
  Building2,
};

export function generateStaticParams() {
  return solutionPages.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const sol = solutionBySlug[slug];
  if (!sol) return {};
  return {
    title: `${sol.name} — ${sol.headline}`,
    description: sol.intro,
    alternates: { canonical: `/solutions/${sol.slug}` },
  };
}

export default async function SolutionDetailPage({ params }) {
  const { slug } = await params;
  const sol = solutionBySlug[slug];
  if (!sol) notFound();

  const Icon = iconMap[sol.icon] || Store;
  const relatedFeatures = (sol.featureSlugs || [])
    .map((fSlug) => featureBySlug[fSlug])
    .filter(Boolean);

  return (
    <>
      <section className={styles.pageHero}>
        <div className={`container ${styles.pageHeroInner}`}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/solutions">Solutions</Link>
            <span aria-hidden="true">/</span>
            <span>{sol.name}</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className={`icon-tile tile-${sol.tone}`}>
              <Icon size={24} aria-hidden="true" />
            </span>
            <span className="badge badge-green">Industry Solution</span>
          </div>

          <h1>{sol.headline}</h1>
          <p>{sol.intro}</p>

          <div className={styles.heroActions}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Start Free for {sol.name} <ArrowRight size={18} className="arrow" />
            </Link>
            <Link href="/pricing" className="btn btn-outline btn-lg">
              Compare Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Common Pains vs Sample Conversation */}
      <section className="section">
        <div className={`container ${styles.splitSection}`}>
          <div className={`card ${styles.detailCard}`}>
            <span className="badge badge-coral">Common challenges in {sol.name}</span>
            <h2>What slows teams down without a system</h2>
            <ul className={styles.proseList}>
              {sol.pains.map((pain) => (
                <li key={pain} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <AlertCircle size={17} color="#e11d48" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>{pain}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`card ${styles.detailCard}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-green">
                <MessageSquare size={13} /> Sample Conversation
              </span>
              <span className="badge badge-demo">Sample data</span>
            </div>
            <h3>How {siteConfig.name} handles a typical enquiry</h3>
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                display: 'grid',
                gap: 10,
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px 12px 12px 2px',
                  background: '#fff',
                  border: '1px solid var(--border)',
                  fontSize: '0.9rem',
                }}
              >
                <strong>Customer:</strong> “{sol.sample.customer}”
              </div>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px 12px 2px 12px',
                  background: '#dcfce7',
                  border: '1px solid #a7f3d0',
                  fontSize: '0.9rem',
                }}
              >
                <strong>{siteConfig.name}:</strong> “{sol.sample.reply}”
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Applied tag: <strong>{sol.sample.tag}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Workflows */}
      <section className="section" style={{ background: 'var(--surface-2)' }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Ready-to-Use Workflows</span>
            <h2>Example automation rules for {sol.name}</h2>
          </div>

          <div className={styles.cardsGrid2}>
            {sol.workflows.map((wf) => (
              <div key={wf.trigger} className={`card ${styles.detailCard}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="icon-tile tile-purple" style={{ width: 40, height: 40 }}>
                    <Workflow size={20} />
                  </span>
                  <div>
                    <span className="badge badge-purple">Trigger</span>
                    <h3 style={{ marginTop: 4 }}>{wf.trigger}</h3>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                  {wf.steps.map((step, i) => (
                    <div
                      key={step}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        fontSize: '0.88rem',
                      }}
                    >
                      <CheckCircle2 size={16} color="#087F5B" />
                      <span>
                        <strong>Step {i + 1}:</strong> {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Features */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Recommended Modules</span>
            <h2>Features most used by {sol.name.toLowerCase()}</h2>
          </div>

          <div className={styles.cardsGrid3}>
            {relatedFeatures.map((feat) => (
              <Link
                key={feat.slug}
                href={`/features/${feat.slug}`}
                className={`card ${styles.detailCard}`}
              >
                <span className="badge badge-green">{feat.name}</span>
                <h3>{feat.headline}</h3>
                <p>{feat.short}</p>
                <span style={{ color: 'var(--green-deep)', fontWeight: 700, fontSize: '0.9rem' }}>
                  Learn more →
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

