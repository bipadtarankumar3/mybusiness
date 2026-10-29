import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/marketing/HeroSection';
import {
  TrustBand,
  ProblemSolutionSection,
  FeatureGridSection,
  ProductShowcaseSection,
  HowItWorksSection,
  IndustrySolutionsSection,
  AutomationShowcaseSection,
} from '@/components/marketing/HomeSections';
import {
  PricingSection,
  FaqSection,
  FinalCtaSection,
} from '@/components/marketing/BottomSections';
import { homepageFaqs } from '@/lib/content/faqs';
import { siteConfig } from '@/lib/site';

export const metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: { canonical: '/' },
};

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: siteConfig.name,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: siteConfig.description,
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'INR',
          lowPrice: '0',
          highPrice: '999',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: homepageFaqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main id="main">
        <HeroSection />
        <TrustBand />
        <ProblemSolutionSection />
        <FeatureGridSection />
        <ProductShowcaseSection />
        <HowItWorksSection />
        <IndustrySolutionsSection />
        <AutomationShowcaseSection />
        <PricingSection showComparison={true} showPricingFaq={false} />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}

