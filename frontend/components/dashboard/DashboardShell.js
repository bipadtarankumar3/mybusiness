'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/brand/Logo';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Inbox,
  Users,
  BellRing,
  Megaphone,
  Workflow,
  Sparkles,
  BarChart3,
  UserCheck,
  Plug,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  FlaskConical,
  Plus,
  ExternalLink,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
      { label: 'Shared Inbox', href: '/dashboard/inbox', icon: Inbox, badge: 'Live' },
      { label: 'Contacts & CRM', href: '/dashboard/contacts', icon: Users },
      { label: 'Follow-ups', href: '/dashboard/follow-ups', icon: BellRing },
    ],
  },
  {
    label: 'Growth & Automation',
    items: [
      { label: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
      { label: 'Automation', href: '/dashboard/automation', icon: Workflow },
      { label: 'AI Assistant', href: '/dashboard/ai', icon: Sparkles },
      { label: 'Analytics & ROI', href: '/dashboard/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Team Members', href: '/dashboard/team', icon: UserCheck },
      { label: 'Integrations', href: '/dashboard/integrations', icon: Plug },
      { label: 'Billing & Usage', href: '/dashboard/billing', icon: CreditCard },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const { user, business, role, plan, isDemo, isOfflineDemo, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isFlushInbox = pathname === '/dashboard/inbox';

  const initials = (user?.name || 'CF')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <div className="dash-shell">
      {/* Sidebar */}
      <aside className={`dash-sidebar ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Dashboard navigation">
        <div>
          <div className="dash-sidebar-brand">
            <Logo href="/dashboard" light size={32} />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: '#fff', display: mobileOpen ? 'inline-flex' : 'none', padding: 6 }}
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="dash-tenant-pill">
            <div className="dash-tenant-info">
              <div className="dash-tenant-name">{business?.name || 'My Business'}</div>
              <div className="dash-tenant-meta">
                <span>{plan?.name || 'Free'} Plan</span>
                <span>•</span>
                <span style={{ textTransform: 'capitalize' }}>{role || 'owner'}</span>
              </div>
            </div>
            {isDemo && (
              <span className="badge badge-demo" style={{ fontSize: '0.66rem', padding: '2px 7px' }}>
                Demo
              </span>
            )}
          </div>

          <nav className="dash-nav-groups">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="dash-nav-group-label">{group.label}</div>
                <div className="dash-nav-list">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`dash-nav-item ${active ? 'active' : ''}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <span className="dash-nav-item-left">
                          <Icon />
                          <span>{item.label}</span>
                        </span>
                        {item.badge && <span className="dash-nav-badge">{item.badge}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="dash-sidebar-footer">
          <div className="dash-user-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span className="dash-avatar">{initials}</span>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.name || 'Demo Owner'}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'rgba(255,255,255,0.58)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.email || 'demo@chatflow.local'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#fff',
                padding: 8,
                borderRadius: 8,
                display: 'inline-flex',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dash-main-wrap">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <button
              type="button"
              className="dash-mobile-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem' }}>{business?.name || 'ChatFlow Workspace'}</span>
              {business?.industry && <span className="badge">{business.industry}</span>}
            </div>
          </div>

          <div className="dash-topbar-right">
            <Link href="/dashboard/contacts?new=1" className="btn btn-outline btn-sm">
              <Plus size={15} /> Add Contact
            </Link>
            <Link href="/dashboard/campaigns/new" className="btn btn-primary btn-sm">
              <Megaphone size={15} /> New Campaign
            </Link>
            <Link href="/" className="btn btn-ghost btn-sm" title="View Public Site">
              <ExternalLink size={15} />
            </Link>
          </div>
        </header>

        {isDemo && (
          <div className="dash-Demo-banner" role="status">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FlaskConical size={16} />
              <span>
                <strong>{isOfflineDemo ? 'Interactive Demo Preview Mode:' : 'Demo Workspace Active:'}</strong>{' '}
                {isOfflineDemo
                  ? 'Exploring pre-loaded sample data for Ananya Ethnic Studio. Connect backend API & WhatsApp Cloud credentials for live messaging.'
                  : 'Sample conversations and templates are marked as Demo. Outbound messages are simulated until WhatsApp Cloud API is configured.'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link
                href="/dashboard/integrations"
                style={{ fontWeight: 700, textDecoration: 'underline', color: '#087f5b' }}
              >
                Configure WhatsApp API →
              </Link>
            </div>
          </div>
        )}

        <main id="main" className={`dash-content ${isFlushInbox ? 'flush' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
