'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, ChevronDown, ArrowRight, Sparkles } from 'lucide-react';
import { plans, currency, limitLabels, priceFor, pricingFaq } from '@/lib/pricing';
import { homepageFaqs } from '@/lib/content/faqs';
import { siteConfig } from '@/lib/site';
import styles from './BottomSections.module.css';

/* ---------- Section 11: Pricing ---------- */
export function PricingSection({ showComparison = true, showPricingFaq = false }) {
  const [cycle, setCycle] = useState('monthly');

  return (
    <section className="section" id="pricing">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Simple, Honest Pricing</span>
          <h2>Pricing every small business can afford</h2>
          <p>
            Start free and upgrade only when your team, customer list or automation needs grow. No
            hidden setup fees.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className={styles.billingToggle} role="group" aria-label="Billing cycle">
            <button
              type="button"
              className={`${styles.cycleBtn} ${cycle === 'monthly' ? styles.cycleBtnActive : ''}`}
              aria-pressed={cycle === 'monthly'}
              onClick={() => setCycle('monthly')}
            >
              Monthly billing
            </button>
            <button
              type="button"
              className={`${styles.cycleBtn} ${cycle === 'yearly' ? styles.cycleBtnActive : ''}`}
              aria-pressed={cycle === 'yearly'}
              onClick={() => setCycle('yearly')}
            >
              Yearly billing
              <span className="badge badge-green">2 months free</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className={styles.pricingGrid}>
          {plans.map((plan) => {
            const amount = priceFor(plan, cycle);
            return (
              <motion.article
                key={plan.code}
                className={`card ${styles.planCard} ${
                  plan.recommended ? styles.planRecommended : ''
                }`}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.22 }}
              >
                {plan.recommended && (
                  <div className={styles.recBadge}>
                    <Sparkles size={13} aria-hidden="true" /> Recommended for growing teams
                  </div>
                )}

                <div className={styles.planTop}>
                  <h3>{plan.name}</h3>
                  <p className={styles.planBlurb}>{plan.blurb}</p>
                </div>

                <div className={styles.priceBox}>
                  {amount !== null ? (
                    <>
                      <span className={styles.priceCurrency}>{currency}</span>
                      <span className={styles.priceValue}>{amount.toLocaleString('en-IN')}</span>
                      <span className={styles.pricePeriod}>
                        /{cycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </>
                  ) : (
                    <span className={styles.priceCustom}>Contact sales</span>
                  )}
                </div>

                <Link
                  href={plan.cta.href}
                  className={`btn ${plan.recommended ? 'btn-primary' : 'btn-outline'} btn-block`}
                >
                  {plan.cta.label}
                </Link>

                <div className={styles.limitsList}>
                  {Object.entries(limitLabels).map(([key, label]) => (
                    <div key={key} className={styles.limitRow}>
                      <span>{label}</span>
                      <strong>{plan.limits[key]}</strong>
                    </div>
                  ))}
                </div>

                <ul className={styles.featureList}>
                  {plan.features.map((f) => (
                    <li key={f}>
                      <Check size={15} aria-hidden="true" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            );
          })}
        </div>

        {/* Variable cost disclosure */}
        <div className={`alert alert-info ${styles.costNotice}`}>
          <Info size={18} aria-hidden="true" />
          <div>
            <strong>Transparent note on variable charges:</strong> Plan prices above cover the{' '}
            {siteConfig.name} software workspace. Official WhatsApp Business Platform conversation
            or template messaging charges (billed by Meta/provider), AI usage beyond included plan
            allowances, and taxes may be billed separately. We never promise unrealistic “unlimited
            free WhatsApp broadcasts”.
          </div>
        </div>

        {/* Comparison Table */}
        {showComparison && (
          <div className={styles.comparisonWrap}>
            <h3 className={styles.comparisonTitle}>Compare plan limits at a glance</h3>
            <div className={styles.tableScroll}>
              <table className={styles.compTable}>
                <thead>
                  <tr>
                    <th scope="col">Capability / Limit</th>
                    {plans.map((p) => (
                      <th key={p.code} scope="col">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(limitLabels).map(([key, label]) => (
                    <tr key={key}>
                      <th scope="row">{label}</th>
                      {plans.map((p) => (
                        <td key={p.code}>{p.limits[key]}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">Customer CRM &amp; Follow-ups</th>
                    {plans.map((p) => (
                      <td key={p.code}>Included</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Official WhatsApp charges</th>
                    {plans.map((p) => (
                      <td key={p.code}>Billed separately as per usage</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showPricingFaq && (
          <div className={styles.pricingFaqWrap} id="faq">
            <h3 className={styles.comparisonTitle}>Pricing &amp; usage questions</h3>
            <AccordionList items={pricingFaq} />
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Reusable Accessible Accordion ---------- */
export function AccordionList({ items }) {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className={styles.accordionList}>
      {items.map((item, idx) => {
        const isOpen = openIdx === idx;
        const btnId = `faq-btn-${idx}`;
        const panelId = `faq-panel-${idx}`;
        return (
          <div key={item.q} className={`card ${styles.accordionItem}`}>
            <button
              id={btnId}
              type="button"
              className={styles.accordionTrigger}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIdx(isOpen ? -1 : idx)}
            >
              <span>{item.q}</span>
              <ChevronDown
                size={18}
                className={`${styles.accIcon} ${isOpen ? styles.accIconOpen : ''}`}
                aria-hidden="true"
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className={styles.accordionPanel}
                >
                  <p>{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Section 12: Homepage FAQ ---------- */
export function FaqSection() {
  return (
    <section className={`section ${styles.faqSection}`} id="faq">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Frequently Asked Questions</span>
          <h2>Clear answers before you start</h2>
          <p>
            Straightforward details on what is included today, how WhatsApp and AI configuration
            work, and how pricing is structured.
          </p>
        </div>

        <div className={styles.faqContainer}>
          <AccordionList items={homepageFaqs} />
        </div>
      </div>
    </section>
  );
}

/* ---------- Section 13: Final CTA ---------- */
export function FinalCtaSection() {
  return (
    <section className="section">
      <div className="container">
        <div className={styles.ctaBanner}>
          <div className={styles.ctaGlowLeft} aria-hidden="true" />
          <div className={styles.ctaGlowRight} aria-hidden="true" />

          <div className={styles.ctaContent}>
            <span className={styles.ctaPill}>Built for Indian SMBs</span>
            <h2>Ready to make every customer conversation count?</h2>
            <p>Start with the essentials. Add more capabilities as your business grows.</p>
            <div className={styles.ctaActions}>
              <Link href="/register" className="btn btn-white btn-lg">
                Start Free
                <ArrowRight size={18} className="arrow" aria-hidden="true" />
              </Link>
              <Link href="/pricing" className={`btn btn-lg ${styles.ctaSecondaryBtn}`}>
                Explore Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

