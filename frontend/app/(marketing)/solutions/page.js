import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { IndustrySolutionsSection } from '@/components/marketing/HomeSections';
import { FinalCtaSection } from '@/components/marketing/BottomSections';
import { siteConfig } from '@/lib/site';
import styles from '@/styles/marketingPages.module.css';

export const metadata = {
  title: 'Industry Solutions — Retail, Coaching, Salons, Restaurants & Real Estate',
  description: `Discover how Indian small businesses use ${siteConfig.name} to manage customer enquiries, schedule follow-ups and automate daily workflows.`,
  alternates: { canonical: '/solutions' },
};

export default function SolutionsPage() {
  return (
    <>
      <section className={styles.pageHero}>
        <div className={`container ${styles.pageHeroInner}`}>
          <span className="eyebrow">Solutions by Industry</span>
          <h1>Purpose-built workflows for Indian small businesses.</h1>
          <p>
            Every industry has its own rhythm of customer questions, bookings and repeat orders.
            Explore how {siteConfig.name} adapts to yours.
          </p>
          <div className={styles.heroActions}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Start Free <ArrowRight size={18} className="arrow" />
            </Link>
            <Link href="/contact" className="btn btn-outline btn-lg">
              Talk to Our Team
            </Link>
          </div>
        </div>
      </section>

      <IndustrySolutionsSection />
      <FinalCtaSection />
    </>
  );
}

