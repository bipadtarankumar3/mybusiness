import { siteConfig } from '@/lib/site';
import styles from '@/styles/marketingPages.module.css';

export const metadata = {
  title: 'Privacy Policy',
  description: `How ${siteConfig.name} collects, uses, isolates and protects your business and customer information.`,
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <>
      <section className={styles.pageHero}>
        <div className={`container ${styles.pageHeroInner}`}>
          <span className="eyebrow">Legal &amp; Trust</span>
          <h1>Privacy Policy</h1>
          <p>
            Clear explanation of how {siteConfig.name} processes account information, customer
            records, and messaging integration data.
          </p>
        </div>
      </section>

      <section className="section">
        <div className={`container ${styles.proseBox}`}>
          <div className={`card ${styles.proseSection}`}>
            <h2>1. Information We Collect</h2>
            <p>
              When you register for a {siteConfig.name} workspace, we collect your name, email
              address, hashed password, and business profile details. Within your workspace, you
              may store customer contact details, tags, conversation history, follow-up reminders,
              and recorded sales.
            </p>
          </div>

          <div className={`card ${styles.proseSection}`}>
            <h2>2. Multi-Tenant Data Isolation</h2>
            <p>
              Every customer record, conversation, message, campaign, workflow and usage log is
              scoped to your business workspace. Our backend enforces strict tenant isolation on
              every request based on your authenticated workspace membership.
            </p>
          </div>

          <div className={`card ${styles.proseSection}`}>
            <h2>3. Customer Consent &amp; Opt-Outs</h2>
            <ul className={styles.proseList}>
              <li>
                Businesses using {siteConfig.name} are responsible for obtaining valid customer
                consent before sending marketing or utility messages.
              </li>
              <li>
                Opt-out keywords (such as STOP or UNSUBSCRIBE) automatically mark a contact as
                opted out and exclude them from future campaigns.
              </li>
            </ul>
          </div>

          <div className={`card ${styles.proseSection}`}>
            <h2>4. Security Practices</h2>
            <p>
              Account passwords are never stored in plaintext (hashed using bcrypt). Session tokens
              are delivered via httpOnly cookies, and third-party integration credentials stored in
              the database are encrypted at rest.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

