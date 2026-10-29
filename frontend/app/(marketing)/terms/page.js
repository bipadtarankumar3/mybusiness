import { siteConfig } from '@/lib/site';
import styles from '@/styles/marketingPages.module.css';

export const metadata = {
  title: 'Terms of Service',
  description: `Terms governing the use of ${siteConfig.name} CRM, shared inbox, campaigns and automation platform.`,
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <>
      <section className={styles.pageHero}>
        <div className={`container ${styles.pageHeroInner}`}>
          <span className="eyebrow">Legal &amp; Compliance</span>
          <h1>Terms of Service</h1>
          <p>
            Guidelines and terms for businesses using {siteConfig.name} to manage customer
            relationships and communication workflows.
          </p>
        </div>
      </section>

      <section className="section">
        <div className={`container ${styles.proseBox}`}>
          <div className={`card ${styles.proseSection}`}>
            <h2>1. Acceptable Use &amp; Messaging Compliance</h2>
            <p>
              You agree to use {siteConfig.name} in full compliance with applicable Indian laws and
              the official WhatsApp Business Platform Messaging Policy. Unsolicited spam,
              unauthorised scraping, or unofficial automation is strictly prohibited.
            </p>
          </div>

          <div className={`card ${styles.proseSection}`}>
            <h2>2. Plans, Usage Limits &amp; Third-Party Charges</h2>
            <ul className={styles.proseList}>
              <li>
                Subscription fees cover access to the {siteConfig.name} software platform up to the
                limits of your selected plan.
              </li>
              <li>
                External provider messaging charges (such as Meta WhatsApp conversation or template
                fees) and third-party AI provider usage charges are separate and remain your
                responsibility.
              </li>
            </ul>
          </div>

          <div className={`card ${styles.proseSection}`}>
            <h2>3. Demo Mode vs. Live Provider Delivery</h2>
            <p>
              Until official WhatsApp Business Platform credentials or AI provider keys are
              configured, workspaces operate in a clearly labelled Demo Mode. Simulated messages in
              Demo Mode are for testing only and are never transmitted to real phone numbers.
            </p>
          </div>

          <div className={`card ${styles.proseSection}`}>
            <h2>4. Account Security &amp; Cancellation</h2>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials and
              team member access. You may cancel or change your plan at any time through your
              workspace billing settings or by contacting support.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

