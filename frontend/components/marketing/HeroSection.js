'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  UserCheck,
  TrendingUp,
  Bell,
  Tag,
  Send,
  Zap,
} from 'lucide-react';
import { siteConfig } from '@/lib/site';
import styles from './HeroSection.module.css';

const DEMO_STEPS = [
  {
    id: 0,
    label: '1. Enquiry received',
    leadStatus: 'New Customer',
    leadBadgeClass: 'badge-blue',
    showCustomerMsg: true,
    showAutoReply: false,
    showCustomerReply: false,
    qualified: false,
  },
  {
    id: 1,
    label: '2. Smart auto-reply sent',
    leadStatus: 'Contacted',
    leadBadgeClass: 'badge-yellow',
    showCustomerMsg: true,
    showAutoReply: true,
    showCustomerReply: false,
    qualified: false,
  },
  {
    id: 2,
    label: '3. Lead qualified & tagged',
    leadStatus: 'Qualified Lead',
    leadBadgeClass: 'badge-green',
    showCustomerMsg: true,
    showAutoReply: true,
    showCustomerReply: true,
    qualified: true,
  },
];

export default function HeroSection() {
  const [stepIndex, setStepIndex] = useState(2);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % DEMO_STEPS.length);
    }, 3600);
    return () => clearInterval(timer);
  }, []);

  const currentStep = DEMO_STEPS[stepIndex];

  return (
    <section className={styles.hero}>
      {/* Subtle floating background shapes */}
      <div className={styles.bgShapes} aria-hidden="true">
        <span className={styles.blobGreen} />
        <span className={styles.blobPurple} />
        <span className={styles.blobCoral} />
      </div>

      <div className={`container ${styles.grid}`}>
        {/* Left Column */}
        <motion.div
          className={styles.copyCol}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="eyebrow">
            <span className="live-dot" aria-hidden="true" />
            BUILT FOR SMALL BUSINESSES
          </div>

          <h1 className={styles.headline}>
            Turn{' '}
            <span className={styles.highlightWrap}>
              <span className="text-gradient">Every Conversation</span>
              <svg
                className={styles.coralUnderline}
                viewBox="0 0 320 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 10.5C82 2.5 236 2.5 317 10.5"
                  stroke="#FB7185"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>{' '}
            Into Growth.
          </h1>

          <p className={styles.subheadline}>
            Manage customers, follow up on leads, automate WhatsApp conversations, and grow your
            business — all from one simple, affordable platform.
          </p>

          <div className={styles.ctaRow}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Start Free
              <ArrowRight size={18} className="arrow" aria-hidden="true" />
            </Link>
            <Link href="/features" className="btn btn-outline btn-lg">
              Explore Features
            </Link>
          </div>

          <ul className={styles.reassuranceList}>
            <li>
              <CheckCircle2 size={16} aria-hidden="true" />
              No complicated setup
            </li>
            <li>
              <CheckCircle2 size={16} aria-hidden="true" />
              Built for growing businesses
            </li>
            <li>
              <CheckCircle2 size={16} aria-hidden="true" />
              Transparent pricing
            </li>
          </ul>
        </motion.div>

        {/* Right Column: Interactive Animated SaaS Product Illustration */}
        <motion.div
          className={styles.visualCol}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Floating notification badge — Top Left */}
          <motion.div
            className={`${styles.floatingCard} ${styles.floatTopLeft} float-slow`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
          >
            <span className="icon-tile tile-purple" style={{ width: 38, height: 38, borderRadius: 11 }}>
              <TrendingUp size={18} />
            </span>
            <div>
              <div className={styles.floatMeta}>Campaign result · Sample</div>
              <div className={styles.floatTitle}>12 new enquiries</div>
            </div>
          </motion.div>

          {/* Floating notification badge — Bottom Right */}
          <motion.div
            className={`${styles.floatingCard} ${styles.floatBottomRight} float-med`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="icon-tile tile-green" style={{ width: 38, height: 38, borderRadius: 11 }}>
              <UserCheck size={18} />
            </span>
            <div>
              <div className={styles.floatMeta}>Lead status updated</div>
              <div className={styles.floatTitle}>
                {currentStep.qualified ? 'Qualified Lead ✓' : 'New Customer'}
              </div>
            </div>
          </motion.div>

          {/* Main Inbox + CRM Product Mockup */}
          <div className={styles.mockupWindow} role="region" aria-label="Interactive product demonstration">
            <div className={styles.windowBar}>
              <div className={styles.windowDots} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className={styles.windowTitle}>
                <MessageSquare size={13} aria-hidden="true" />
                {siteConfig.name} Shared Inbox · Sample Demo
              </div>
              <span className="badge badge-demo">Sample data</span>
            </div>

            {/* Interactive step switcher */}
            <div className={styles.stepTabs} role="tablist" aria-label="Conversation flow stage">
              {DEMO_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={stepIndex === idx}
                  className={`${styles.stepTab} ${stepIndex === idx ? styles.stepTabActive : ''}`}
                  onClick={() => setStepIndex(idx)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className={styles.mockupBody}>
              {/* Conversation Panel */}
              <div className={styles.chatPanel}>
                <div className={styles.chatHeader}>
                  <div className={styles.avatar}>AS</div>
                  <div className={styles.chatCustomerMeta}>
                    <div className={styles.chatName}>Ananya Sharma</div>
                    <div className={styles.chatSub}>+91 98765 •••10 · Online</div>
                  </div>
                  <span className={`badge ${currentStep.leadBadgeClass}`}>
                    {currentStep.leadStatus}
                  </span>
                </div>

                <div className={styles.messagesArea}>
                  {/* Customer message */}
                  <motion.div
                    className={styles.bubbleInbound}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className={styles.bubbleSender}>Customer</div>
                    <p>“Hi! Do you have this product in stock?”</p>
                    <span className={styles.bubbleTime}>10:41 AM</span>
                  </motion.div>

                  {/* Automated reply */}
                  <AnimatePresence mode="popLayout">
                    {currentStep.showAutoReply && (
                      <motion.div
                        key="auto-reply"
                        className={styles.bubbleOutbound}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.28 }}
                      >
                        <div className={styles.bubbleAutoTag}>
                          <Zap size={12} aria-hidden="true" /> {siteConfig.name} Auto-Reply
                        </div>
                        <p>
                          “Yes! It’s available. Would you like to see the available colors?”
                        </p>
                        <span className={styles.bubbleTime}>10:41 AM · Instant</span>
                      </motion.div>
                    )}

                    {currentStep.showCustomerReply && (
                      <motion.div
                        key="cust-reply"
                        className={styles.bubbleInbound}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.28 }}
                      >
                        <div className={styles.bubbleSender}>Customer</div>
                        <p>“Yes please! Send me the emerald green and royal blue options.”</p>
                        <span className={styles.bubbleTime}>10:42 AM</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className={styles.composerMock}>
                  <span>Write a reply or press / for templates…</span>
                  <span className={styles.sendIcon} aria-hidden="true">
                    <Send size={14} />
                  </span>
                </div>
              </div>

              {/* Customer Profile & Lead Card */}
              <div className={styles.crmMiniPanel}>
                <div className={styles.crmSection}>
                  <div className={styles.crmSectionTitle}>Customer Profile</div>
                  <div className={styles.profileRow}>
                    <span className="badge badge-purple">New Customer</span>
                    <span className="badge badge-green">Opted-in</span>
                  </div>
                </div>

                <div className={styles.crmSection}>
                  <div className={styles.crmSectionTitle}>Lead Qualification</div>
                  <div className={styles.leadProgress}>
                    <div
                      className={`${styles.leadStage} ${
                        stepIndex >= 0 ? styles.leadStageDone : ''
                      }`}
                    >
                      <span className={styles.stageDot} />
                      Enquiry logged
                    </div>
                    <div
                      className={`${styles.leadStage} ${
                        stepIndex >= 1 ? styles.leadStageDone : ''
                      }`}
                    >
                      <span className={styles.stageDot} />
                      Auto-reply sent
                    </div>
                    <div
                      className={`${styles.leadStage} ${
                        stepIndex >= 2 ? styles.leadStageDone : ''
                      }`}
                    >
                      <span className={styles.stageDot} />
                      <strong>Qualified Lead</strong>
                    </div>
                  </div>
                </div>

                <div className={styles.crmSection}>
                  <div className={styles.crmSectionTitle}>Tags & Follow-up</div>
                  <div className={styles.tagsWrap}>
                    <span className={styles.tagChip}>
                      <Tag size={11} /> Festive Collection
                    </span>
                    <span className={styles.tagChip}>
                      <Bell size={11} /> Follow-up: Today 4 PM
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

