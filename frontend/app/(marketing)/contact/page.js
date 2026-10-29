import { MessageSquare, ShieldCheck, Clock } from 'lucide-react';
import ContactForm from '@/components/marketing/ContactForm';
import { siteConfig } from '@/lib/site';
import styles from '@/styles/marketingPages.module.css';

export const metadata = {
  title: 'Contact Us — Talk to the Team',
  description: `Have questions about ${siteConfig.name} plans, WhatsApp Business Platform setup or custom Business limits? Send us a message.`,
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <section className={styles.pageHero}>
        <div className={`container ${styles.pageHeroInner}`}>
          <span className="eyebrow">Contact {siteConfig.name}</span>
          <h1>Let’s help your business get set up.</h1>
          <p>
            Ask us about plan limits, official WhatsApp Business Platform onboarding, or custom
            requirements for your team.
          </p>
        </div>
      </section>

      <section className="section">
        <div className={`container ${styles.splitSection}`}>
          <div style={{ display: 'grid', gap: 18 }}>
            <div className={`card ${styles.detailCard}`}>
              <span className="icon-tile tile-green">
                <MessageSquare size={22} />
              </span>
              <h3>Sales &amp; plan guidance</h3>
              <p>
                Not sure whether Starter (₹199/mo), Growth (₹499/mo) or Pro (₹999/mo) fits your
                team? Tell us how many enquiries you handle and we will recommend the right setup.
              </p>
            </div>

            <div className={`card ${styles.detailCard}`}>
              <span className="icon-tile tile-purple">
                <ShieldCheck size={22} />
              </span>
              <h3>Official WhatsApp API setup</h3>
              <p>
                Need help configuring your Meta WhatsApp Business Account, Phone Number ID or
                webhook verification token? We can walk you through the checklist step by step.
              </p>
            </div>

            <div className={`card ${styles.detailCard}`}>
              <span className="icon-tile tile-blue">
                <Clock size={22} />
              </span>
              <h3>Response hours</h3>
              <p>Monday to Saturday · 9:30 AM to 7:00 PM IST ({siteConfig.contact.address}).</p>
            </div>
          </div>

          <div className={`card ${styles.detailCard}`}>
            <h2>Send us a message</h2>
            <p>Fill in the form below and we will get back to you.</p>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}

