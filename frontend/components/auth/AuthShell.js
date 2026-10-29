'use client';

import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import { CheckCircle2, ShieldCheck, Sparkles, MessageSquareHeart } from 'lucide-react';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <aside className="auth-showcase" aria-label="ChatFlow platform highlights">
        <div className="auth-showcase-top">
          <Logo href="/" light size={38} />
          <span className="badge badge-green" style={{ background: 'rgba(22,199,132,0.18)', color: '#5ef2b8' }}>
            <Sparkles size={13} /> Built for Indian SMBs
          </span>
        </div>

        <div className="auth-showcase-body">
          <div>
            <h1>Turn every WhatsApp enquiry into a loyal customer.</h1>
            <p style={{ marginTop: 12 }}>
              One shared inbox, smart follow-up reminders, approved broadcast campaigns, and visual workflow automation —
              priced transparently in ₹.
            </p>
          </div>

          <div className="auth-preview-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#5ef2b8', fontWeight: 700 }}>
                <MessageSquareHeart size={15} /> Live Shared Inbox Preview
              </span>
              <span style={{ color: 'rgba(255,255,255,0.65)' }}>Priya Sharma · VIP Lead</span>
            </div>
            <div className="auth-preview-msg">
              Namaste! Do you have the pastel Banarasi silk collection ready for bridal trials this Friday?
            </div>
            <div className="auth-preview-reply">
              Namaste Priya ji! Yes, we have reserved the Friday 4 PM slot for you. Sharing the catalogue PDF now ✨
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} color="#3fd9a0" /> Auto-tagged: Bridal Trial
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} color="#3fd9a0" /> Reminder set: Thu 6 PM
              </span>
            </div>
          </div>

          <div className="auth-trust-list">
            <div className="auth-trust-item">
              <strong>₹0 / mo</strong>
              <span>Free forever starter tier</span>
            </div>
            <div className="auth-trust-item">
              <strong>3 mins</strong>
              <span>Setup with demo workspace</span>
            </div>
            <div className="auth-trust-item">
              <strong>100% Opt-in</strong>
              <span>Official Cloud API ready</span>
            </div>
          </div>
        </div>

        <div className="auth-showcase-footer">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={15} color="#3fd9a0" /> Tenant-isolated data & httpOnly session security
          </span>
          <div>
            <Link href="/pricing" style={{ marginRight: 14 }}>
              Pricing
            </Link>
            <Link href="/features">Features</Link>
          </div>
        </div>
      </aside>

      <main id="main" className="auth-main">
        <div className="auth-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Logo href="/" size={32} />
            <Link href="/" className="btn btn-ghost btn-sm">
              ← Back to site
            </Link>
          </div>

          <div className="auth-header">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>

          {children}

          {footer && <div className="auth-footer-links">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
