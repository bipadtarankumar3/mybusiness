'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '@/lib/api';
import {
  buildDemoAnalyticsOverview,
  buildDemoConversationAnalytics,
  DEMO_CAMPAIGNS,
  formatINR,
} from '@/lib/DemoPreviewData';
import {
  BarChart3,
  IndianRupee,
  MessageSquare,
  Megaphone,
  Users,
  RefreshCw,
} from 'lucide-react';

const STATUS_COLORS = ['#16C784', '#FBBF24', '#60A5FA', '#8B5CF6', '#FB7185'];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState(() => buildDemoAnalyticsOverview(30));
  const [convStats, setConvStats] = useState(() => buildDemoConversationAnalytics(30));
  const [campaignAnalytics, setCampaignAnalytics] = useState({
    campaigns: DEMO_CAMPAIGNS,
    totals: { sent: 42, delivered: 40, read: 33, failed: 2 },
  });
  const [usageItems, setUsageItems] = useState([
    { metric: 'contacts', used: 148, limit: 10000, cost: '0.00' },
    { metric: 'messages', used: 640, limit: 10000, cost: '0.00' },
    { metric: 'campaign_messages', used: 42, limit: 5000, cost: '36.96' },
    { metric: 'ai_requests', used: 18, limit: 500, cost: '0.00' },
  ]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async (selectedDays) => {
    setLoading(true);
    try {
      const [ovRes, cvRes, cpRes, usRes] = await Promise.all([
        api.get('/analytics/overview', { days: selectedDays }),
        api.get('/analytics/conversations', { days: selectedDays }),
        api.get('/analytics/campaigns'),
        api.get('/billing/usage').catch(() => null),
      ]);

      const ov = ovRes?.data || ovRes;
      const cv = cvRes?.data || cvRes;
      const cp = cpRes?.data || cpRes;
      const us = usRes?.data || usRes;

      if (ov?.totals) setOverview(ov);
      else setOverview(buildDemoAnalyticsOverview(selectedDays));

      if (cv?.byStatus) setConvStats(cv);
      else setConvStats(buildDemoConversationAnalytics(selectedDays));

      if (cp?.campaigns) setCampaignAnalytics(cp);
      if (Array.isArray(us?.items)) setUsageItems(us.items);
    } catch {
      setOverview(buildDemoAnalyticsOverview(selectedDays));
      setConvStats(buildDemoConversationAnalytics(selectedDays));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll(days);
  }, [days, loadAll]);

  const totals = overview?.totals || {};
  const campaignChartData = (campaignAnalytics?.campaigns || DEMO_CAMPAIGNS).map((c) => ({
    name: c.name?.slice(0, 22) || `Campaign #${c.id}`,
    delivered: c.stats?.delivered ?? 0,
    read: c.stats?.read ?? 0,
    failed: c.stats?.failed ?? 0,
  }));

  return (
    <>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Analytics, Conversion & ROI</h1>
          <p>
            Track inbound enquiries, conversation resolution, lead funnel stages, broadcast delivery, and recorded sales
            revenue.
          </p>
        </div>

        <div className="page-header-actions">
          <div className="tabs-bar" role="group" aria-label="Analytics period selector">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                className={`tab-btn ${days === d ? 'active' : ''}`}
                onClick={() => setDays(d)}
              >
                Last {d} Days
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => loadAll(days)}
            disabled={loading}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">New Enquiries ({days}d)</span>
            <span className="icon-tile tile-green" style={{ width: 36, height: 36 }}>
              <MessageSquare size={18} />
            </span>
          </div>
          <div className="kpi-card-value">{Number(totals.newEnquiries || 0).toLocaleString('en-IN')}</div>
          <div className="kpi-card-sub">Inbound customer conversations</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Recorded Sales ({days}d)</span>
            <span className="icon-tile tile-purple" style={{ width: 36, height: 36 }}>
              <IndianRupee size={18} />
            </span>
          </div>
          <div className="kpi-card-value">{formatINR(totals.recordedSales || 0)}</div>
          <div className="kpi-card-sub">Direct revenue linked to contacts</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Total Contacts</span>
            <span className="icon-tile tile-blue" style={{ width: 36, height: 36 }}>
              <Users size={18} />
            </span>
          </div>
          <div className="kpi-card-value">{Number(totals.contacts || 0).toLocaleString('en-IN')}</div>
          <div className="kpi-card-sub">Active CRM records</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Broadcast Campaigns</span>
            <span className="icon-tile tile-yellow" style={{ width: 36, height: 36 }}>
              <Megaphone size={18} />
            </span>
          </div>
          <div className="kpi-card-value">{Number(totals.activeCampaigns || 0).toLocaleString('en-IN')}</div>
          <div className="kpi-card-sub">Template broadcasts tracked</div>
        </div>
      </section>

      {/* Row 1: Enquiries Over Time & Recorded Sales Over Time */}
      <div className="dash-grid-equal">
        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Enquiries Over Time ({days}d)</h3>
              <p>Daily customer enquiries captured across WhatsApp & web</p>
            </div>
          </div>
          <div className="panel-body">
            <div style={{ width: '100%', height: 270 }}>
              <ResponsiveContainer>
                <AreaChart data={overview.enquiriesSeries || []} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="enqAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16C784" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#16C784" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3ece7" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#5f6f6a' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#5f6f6a' }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Enquiries"
                    stroke="#087F5B"
                    strokeWidth={2.5}
                    fill="url(#enqAreaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Recorded Sales Revenue (₹)</h3>
              <p>Orders closed and logged against CRM customer profiles</p>
            </div>
          </div>
          <div className="panel-body">
            <div style={{ width: '100%', height: 270 }}>
              <ResponsiveContainer>
                <AreaChart data={overview.salesSeries || []} margin={{ top: 10, right: 12, left: -4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.36} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3ece7" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#5f6f6a' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#5f6f6a' }} />
                  <Tooltip formatter={(val) => formatINR(val)} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    name="Sales (INR)"
                    stroke="#6D28D9"
                    strokeWidth={2.5}
                    fill="url(#salesAreaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>

      {/* Row 2: Conversation Status Distribution & Lead Conversion Funnel */}
      <div className="dash-grid-equal">
        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Conversation Volume & Status Distribution</h3>
              <p>Inbound vs Outbound message activity and open/pending/resolved breakdown</p>
            </div>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              {(convStats.byStatus || []).map((st, idx) => (
                <span
                  key={st.status}
                  className="badge"
                  style={{
                    background: `${STATUS_COLORS[idx % STATUS_COLORS.length]}22`,
                    color: 'var(--text)',
                    padding: '6px 12px',
                  }}
                >
                  <strong style={{ textTransform: 'capitalize' }}>{st.status}:</strong> {st.count}
                </span>
              ))}
            </div>
            <div style={{ width: '100%', height: 230 }}>
              <ResponsiveContainer>
                <BarChart data={convStats.series || []} margin={{ top: 6, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3ece7" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#5f6f6a' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#5f6f6a' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="inbound" name="Inbound" fill="#60A5FA" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="outbound" name="Outbound" fill="#16C784" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Lead Conversion Funnel</h3>
              <p>Progression from New Lead → Contacted → Qualified → Paying Customer</p>
            </div>
          </div>
          <div className="panel-body">
            <div style={{ width: '100%', height: 270 }}>
              <ResponsiveContainer>
                <BarChart
                  data={overview.leadFunnel || []}
                  layout="vertical"
                  margin={{ top: 6, right: 18, left: 12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3ece7" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#5f6f6a' }} />
                  <YAxis
                    type="category"
                    dataKey="status"
                    width={84}
                    tick={{ fontSize: 12, fill: '#17211f', fontWeight: 700 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" name="Contacts" fill="#087F5B" radius={[0, 8, 8, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>

      {/* Row 3: Campaign Delivery Breakdown & Usage / Cost Transparency */}
      <div className="dash-grid-equal">
        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Campaign Delivery & Read Performance</h3>
              <p>Webhook-verified Delivered, Read, and Failed recipient counts</p>
            </div>
          </div>
          <div className="panel-body">
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={campaignChartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3ece7" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5f6f6a' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#5f6f6a' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="delivered" name="Delivered" fill="#16C784" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="read" name="Read" fill="#60A5FA" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="failed" name="Failed" fill="#FB7185" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Usage & Messaging Cost Summary</h3>
              <p>Current billing cycle resource consumption and estimated template charges</p>
            </div>
          </div>
          <div className="panel-body" style={{ display: 'grid', gap: 14 }}>
            {usageItems.map((item) => {
              const pct = Math.min(100, Math.round(((item.used || 0) / Math.max(1, item.limit || 100)) * 100));
              return (
                <div key={item.metric} style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                    <strong style={{ textTransform: 'capitalize' }}>
                      {item.metric.replace(/_/g, ' ')}
                    </strong>
                    <span>
                      <strong>{item.used}</strong> / {item.limit}
                      {Number(item.cost) > 0 ? ` • Est. ₹${Number(item.cost).toFixed(2)}` : ''}
                    </span>
                  </div>
                  <div className="usage-meter-track">
                    <div className="usage-meter-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
