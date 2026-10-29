'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  BellRing,
  Workflow,
  MessageSquare,
  AlertCircle,
  Clock,
  Repeat,
  CheckCircle2,
  Users,
  Inbox,
  Megaphone,
  Sparkles,
  BarChart3,
  ArrowRight,
  Store,
  GraduationCap,
  Scissors,
  UtensilsCrossed,
  Building2,
  ShoppingBag,
  GitBranch,
  UserCheck,
  Tag,
} from 'lucide-react';
import { features } from '@/lib/content/features';
import { solutions } from '@/lib/content/solutions';
import { siteConfig } from '@/lib/site';
import styles from './HomeSections.module.css';

const featureIconMap = {
  Users,
  Inbox,
  Workflow,
  Megaphone,
  Sparkles,
  BarChart3,
};

const solutionIconMap = {
  Store,
  GraduationCap,
  Scissors,
  UtensilsCrossed,
  Building2,
  ShoppingBag,
};

/* ---------- Section 4: Trust and statistics ---------- */
export function TrustBand() {
  const pillars = [
    {
      icon: IndianRupee,
      tone: 'tile-green',
      metric: 'Starts at ₹0',
      title: 'Affordable plans for small businesses',
      desc: 'Paid tiers from ₹199/month — built for local budgets.',
    },
    {
      icon: BellRing,
      tone: 'tile-purple',
      metric: 'Daily reminders',
      title: 'Customer follow-up tools',
      desc: 'Track overdue, today’s and upcoming customer callbacks.',
    },
    {
      icon: Workflow,
      tone: 'tile-blue',
      metric: 'Rule-based',
      title: 'Automated workflows',
      desc: 'Trigger actions on new conversations, keywords or tags.',
    },
    {
      icon: MessageSquare,
      tone: 'tile-coral',
      metric: 'Shared view',
      title: 'Real-time conversation management',
      desc: 'Assign chats, add internal notes and track lead status.',
    },
  ];

  return (
    <section className={styles.trustSection} aria-label="Platform capabilities">
      <div className="container">
        <div className={styles.trustGrid}>
          {pillars.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                className={styles.trustCard}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <span className={`icon-tile ${item.tone}`}>
                  <Icon size={22} aria-hidden="true" />
                </span>
                <div>
                  <div className={styles.trustMetric}>{item.metric}</div>
                  <h2 className={styles.trustTitle}>{item.title}</h2>
                  <p className={styles.trustDesc}>{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Section 5: Problem and solution ---------- */
export function ProblemSolutionSection() {
  const problems = [
    {
      icon: AlertCircle,
      tone: 'tile-coral',
      badge: 'Problem 01',
      title: 'Missed enquiries',
      desc: 'Customer messages get buried under personal chats and busy store hours, so interested buyers move on.',
      visual: '3 unread product questions from yesterday',
    },
    {
      icon: Clock,
      tone: 'tile-yellow',
      badge: 'Problem 02',
      title: 'Forgotten follow-ups',
      desc: 'Without structured reminders, promised callbacks and price quotes slip through the cracks.',
      visual: '“Call me back on Friday” — no reminder set',
    },
    {
      icon: Repeat,
      tone: 'tile-purple',
      badge: 'Problem 03',
      title: 'Manual, repetitive work',
      desc: 'Typing the same timings, catalogue details and status updates takes hours away from running your business.',
      visual: 'Same reply copy-pasted 20+ times a day',
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Why Small Businesses Switch</span>
          <h2>Your customers are chatting. Is your business keeping up?</h2>
          <p>
            When enquiries live across scattered phones and notebooks, every busy day costs you
            leads.
          </p>
        </div>

        <div className={styles.problemGrid}>
          {problems.map((p, idx) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                className={`card ${styles.problemCard}`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
              >
                <div className={styles.problemTop}>
                  <span className={`icon-tile ${p.tone}`}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <span className="badge badge-coral">{p.badge}</span>
                </div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <div className={styles.problemIllustration}>{p.visual}</div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className={styles.solutionBanner}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.solutionText}>
            <span className="badge badge-green">The {siteConfig.name} Solution</span>
            <h3>One simple workspace to manage the entire customer journey.</h3>
            <p>
              Bring your customer list, shared inbox, follow-up reminders, approved campaigns and
              smart automation into a single place your team can learn in minutes.
            </p>
          </div>
          <div className={styles.solutionSteps}>
            <span>
              <CheckCircle2 size={16} /> Capture enquiry
            </span>
            <span>
              <CheckCircle2 size={16} /> Assign &amp; reply
            </span>
            <span>
              <CheckCircle2 size={16} /> Remind &amp; convert
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Section 6: Product feature grid ---------- */
export function FeatureGridSection() {
  return (
    <section className={`section ${styles.altBg}`}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Platform Capabilities</span>
          <h2>Six focused tools that work together</h2>
          <p>
            Everything you need to organise customer conversations, automate routine steps and track
            outcomes — without enterprise complexity.
          </p>
        </div>

        <div className={styles.featureGrid}>
          {features.map((feat, idx) => {
            const Icon = featureIconMap[feat.icon] || Sparkles;
            return (
              <motion.article
                key={feat.slug}
                className={`card ${styles.featureCard}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
              >
                <div className={styles.featureCardHead}>
                  <span className={`icon-tile tile-${feat.tone}`}>
                    <Icon size={24} aria-hidden="true" />
                  </span>
                  <span className="badge">{feat.status}</span>
                </div>

                <h3>{feat.name}</h3>
                <p className={styles.featureShort}>{feat.short}</p>

                {/* Mini visual illustration */}
                <ul className={styles.featureBullets}>
                  {feat.bullets.map((b) => (
                    <li key={b}>
                      <CheckCircle2 size={15} aria-hidden="true" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <Link href={`/features/${feat.slug}`} className={styles.learnMore}>
                  Learn more about {feat.name}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Section 7: Product showcase ---------- */
export function ProductShowcaseSection() {
  const [activeTab, setActiveTab] = useState('inbox');

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Inside the Workspace</span>
          <h2>Designed to feel calm, clear, and fast</h2>
          <p>
            Explore how your team views conversations, customer context, follow-ups, campaigns and
            analytics in one unified interface. All figures below are sample demonstration data.
          </p>
        </div>

        {/* Desktop Dashboard Mockup */}
        <div className={styles.showcaseFrame}>
          <div className={styles.showcaseTopbar}>
            <div className={styles.showcaseDots} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className={styles.showcaseTabGroup} role="tablist" aria-label="Workspace preview tabs">
              {[
                { id: 'inbox', label: 'Shared Inbox & CRM' },
                { id: 'campaigns', label: 'Campaign Manager' },
                { id: 'automation', label: 'Automation Builder' },
                { id: 'analytics', label: 'Business Analytics' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t.id}
                  className={`${styles.showcaseTabBtn} ${
                    activeTab === t.id ? styles.showcaseTabActive : ''
                  }`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <span className="badge badge-demo">Sample data</span>
          </div>

          <div className={styles.showcaseMain}>
            {/* Left Sidebar */}
            <aside className={styles.mockSidebar} aria-label="Sample sidebar">
              <div className={styles.mockWorkspaceName}>Sharma Fashion House</div>
              <ul className={styles.mockNavList}>
                <li className={activeTab === 'inbox' ? styles.mockNavActive : ''}>Inbox (4)</li>
                <li>Contacts</li>
                <li>Follow-ups</li>
                <li className={activeTab === 'campaigns' ? styles.mockNavActive : ''}>Campaigns</li>
                <li className={activeTab === 'automation' ? styles.mockNavActive : ''}>Automation</li>
                <li className={activeTab === 'analytics' ? styles.mockNavActive : ''}>Analytics</li>
              </ul>
            </aside>

            {/* Conversation List */}
            <div className={styles.mockConvList}>
              <div className={styles.mockColumnHeader}>Open Conversations · Sample</div>
              {[
                { name: 'Priya Nair', msg: 'Can you share festive saree photos?', time: '2m', status: 'Qualified', active: true },
                { name: 'Rahul Verma', msg: 'What time does the store close today?', time: '18m', status: 'Contacted', active: false },
                { name: 'Meera Joshi', msg: 'Received the parcel, thank you!', time: '1h', status: 'Customer', active: false },
                { name: 'Arjun Patel', msg: 'Bulk order quote for 25 units?', time: '3h', status: 'Qualified', active: false },
              ].map((c) => (
                <div
                  key={c.name}
                  className={`${styles.mockConvItem} ${c.active ? styles.mockConvItemActive : ''}`}
                >
                  <div className={styles.mockConvRow}>
                    <strong>{c.name}</strong>
                    <span>{c.time}</span>
                  </div>
                  <p>{c.msg}</p>
                  <span className="badge badge-green">{c.status}</span>
                </div>
              ))}
            </div>

            {/* Active Chat */}
            <div className={styles.mockActiveChat}>
              <div className={styles.mockColumnHeader}>
                Priya Nair · Assigned to Riya (Store Manager)
              </div>
              <div className={styles.mockChatHistory}>
                <div className={styles.mockMsgIn}>
                  Hi! Do you have silk festive sarees under ₹4,500? Can you share photos?
                </div>
                <div className={styles.mockMsgOut}>
                  Namaste Priya! Yes, we have 6 new designs in that range. Sharing the catalogue
                  options now.
                </div>
                <div className={styles.mockMsgNote}>
                  Internal note: Prefers pastel shades; wedding in November.
                </div>
              </div>
            </div>

            {/* Right Customer Profile Panel */}
            <div className={styles.mockProfilePanel}>
              <div className={styles.mockColumnHeader}>Customer Details</div>
              <div className={styles.mockProfileBlock}>
                <div className={styles.mockProfileLabel}>Lead Status</div>
                <span className="badge badge-green">Qualified Lead</span>
              </div>
              <div className={styles.mockProfileBlock}>
                <div className={styles.mockProfileLabel}>Customer Tags</div>
                <div className={styles.mockTagList}>
                  <span className="badge badge-purple">Festive Buyer</span>
                  <span className="badge badge-blue">Repeat Enquiry</span>
                </div>
              </div>
              <div className={styles.mockProfileBlock}>
                <div className={styles.mockProfileLabel}>Follow-up Reminder</div>
                <div className={styles.mockFollowupBox}>
                  <BellRing size={14} /> Tomorrow, 11:00 AM — Confirm colour selection
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Three Smaller Product Previews */}
        <div className={styles.subPreviewsGrid}>
          <div className={`card ${styles.subPreviewCard}`}>
            <div className={styles.subPreviewHeader}>
              <span className="icon-tile tile-coral" style={{ width: 38, height: 38 }}>
                <Megaphone size={18} />
              </span>
              <div>
                <h3>Campaign Manager</h3>
                <span className={styles.subPreviewMeta}>Sample preview</span>
              </div>
            </div>
            <p>
              Select an approved template, filter opted-in customers by tag, and inspect estimated
              per-message charges before sending.
            </p>
            <div className={styles.miniMetricBox}>
              <span>Audience: 340 opted-in contacts</span>
              <strong>Est. cost: ₹299.20</strong>
            </div>
          </div>

          <div className={`card ${styles.subPreviewCard}`}>
            <div className={styles.subPreviewHeader}>
              <span className="icon-tile tile-purple" style={{ width: 38, height: 38 }}>
                <Workflow size={18} />
              </span>
              <div>
                <h3>Automation Builder</h3>
                <span className={styles.subPreviewMeta}>Visual rules</span>
              </div>
            </div>
            <p>
              Connect triggers, business-hours conditions and actions like team assignment or
              follow-up creation.
            </p>
            <div className={styles.miniMetricBox}>
              <span>Trigger: Keyword “price”</span>
              <strong>Action: Assign + Follow-up</strong>
            </div>
          </div>

          <div className={`card ${styles.subPreviewCard}`}>
            <div className={styles.subPreviewHeader}>
              <span className="icon-tile tile-green" style={{ width: 38, height: 38 }}>
                <BarChart3 size={18} />
              </span>
              <div>
                <h3>Analytics Dashboard</h3>
                <span className={styles.subPreviewMeta}>Sample data</span>
              </div>
            </div>
            <p>
              Monitor daily enquiries, lead conversion stages, follow-up completion and recorded
              sales.
            </p>
            <div className={styles.miniMetricBox}>
              <span>Recorded sales (sample)</span>
              <strong>₹1,42,500 · 38 orders</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Section 8: How it works ---------- */
export function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Create your business workspace.',
      desc: 'Sign up in under a minute, set your business hours and invite your team members.',
    },
    {
      num: '02',
      title: 'Add customers or connect a supported channel.',
      desc: 'Add contacts with tags and consent status, or configure your official WhatsApp Business Platform credentials.',
    },
    {
      num: '03',
      title: 'Organize conversations and configure workflows.',
      desc: 'Use the shared inbox, schedule follow-up reminders and publish supported automation rules.',
    },
    {
      num: '04',
      title: 'Track enquiries and grow your business.',
      desc: 'Measure enquiries, qualified leads and recorded sales from your analytics dashboard.',
    },
  ];

  return (
    <section className={`section ${styles.altBg}`}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">How It Works</span>
          <h2>From scattered chats to an organised system in four steps</h2>
          <p>Start with your customer list and follow-ups on day one, then layer in automation.</p>
        </div>

        <div className={styles.stepsTimeline}>
          {steps.map((s, idx) => (
            <motion.div
              key={s.num}
              className={`card ${styles.stepCard}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
            >
              <div className={styles.stepNum}>Step {s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Section 9: Industry solutions ---------- */
export function IndustrySolutionsSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Built for Every Local Business</span>
          <h2>Tailored workflows for how Indian businesses sell</h2>
          <p>
            Whether you run a retail shop, a coaching institute, a salon or a real-estate agency,
            see how {siteConfig.name} fits your daily customer conversations.
          </p>
        </div>

        <div className={styles.solutionsGrid}>
          {solutions.map((sol, idx) => {
            const Icon = solutionIconMap[sol.icon] || Store;
            const href = sol.hasPage === false ? '/solutions/retail' : `/solutions/${sol.slug}`;
            return (
              <motion.div
                key={sol.slug}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
              >
                <Link href={href} className={`card ${styles.solutionCard}`}>
                  <div className={styles.solutionCardTop}>
                    <span className={`icon-tile tile-${sol.tone}`}>
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span className="badge">{sol.sample.tag}</span>
                  </div>
                  <h3>{sol.name}</h3>
                  <p>{sol.short}</p>
                  <div className={styles.solutionWorkflowPreview}>
                    <strong>Example workflow:</strong> {sol.workflows[0].trigger} →{' '}
                    {sol.workflows[0].steps.join(' → ')}
                  </div>
                  <span className={styles.learnMore}>
                    Explore {sol.name} solution <ArrowRight size={15} />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Section 10: Automation showcase ---------- */
export function AutomationShowcaseSection() {
  const workflowNodes = [
    {
      type: 'Trigger',
      tone: 'badge-green',
      icon: MessageSquare,
      title: 'New enquiry',
      detail: 'Customer sends first message or matches keyword',
    },
    {
      type: 'Condition',
      tone: 'badge-purple',
      icon: GitBranch,
      title: 'Check business hours',
      detail: 'Mon–Sat · 9:30 AM – 8:00 PM IST',
    },
    {
      type: 'Action',
      tone: 'badge-blue',
      icon: UserCheck,
      title: 'Assign to team member',
      detail: 'Round-robin across active store staff',
    },
    {
      type: 'Action',
      tone: 'badge-green',
      icon: Sparkles,
      title: 'Send an eligible automatic response',
      detail: 'Instant greeting when official WhatsApp API is active',
    },
    {
      type: 'Action',
      tone: 'badge-yellow',
      icon: BellRing,
      title: 'Create follow-up reminder',
      detail: 'Due in 2 hours if conversation remains open',
    },
    {
      type: 'Action',
      tone: 'badge-coral',
      icon: Tag,
      title: 'Update lead status',
      detail: 'Set status → Contacted & add tag “New Enquiry”',
    },
  ];

  return (
    <section className={`section ${styles.automationSection}`}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Visual Workflow Builder</span>
          <h2>Let routine work run in the background.</h2>
          <p>
            Combine triggers, conditions and actions so every new customer enquiry gets assigned,
            followed up and tracked automatically.
          </p>
        </div>

        <div className={styles.workflowCanvas}>
          {workflowNodes.map((node, index) => {
            const Icon = node.icon;
            return (
              <div key={node.title} className={styles.workflowStepWrap}>
                <motion.div
                  className={styles.workflowNode}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.07 }}
                >
                  <div className={styles.nodeHeader}>
                    <span className={`badge ${node.tone}`}>{node.type}</span>
                    <span className={styles.nodeStepNum}>Step {index + 1}</span>
                  </div>
                  <div className={styles.nodeBody}>
                    <span className="icon-tile tile-green" style={{ width: 38, height: 38 }}>
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <h3>{node.title}</h3>
                      <p>{node.detail}</p>
                    </div>
                  </div>
                </motion.div>

                {index < workflowNodes.length - 1 && (
                  <div className={styles.connector} aria-hidden="true">
                    <svg width="36" height="28" viewBox="0 0 36 28">
                      <line
                        x1="18"
                        y1="0"
                        x2="18"
                        y2="28"
                        stroke="#16C784"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

