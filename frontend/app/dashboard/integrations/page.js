'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Plug,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  MessageCircle,
  Camera,
  Globe,
  ShoppingBag,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';

const REQUIRED_WA_ENV_VARS = [
  {
    key: 'WHATSAPP_ACCESS_TOKEN',
    description: 'Permanent System User Access Token from Meta Business Suite',
  },
  {
    key: 'WHATSAPP_PHONE_NUMBER_ID',
    description: 'Phone Number ID from WhatsApp Cloud API -> API Setup',
  },
  {
    key: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
    description: 'WhatsApp Business Account (WABA) ID for template sync',
  },
  {
    key: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
    description: 'Custom string used to verify GET /api/v1/webhooks/whatsapp challenge',
  },
  {
    key: 'WHATSAPP_APP_SECRET',
    description: 'Meta App Secret used to verify X-Hub-Signature-256 HMAC-SHA256 on webhook payloads',
  },
];

const COMING_SOON_CHANNELS = [
  {
    name: 'Instagram Direct Messages',
    category: 'Social Messaging',
    description: 'Reply to Instagram story mentions, reel comments, and DMs from the same shared inbox.',
    icon: Camera,
    tile: 'tile-coral',
  },
  {
    name: 'Website WhatsApp Chat Widget',
    category: 'Lead Capture',
    description: 'Embed a floating WhatsApp greet button on your website with automatic UTM source tracking.',
    icon: Globe,
    tile: 'tile-blue',
  },
  {
    name: 'Shopify Store Sync',
    category: 'E-Commerce',
    description: 'Sync customer orders, abandoned carts, and COD verification prompts automatically.',
    icon: ShoppingBag,
    tile: 'tile-green',
  },
  {
    name: 'Razorpay Payment Links',
    category: 'Payments',
    description: 'Send instant UPI & card payment links inside WhatsApp threads and auto-record sales.',
    icon: CreditCard,
    tile: 'tile-purple',
  },
  {
    name: 'Google Sheets Lead Sync',
    category: 'Productivity',
    description: 'Two-way sync between Google Sheets rows and ChatFlow contacts & tags.',
    icon: FileSpreadsheet,
    tile: 'tile-yellow',
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([
    {
      provider: 'whatsapp_cloud',
      status: 'not_configured',
      source: 'env',
      details: { apiVersion: 'v21.0' },
    },
  ]);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  useEffect(() => {
    api
      .get('/integrations')
      .then((res) => {
        const list = res?.data || res;
        if (Array.isArray(list) && list.length) setIntegrations(list);
      })
      .catch(() => {});
  }, []);

  const waIntegration =
    integrations.find((i) => i.provider === 'whatsapp_cloud') || integrations[0];
  const isConfigured = waIntegration?.status === 'configured';

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/v1/webhooks/whatsapp`
      : 'https://your-domain.in/api/v1/webhooks/whatsapp';

  const handleCopyWebhook = () => {
    navigator.clipboard?.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 1800);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Integrations & Channels</h1>
          <p>
            Connect your official Meta WhatsApp Cloud API credentials for real-time messaging and verified webhook
            events.
          </p>
        </div>
      </div>

      {/* Primary Integration: Official WhatsApp Cloud API */}
      <section className="panel-card">
        <div className="panel-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="icon-tile tile-green">
              <MessageCircle size={24} />
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h3>Official Meta WhatsApp Cloud API</h3>
                {isConfigured ? (
                  <span className="badge badge-green">
                    <CheckCircle2 size={13} /> Configured & Live
                  </span>
                ) : (
                  <span className="badge badge-demo">
                    <AlertTriangle size={13} /> Not Configured (Running in Safe Demo Mode)
                  </span>
                )}
              </div>
              <p>
                Direct Graph API integration ({waIntegration?.details?.apiVersion || 'v21.0'}) with HMAC-SHA256 webhook
                verification and idempotent event deduplication.
              </p>
            </div>
          </div>
        </div>

        <div className="panel-body" style={{ display: 'grid', gap: 20 }}>
          {!isConfigured && (
            <div className="alert alert-warning">
              <AlertTriangle />
              <div>
                <strong>Honest Demo Mode Behaviour</strong>
                <p style={{ marginTop: 4, fontSize: '0.86rem' }}>
                  While WhatsApp Cloud API is not configured, outbound messages in Shared Inbox are stored with status{' '}
                  <code>simulated</code>, and Campaign Launch returns <code>409 NOT_CONFIGURED</code> so you never see
                  fake &ldquo;delivered&rdquo; statuses.
                </p>
              </div>
            </div>
          )}

          {/* Webhook URL Box */}
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--r-lg)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'grid',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <strong style={{ fontSize: '0.9rem' }}>
                <ShieldCheck size={16} style={{ display: 'inline', marginRight: 6, color: 'var(--green-deep)' }} />
                Webhook Callback URL (Configure in Meta App Dashboard → WhatsApp → Configuration)
              </strong>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleCopyWebhook}>
                {copiedWebhook ? <Check size={14} /> : <Copy size={14} />}
                {copiedWebhook ? 'Copied URL' : 'Copy Webhook URL'}
              </button>
            </div>
            <code
              style={{
                padding: '10px 14px',
                background: '#fff',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border-strong)',
                fontSize: '0.86rem',
                wordBreak: 'break-all',
              }}
            >
              {webhookUrl}
            </code>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              Supports <code>GET</code> verification challenge (`hub.mode`, `hub.verify_token`, `hub.challenge`) and{' '}
              <code>POST</code> status & inbound message events verified via <code>X-Hub-Signature-256</code>.
            </span>
          </div>

          {/* Environment Variables Checklist */}
          <div>
            <h4 style={{ fontSize: '0.92rem', marginBottom: 10 }}>
              Required Backend Environment Variables (<code>backend/.env</code>)
            </h4>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Variable Name</th>
                    <th>Purpose</th>
                    <th>Security</th>
                  </tr>
                </thead>
                <tbody>
                  {REQUIRED_WA_ENV_VARS.map((envVar) => (
                    <tr key={envVar.key}>
                      <td>
                        <code style={{ fontWeight: 700, color: 'var(--green-900)' }}>{envVar.key}</code>
                      </td>
                      <td style={{ fontSize: '0.86rem', color: 'var(--text-2)' }}>{envVar.description}</td>
                      <td>
                        <span className="badge">Server-only (never exposed to browser)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-channel Integrations (Clearly Labelled Coming Soon) */}
      <section className="panel-card">
        <div className="panel-head">
          <div>
            <h3>Multi-Channel & Ecosystem Connectors</h3>
            <p>Upcoming native integrations on the ChatFlow roadmap</p>
          </div>
          <span className="badge badge-yellow">
            <Clock size={12} /> Roadmap — Coming Soon
          </span>
        </div>
        <div className="panel-body">
          <div className="dash-grid-3">
            {COMING_SOON_CHANNELS.map((ch) => {
              const Icon = ch.icon;
              return (
                <div
                  key={ch.name}
                  style={{
                    padding: 18,
                    borderRadius: 'var(--r-lg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`icon-tile ${ch.tile}`} style={{ width: 42, height: 42 }}>
                        <Icon size={20} />
                      </span>
                      <span className="badge badge-yellow">Coming Soon</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 700 }}>
                        {ch.category}
                      </span>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 800, marginTop: 2 }}>{ch.name}</h4>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>{ch.description}</p>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm" disabled>
                    Coming Soon
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
