import { PricingSection, FinalCtaSection } from '@/components/marketing/BottomSections';
import { siteConfig } from '@/lib/site';

export const metadata = {
  title: 'Pricing — Plans from ₹0/month for Growing Small Businesses',
  description: `Transparent ${siteConfig.name} pricing in INR: Free ₹0, Starter ₹199, Growth ₹499, Pro ₹999 and Business custom plans.`,
  alternates: { canonical: '/pricing' },
};

export default function PricingPage() {
  return (
    <>
      <PricingSection showComparison={true} showPricingFaq={true} />
      <FinalCtaSection />
    </>
  );
}

