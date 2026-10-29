import Link from 'next/link';
import {
  ArrowRight,
  MessageCircle,
  Globe,
  Camera,
  MessagesSquare,
  CreditCard,
  Sheet,
} from 'lucide-react';
import { FeatureGridSection } from '@/components/marketing/HomeSections';
import { FinalCtaSection } from '@/components/marketing/BottomSections';
import { integrations } from '@/lib/content/features';
import { siteConfig } from '@/lib/site';
import styles from '@/styles/marketingPages.module.css';

export const metadata = {
  title: 'Features — Customer CRM, Shared Inbox, Automation & Campaigns',
  description: `Explore all ${siteConfig.name} features: Customer CRM, Shared Inbox, Smart Automation, Campaign Manager, AI Assistant and Business Analytics.`,
  alternates: { canonical: '/features' },
};

const integrationIconMap = {
  MessageCircle,
  Globe,
  Instagram: Camera,
  Facebook: MessagesSquare,
  CreditCard,
  Sheet,
};

export default function FeaturesPage() {
  return (
    <>
      <section className={styles.pageHero}>
        <div className={`container ${styles.pageHeroInner}`}>
          <span className="eyebrow">All Platform Features</span>
          <h1>Everything your team needs to turn conversations into customers.</h1>
          <p>
            From your first customer list to automated follow-ups and approved template broadcasts,{' '}
            {siteConfig.name} keeps your daily communication simple and organised.
          </p>
          <div className={styles.heroActions}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Start Free <ArrowRight size={18} className="arrow" />
            </Link>
            <Link href="/pricing" className="btn btn-outline btn-lg">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <FeatureGridSection />

      {/* Integrations Section */}
      <section className="section" id="integrations">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Channels &amp; Integrations</span>
            <h2>Built around the official WhatsApp Business Platform</h2>
            <p>
              Start with our built-in CRM and demo inbox immediately, and connect official provider
              credentials when your business is ready.
            </p>
          </div>

          <div className={styles.cardsGrid3}>
            {integrations.map((intg) => {
              const Icon = integrationIconMap[intg.icon] || Globe;
              return (
                <article key={intg.name} className={`card ${styles.detailCard}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`icon-tile tile-${intg.tone}`}>
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span
                      className={`badge ${
                        intg.status === 'In setup' ? 'badge-green' : 'badge-yellow'
                      }`}
                    >
                      {intg.status}
                    </span>
                  </div>
                  <h3>{intg.name}</h3>
                  <p>{intg.note}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <FinalCtaSection />
    </>
  );
}

