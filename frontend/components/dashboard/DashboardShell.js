'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  ShieldAlert,
  Crown,
  Layers,
  BadgeIndianRupee,
  ArrowLeftRight,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, tone: 'tone-green', exact: true },
      { label: 'Shared Inbox', href: '/dashboard/inbox', icon: Inbox, tone: 'tone-blue', badge: 'Live' },
      { label: 'Contacts & CRM', href: '/dashboard/contacts', icon: Users, tone: 'tone-purple' },
      { label: 'Follow-ups', href: '/dashboard/follow-ups', icon: BellRing, tone: 'tone-yellow' },
    ],
  },
  {
    label: 'Growth & Automation',
    items: [
      { label: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone, tone: 'tone-coral' },
      { label: 'Automation', href: '/dashboard/automation', icon: Workflow, tone: 'tone-purple' },
      { label: 'AI Assistant', href: '/dashboard/ai', icon: Sparkles, tone: 'tone-yellow' },
      { label: 'Analytics & ROI', href: '/dashboard/analytics', icon: BarChart3, tone: 'tone-green' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Team Members', href: '/dashboard/team', icon: UserCheck, tone: 'tone-blue' },
      { label: 'Integrations', href: '/dashboard/integrations', icon: Plug, tone: 'tone-green' },
      { label: 'Billing & Usage', href: '/dashboard/billing', icon: CreditCard, tone: 'tone-purple' },
      { label: 'Settings', href: '/dashboard/settings', icon: Settings, tone: 'tone-yellow' },
    ],
  },
];

const SUPER_ADMIN_GROUP = {
  label: 'Super Admin Console',
  items: [
    {
      label: 'Users & Workspaces',
      href: '/dashboard/admin',
      icon: Crown,
      tone: 'tone-yellow',
      badge: 'Pro Admin',
      exact: true,
    },
    {
      label: 'Plans & Subscriptions',
      href: '/dashboard/admin?tab=plans',
      icon: Layers,
      tone: 'tone-purple',
    },
    {
      label: 'All Subscriptions',
      href: '/dashboard/admin?tab=subscriptions',
      icon: BadgeIndianRupee,
      tone: 'tone-green',
    },
  ],
};

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    impersonatedBy,
    isSuperAdmin,
    business,
    role,
    plan,
    isDemo,
    isOfflineDemo,
    logout,
    stopImpersonating,
  } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isFlushInbox = pathname === '/dashboard/inbox';

  const initials = (user?.name || 'CF')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isActive = (item) => {
    const cleanHref = item.href.split('?')[0];
    if (item.exact) return pathname === cleanHref;
    return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
  };

  const groupsToRender = isSuperAdmin ? [SUPER_ADMIN_GROUP, ...NAV_GROUPS] : NAV_GROUPS;

  const handleReturnToAdmin = async () => {
    await stopImpersonating();
    router.push('/dashboard/admin');
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
            {isSuperAdmin ? (
              <span
                className="badge badge-purple"
                style={{ fontSize: '0.65rem', padding: '2px 7px', background: '#4c1d95', color: '#ede9fe' }}
              >
                Admin
              </span>
            ) : isDemo ? (
              <span className="badge badge-demo" style={{ fontSize: '0.66rem', padding: '2px 7px' }}>
                Demo
              </span>
            ) : null}
          </div>

          <nav className="dash-nav-groups">
            {groupsToRender.map((group) => (
              <div key={group.label}>
                <div className="dash-nav-group-label">{group.label}</div>
                <div className="dash-nav-list">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item);
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`dash-nav-item ${active ? 'active' : ''}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <span className="dash-nav-item-left">
                          <span className={`dash-nav-icon-box ${item.tone || 'tone-green'}`}>
                            <Icon size={17} strokeWidth={2.2} />
                          </span>
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
        {/* Super Admin Impersonation Bar when visiting another user's dashboard */}
        {impersonatedBy && (
          <div className="dash-impersonation-bar" role="region" aria-label="Super Admin Workspace Impersonation">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldAlert size={18} style={{ color: '#fde047', flexShrink: 0 }} />
              <span>
                <strong>Super Admin Visitor Mode:</strong> Viewing{' '}
                <strong style={{ color: '#fde047' }}>{business?.name}</strong> dashboard as{' '}
                <strong>{user?.name}</strong> ({user?.email}).
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                className="btn btn-white btn-sm"
                onClick={handleReturnToAdmin}
                style={{ minHeight: 32, padding: '0 14px', fontSize: '0.8rem' }}
              >
                <ArrowLeftRight size={14} /> Exit Visitor Mode &amp; Return to Admin Console
              </button>
            </div>
          </div>
        )}

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
              <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                {business?.name || 'ChatFlow Workspace'}
              </span>
              {business?.industry && <span className="badge">{business.industry}</span>}
              {isSuperAdmin && (
                <Link
                  href="/dashboard/admin"
                  className="badge badge-purple"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
                >
                  <Crown size={12} /> Super Admin Console
                </Link>
              )}
            </div>
          </div>

          <div className="dash-topbar-right">
            {isSuperAdmin && pathname !== '/dashboard/admin' && (
              <Link href="/dashboard/admin" className="btn btn-dark btn-sm">
                <Crown size={15} /> Admin Panel
              </Link>
            )}
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
