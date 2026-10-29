'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  DEMO_CAMPAIGNS,
  DEMO_TEMPLATES,
  formatDateTime,
} from '@/lib/DemoPreviewData';
import { CampaignStatusBadge } from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import {
  Megaphone,
  Plus,
  CheckCircle2,
  Clock,
  FileText,
  IndianRupee,
  Users,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [campaigns, setCampaigns] = useState(DEMO_CAMPAIGNS);
  const [templates, setTemplates] = useState(DEMO_TEMPLATES);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [campRes, tplRes] = await Promise.all([
        api.get('/campaigns', { status: statusFilter || undefined }),
        api.get('/templates'),
      ]);
      const campList = campRes?.data || campRes;
      const tplList = tplRes?.data || tplRes;
      if (Array.isArray(campList)) setCampaigns(campList);
      if (Array.isArray(tplList)) setTemplates(tplList);
    } catch {
      const filtered = DEMO_CAMPAIGNS.filter((c) => !statusFilter || c.status === statusFilter);
      setCampaigns(filtered);
      setTemplates(DEMO_TEMPLATES);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Broadcast Campaigns</h1>
          <p>
            Send approved WhatsApp template broadcasts to opted-in customer segments with transparent ₹ cost estimates.
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/user/ai" className="btn btn-outline btn-sm">
            <Sparkles size={15} /> AI Copy Generator
          </Link>
          <Link href="/user/campaigns/new" className="btn btn-primary btn-sm">
            <Plus size={16} /> Create Campaign
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="tabs-bar" role="tablist">
        {[
          { key: '', label: 'All Campaigns' },
          { key: 'draft', label: 'Drafts' },
          { key: 'scheduled', label: 'Scheduled' },
          { key: 'sending', label: 'Sending' },
          { key: 'completed', label: 'Completed' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tab-btn ${statusFilter === t.key ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Campaigns List */}
      <section className="panel-card">
        <div className="panel-head">
          <div>
            <h3>Campaign History & Drafts</h3>
            <p>Only opted-in contacts are eligible. Meta template charges are estimated before launch.</p>
          </div>
        </div>
        <div className="panel-body">
          {loading && campaigns.length === 0 ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="skeleton" style={{ height: 84 }} />
              <div className="skeleton" style={{ height: 84 }} />
            </div>
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No campaigns found"
              description="Create your first WhatsApp template broadcast with our guided pre-launch validator."
              action={
                <Link href="/user/campaigns/new" className="btn btn-primary btn-sm">
                  <Plus size={15} /> New Broadcast Campaign
                </Link>
              }
            />
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {campaigns.map((camp) => {
                const stats = camp.stats || {};
                return (
                  <div
                    key={camp.id}
                    style={{
                      padding: '18px 20px',
                      borderRadius: 'var(--r-lg)',
                      border: '1px solid var(--border)',
                      display: 'grid',
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'grid', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{camp.name}</h4>
                          <CampaignStatusBadge status={camp.status} />
                          {camp.template?.category && (
                            <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                              {camp.template.category}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                          Template: <code>{camp.template?.name || `Template #${camp.templateId}`}</code>
                          {camp.scheduledAt && ` • Scheduled: ${formatDateTime(camp.scheduledAt)}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.74rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
                            Estimated Cost
                          </div>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--green-deep)' }}>
                            ₹{Number(camp.estimatedCost || 0).toFixed(2)}
                          </strong>
                        </div>
                        <Link
                          href={`/user/campaigns/new?campaignId=${camp.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          {camp.status === 'draft' ? 'Validate & Launch' : 'Inspect'} <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>

                    {/* Delivery Stats */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                        gap: 10,
                        padding: '10px 14px',
                        borderRadius: 'var(--r-md)',
                        background: 'var(--surface-2)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--muted)' }}>Recipients:</span>{' '}
                        <strong>{camp.estimatedRecipients ?? stats.total ?? 0}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--muted)' }}>Accepted:</span>{' '}
                        <strong>{stats.accepted ?? 0}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--muted)' }}>Delivered:</span>{' '}
                        <strong style={{ color: 'var(--green-deep)' }}>{stats.delivered ?? 0}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--muted)' }}>Read:</span>{' '}
                        <strong style={{ color: '#0284c7' }}>{stats.read ?? 0}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--muted)' }}>Failed:</span>{' '}
                        <strong style={{ color: stats.failed ? 'var(--danger)' : 'inherit' }}>
                          {stats.failed ?? 0}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Approved Message Templates Library */}
      <section className="panel-card">
        <div className="panel-head">
          <div>
            <h3>WhatsApp Message Templates</h3>
            <p>Pre-approved templates synced for marketing offers, appointment reminders, and order updates.</p>
          </div>
        </div>
        <div className="panel-body">
          <div className="dash-grid-equal">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                style={{
                  padding: 16,
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  display: 'grid',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <FileText size={16} color="var(--green-deep)" />
                    <code style={{ fontWeight: 700, fontSize: '0.88rem' }}>{tpl.name}</code>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span
                      className={`badge ${
                        tpl.status === 'approved'
                          ? 'badge-green'
                          : tpl.status === 'pending'
                          ? 'badge-yellow'
                          : 'badge-coral'
                      }`}
                    >
                      {tpl.status}
                    </span>
                    {tpl.isDemo && <span className="badge badge-demo">Demo</span>}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-2)',
                    background: 'var(--surface-2)',
                    padding: '10px 12px',
                    borderRadius: 10,
                  }}
                >
                  {tpl.body}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--muted)' }}>
                  <span style={{ textTransform: 'capitalize' }}>Category: {tpl.category}</span>
                  <span>Language: {tpl.language || 'en_IN'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
