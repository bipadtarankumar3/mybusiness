import Link from 'next/link';
import { Heart, ShieldCheck, IndianRupee, Sparkles, ArrowRight } from 'lucide-react';
import { FinalCtaSection } from '@/components/marketing/BottomSections';
import { siteConfig } from '@/lib/site';
import styles from '@/styles/marketingPages.module.css';

export const metadata = {
  title: `About ${siteConfig.name} — Built for Indian Small Businesses`,
  description: `Learn why we built ${siteConfig.name}: powerful business communication, simple automation, and pricing every small business can afford.`,
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const values = [
    {
      icon: IndianRupee,
      tone: 'tile-green',
      title: 'Radically affordable',
      text: 'Most WhatsApp CRM tools start at ₹2,000–₹3,500 per month before messaging charges. We built our plans starting at ₹0 and ₹199/month so local shops and small teams never get priced out.',
    },
    {
      icon: Sparkles,
      tone: 'tile-purple',
      title: 'Simple on day one',
      text: 'Small business owners should not need a week of training to track enquiries and schedule follow-ups. Every screen is designed for clarity and speed.',
    },
    {
      icon: ShieldCheck,
      tone: 'tile-blue',
      title: 'Honest & compliant',
      text: 'We build strictly for the official WhatsApp Business Platform (Cloud API), enforce opt-in consent, and clearly separate demo previews from provider-confirmed delivery.',
    },
    {
      icon: Heart,
      tone: 'tile-coral',
      title: 'Made for how India works',
      text: 'From retail boutiques and coaching institutes to salons and cloud kitchens, our templates, tags and workflows reflect real Indian SMB conversations.',
    },
  ];

  return (
    <>
      <section className={styles.pageHero}>
        <div className={`container ${styles.pageHeroInner}`}>
          <span className="eyebrow">About {siteConfig.name}</span>
          <h1>Powerful business communication. Simple automation. Pricing every small business can afford.</h1>
          <p>
            Millions of Indian small businesses run their customer relationships over chat — yet
            most software is built and priced for large enterprises. {siteConfig.name} exists to
            close that gap.
          </p>
          <div className={styles.heroActions}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Start Free <ArrowRight size={18} className="arrow" />
            </Link>
            <Link href="/contact" className="btn btn-outline btn-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Our Principles</span>
            <h2>What guides every product decision</h2>
          </div>

          <div className={styles.cardsGrid2}>
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <article key={v.title} className={`card ${styles.detailCard}`}>
                  <span className={`icon-tile ${v.tone}`}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h3>{v.title}</h3>
                  <p>{v.text}</p>
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

