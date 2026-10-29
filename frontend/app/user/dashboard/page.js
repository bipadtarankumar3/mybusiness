'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
  buildDemoAnalyticsOverview,
  formatINR,
  formatRelativeTime,
} from '@/lib/DemoPreviewData';
import {
  Users,
  MessageSquarePlus,
  Inbox,
  BellRing,
  Megaphone,
  IndianRupee,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Workflow,
  RefreshCw,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { user, business, isDemo } = useAuth();
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState(() => buildDemoAnalyticsOverview(30));
  const [loading, setLoading] = useState(true);
  const [hideOnboarding, setHideOnboarding] = useState(false);

  const loadOverview = useCallback(async (selectedDays) => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/overview', { days: selectedDays });
      const data = res?.data || res;
      if (data?.totals) {
        setOverview(data);
      } else {
        setOverview(buildDemoAnalyticsOverview(selectedDays));
      }
    } catch {
      setOverview(buildDemoAnalyticsOverview(selectedDays));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview(days);
  }, [days, loadOverview]);

  const totals = overview?.totals || {};
  const enquiriesSeries = overview?.enquiriesSeries || [];
  const salesSeries = overview?.salesSeries || [];
  const leadFunnel = overview?.leadFunnel || [];
  const recentActivity = overview?.recentActivity || [];

  const onboardingSteps = [
    {
      key: 'contacts',
      title: 'Add or import your first customer contacts',
      done: (totals.contacts || 0) > 0,
      href: '/user/contacts',
      cta: 'Manage Contacts',
    },
    {
      key: 'inbox',
      title: 'Reply to an enquiry or add an internal note in Shared Inbox',
      done: (totals.openConversations || 0) > 0,
      href: '/user/inbox',
      cta: 'Open Inbox',
    },
    {
      key: 'workflow',
      title: 'Publish an automated keyword reply or assignment workflow',
      done: true,
      href: '/user/automation',
      cta: 'View Workflows',
    },
    {
      key: 'whatsapp',
      title: 'Connect official WhatsApp Cloud API credentials for live delivery',
      done: !isDemo,
      href: '/user/integrations',
      cta: 'Setup WhatsApp',
    },
  ];

  const completedSteps = onboardingSteps.filter((s) => s.done).length;

  const kpiCards = [
    {
      label: 'Total Contacts',
      value: Number(totals.contacts || 0).toLocaleString('en-IN'),
      sub: 'Opted-in CRM directory',
      icon: Users,
      tile: 'tile-green',
      href: '/user/contacts',
    },
    {
      label: `New Enquiries (${days}d)`,
      value: Number(totals.newEnquiries || 0).toLocaleString('en-IN'),
      sub: 'Inbound WhatsApp & web leads',
      icon: MessageSquarePlus,
      tile: 'tile-blue',
      href: '/user/inbox',
    },
    {
      label: 'Open Conversations',
      value: Number(totals.openConversations || 0).toLocaleString('en-IN'),
      sub: 'Awaiting agent reply or closure',
      icon: Inbox,
      tile: 'tile-purple',
      href: '/user/inbox?status=open',
    },
    {
      label: 'Follow-ups Due',
      value: Number(totals.followUpsDue || 0).toLocaleString('en-IN'),
      sub: 'Pending & overdue tasks',
      icon: BellRing,
      tile: 'tile-coral',
      href: '/user/follow-ups',
    },
    {
      label: 'Active Campaigns',
      value: Number(totals.activeCampaigns || 0).toLocaleString('en-IN'),
      sub: 'Scheduled or recently sent',
      icon: Megaphone,
      tile: 'tile-yellow',
      href: '/user/campaigns',
    },
    {
      label: `Recorded Sales (${days}d)`,
      value: formatINR(totals.recordedSales || 0),
      sub: 'Closed orders linked to contacts',
      icon: IndianRupee,
      tile: 'tile-green',
      href: '/user/analytics',
    },
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-header-title">
          <h1>
            Namaste, {user?.name?.split(' ')[0] || 'Team'} 👋
          </h1>
          <p>
            Here is what’s happening across <strong>{business?.name || 'your business'}</strong> over the last {days}{' '}
            days.
          </p>
        </div>

        <div className="page-header-actions">
          <div className="tabs-bar" role="group" aria-label="Time range selector">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                className={`tab-btn ${days === d ? 'active' : ''}`}
                onClick={() => setDays(d)}
              >
                {d} Days
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => loadOverview(days)}
            disabled={loading}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Onboarding Checklist Card */}
      {!hideOnboarding && (
        <section className="panel-card" style={{ borderColor: '#bbf0d4', background: 'linear-gradient(180deg, #f3fcf7 0%, #ffffff 100%)' }}>
          <div className="panel-head" style={{ borderBottomColor: '#d9f5e6' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3>Workspace Launchpad</h3>
                <span className="badge badge-green">
                  {completedSteps} of {onboardingSteps.length} completed
                </span>
              </div>
              <p>Complete these quick steps to get the most out of ChatFlow for your store or team.</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHideOnboarding(true)}>
              Dismiss
            </button>
          </div>
          <div className="panel-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              {onboardingSteps.map((step) => (
                <div
                  key={step.key}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {step.done ? (
                      <CheckCircle2 size={19} color="var(--green)" style={{ flexShrink: 0, marginTop: 2 }} />
                    ) : (
                      <Circle size={19} color="var(--muted-2)" style={{ flexShrink: 0, marginTop: 2 }} />
                    )}
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>{step.title}</span>
                  </div>
                  <Link
                    href={step.href}
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--green-deep)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      marginLeft: 29,
                    }}
                  >
                    {step.cta} <ArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* KPI Cards */}
      <section className="kpi-grid" aria-label="Key performance indicators">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-card-label">{card.label}</span>
                <span className={`icon-tile ${card.tile}`} style={{ width: 38, height: 38, borderRadius: 10 }}>
                  <Icon size={19} />
                </span>
              </div>
              <div className="kpi-card-value">{card.value}</div>
              <div className="kpi-card-sub">{card.sub}</div>
            </Link>
          );
        })}
      </section>

      {/* Charts Row */}
      <div className="dash-grid-2">
        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Customer Enquiries Over Time</h3>
              <p>Daily inbound conversations and lead capture volume</p>
            </div>
            <Link href="/user/analytics" className="btn btn-ghost btn-sm">
              Full Analytics →
            </Link>
          </div>
          <div className="panel-body" style={{ minHeight: 290 }}>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <AreaChart data={enquiriesSeries} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="overviewEnquiriesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16C784" stopOpacity={0.38} />
                      <stop offset="95%" stopColor="#16C784" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3ece7" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#5f6f6a' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#5f6f6a' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e3ece7',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Enquiries"
                    stroke="#087F5B"
                    strokeWidth={2.5}
                    fill="url(#overviewEnquiriesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Lead Conversion Funnel</h3>
              <p>Contacts by CRM stage from new enquiry to paying customer</p>
            </div>
            <Link href="/user/contacts" className="btn btn-ghost btn-sm">
              View CRM →
            </Link>
          </div>
          <div className="panel-body" style={{ minHeight: 290 }}>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={leadFunnel} layout="vertical" margin={{ top: 6, right: 18, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3ece7" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#5f6f6a' }} />
                  <YAxis
                    type="category"
                    dataKey="status"
                    width={82}
                    tick={{ fontSize: 12, fill: '#3d4b47', fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e3ece7',
                    }}
                  />
                  <Bar dataKey="count" name="Contacts" fill="#16C784" radius={[0, 8, 8, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Row: Recorded Sales + Recent Activity & Quick Actions */}
      <div className="dash-grid-equal">
        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Recent Workspace Activity</h3>
              <p>Latest messages, sales, campaigns, and automation events</p>
            </div>
          </div>
          <div className="panel-body">
            {recentActivity.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No activity recorded yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {recentActivity.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                      paddingBottom: 12,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'grid', gap: 3 }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
                        {item.description}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                        {item.actor ? `By ${item.actor} • ` : ''}
                        {item.type}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--muted-2)', whiteSpace: 'nowrap' }}>
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Quick Actions & Tools</h3>
              <p>Jump straight into high-impact tasks for your team</p>
            </div>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              <Link
                href="/user/inbox"
                style={{
                  padding: 16,
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  display: 'grid',
                  gap: 8,
                }}
              >
                <span className="icon-tile tile-green" style={{ width: 38, height: 38 }}>
                  <Inbox size={18} />
                </span>
                <strong>Open Shared Inbox</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Respond to customers, leave internal notes, or assign chats.
                </span>
              </Link>

              <Link
                href="/user/campaigns/new"
                style={{
                  padding: 16,
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  display: 'grid',
                  gap: 8,
                }}
              >
                <span className="icon-tile tile-purple" style={{ width: 38, height: 38 }}>
                  <Megaphone size={18} />
                </span>
                <strong>Launch Broadcast</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Send approved WhatsApp templates with upfront ₹ cost estimates.
                </span>
              </Link>

              <Link
                href="/user/automation"
                style={{
                  padding: 16,
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  display: 'grid',
                  gap: 8,
                }}
              >
                <span className="icon-tile tile-blue" style={{ width: 38, height: 38 }}>
                  <Workflow size={18} />
                </span>
                <strong>Build Automation</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Auto-reply to keywords, tag leads, and schedule follow-up tasks.
                </span>
              </Link>

              <Link
                href="/user/ai"
                style={{
                  padding: 16,
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  display: 'grid',
                  gap: 8,
                }}
              >
                <span className="icon-tile tile-yellow" style={{ width: 38, height: 38 }}>
                  <Sparkles size={18} />
                </span>
                <strong>AI Copy & Replies</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Generate festive offers, summarize long chats, and draft replies.
                </span>
              </Link>
            </div>

            {salesSeries.length > 0 && (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                    Recorded Sales Total ({days}d)
                  </span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--green-deep)' }}>
                    {formatINR(totals.recordedSales || 0)}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
