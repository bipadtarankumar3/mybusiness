'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { currency, plans, priceFor, limitLabels } from '@/lib/pricing';
import { formatDateTime } from '@/components/dashboard/DemoPreviewData';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';

export default function BillingPage() {
  const { plan: authPlan } = useAuth();
  const [cycle, setCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [subscription, setSubscription] = useState({
    plan: { code: authPlan?.code || 'growth', name: authPlan?.name || 'Growth' },
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 24 * 86400 * 1000).toISOString(),
    billingCycle: 'monthly',
  });
  const [usage, setUsage] = useState({
    period: '2026-10',
    items: [
      { metric: 'contacts', used: 148, limit: 10000, cost: '0.00' },
      { metric: 'messages', used: 640, limit: 10000, cost: '0.00' },
      { metric: 'campaign_messages', used: 42, limit: 5000, cost: '36.96' },
      { metric: 'ai_requests', used: 18, limit: 500, cost: '0.00' },
    ],
  });

  useEffect(() => {
    Promise.all([
      api.get('/billing/subscription').catch(() => null),
      api.get('/billing/usage').catch(() => null),
    ]).then(([subRes, usgRes]) => {
      const sub = subRes?.data || subRes;
      const usg = usgRes?.data || usg;
      if (sub?.plan) setSubscription(sub);
      if (Array.isArray(usg?.items)) setUsage(usg);
    });
  }, []);

  const currentPlanCode = subscription?.plan?.code || authPlan?.code || 'free';

  return (
    <>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Billing, Plan & Usage</h1>
          <p>
            Transparent Indian Rupee (₹) pricing for small businesses. Track your monthly plan limits and conversation
            estimates.
          </p>
        </div>

        <div className="page-header-actions">
          <div className="tabs-bar" role="group" aria-label="Billing cycle toggle">
            <button
              type="button"
              className={`tab-btn ${cycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setCycle('monthly')}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              className={`tab-btn ${cycle === 'yearly' ? 'active' : ''}`}
              onClick={() => setCycle('yearly')}
            >
              Yearly (2 Months Free)
            </button>
          </div>
        </div>
      </div>

      {/* Current Subscription & Usage Meters */}
      <div className="dash-grid-2">
        <section className="panel-card">
          <div className="panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CreditCard size={18} color="var(--green-deep)" />
              <h3>Current Subscription</h3>
            </div>
            <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>
              {subscription.status || 'Active'}
            </span>
          </div>
          <div className="panel-body" style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Active Workspace Plan
                </span>
                <h2 style={{ fontSize: '1.85rem', marginTop: 4 }}>
                  {subscription.plan?.name || 'Growth'} Plan
                </h2>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>
                <Calendar size={14} style={{ display: 'inline', marginRight: 5 }} />
                Period renews: <strong>{formatDateTime(subscription.currentPeriodEnd)}</strong>
              </div>
            </div>

            <div className="alert alert-info" style={{ fontSize: '0.84rem' }}>
              <Info />
              <span>
                Online self-serve checkout via Razorpay/Stripe is not yet live — plan upgrades are currently activated
                with help from our onboarding team, and Meta WhatsApp conversation fees are billed transparently per
                message category.
              </span>
            </div>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Current Period Usage ({usage.period || 'Current Month'})</h3>
              <p>Real-time quota tracking across contacts, messages, campaigns, and AI</p>
            </div>
          </div>
          <div className="panel-body" style={{ display: 'grid', gap: 14 }}>
            {(usage.items || []).map((item) => {
              const limitNum = Number(item.limit) > 0 ? Number(item.limit) : 1000;
              const pct = Math.min(100, Math.round(((item.used || 0) / limitNum) * 100));
              return (
                <div key={item.metric} style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <strong style={{ textTransform: 'capitalize' }}>
                      {item.metric.replace(/_/g, ' ')}
                    </strong>
                    <span>
                      <strong>{item.used}</strong> / {item.limit === -1 ? 'Unlimited' : item.limit}
                      {Number(item.cost) > 0 ? ` (Est. ₹${Number(item.cost).toFixed(2)})` : ''}
                    </span>
                  </div>
                  <div className="usage-meter-track">
                    <div
                      className={`usage-meter-fill ${pct > 85 ? 'danger' : pct > 65 ? 'warn' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Plan Comparison Cards from lib/pricing.js */}
      <section className="panel-card">
        <div className="panel-head">
          <div>
            <h3>Compare ChatFlow Plans</h3>
            <p>All plans include isolated tenant security, WhatsApp opt-in protection, and honest cost estimates.</p>
          </div>
        </div>
        <div className="panel-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {plans.map((p) => {
              const price = priceFor(p, cycle);
              const isCurrent = p.code === currentPlanCode;

              return (
                <div
                  key={p.code}
                  style={{
                    padding: 20,
                    borderRadius: 'var(--r-lg)',
                    border: isCurrent
                      ? '2px solid var(--green)'
                      : p.recommended
                      ? '2px solid #8b5cf6'
                      : '1px solid var(--border)',
                    background: isCurrent ? 'var(--pale-green)' : '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{p.name}</h4>
                      {isCurrent ? (
                        <span className="badge badge-green">Current Plan</span>
                      ) : p.recommended ? (
                        <span className="badge badge-purple">
                          <Sparkles size={11} /> Popular
                        </span>
                      ) : null}
                    </div>

                    <div>
                      {price === null ? (
                        <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>Custom</div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                            {currency}
                            {price.toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            / {cycle === 'yearly' ? 'year' : 'month'}
                          </span>
                        </div>
                      )}
                      <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 4 }}>{p.blurb}</p>
                    </div>

                    <div
                      style={{
                        borderTop: '1px solid var(--border)',
                        paddingTop: 10,
                        display: 'grid',
                        gap: 6,
                        fontSize: '0.8rem',
                      }}
                    >
                      {Object.entries(p.limits || {}).map(([k, val]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--muted)' }}>{limitLabels[k] || k}:</span>
                          <strong>{val}</strong>
                        </div>
                      ))}
                    </div>

                    <ul style={{ display: 'grid', gap: 6, fontSize: '0.82rem', marginTop: 4 }}>
                      {(p.features || []).map((f) => (
                        <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <CheckCircle2 size={14} color="var(--green-deep)" style={{ flexShrink: 0, marginTop: 3 }} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isCurrent ? (
                    <button type="button" className="btn btn-outline btn-sm btn-block" disabled>
                      Active Plan
                    </button>
                  ) : (
                    <Link href={`/contact?topic=upgrade&plan=${p.code}`} className="btn btn-primary btn-sm btn-block">
                      {p.monthly === null ? 'Contact Sales' : `Request ${p.name} Upgrade`}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
