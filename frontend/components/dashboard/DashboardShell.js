'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  Eye,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

/**
 * USER WORKSPACE MENU — Shown to regular business users (and when Super Admin visits a user's workspace)
 */
const USER_NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, tone: 'tone-green', exact: true },
      { label: 'Shared Inbox', href: '/dashboard/inbox', icon: Inbox, tone: 'tone-blue' },
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

/**
 * SUPER ADMIN MENU — Clean, dedicated sidebar navigation shown exclusively in the Super Admin Console
 */
const ADMIN_NAV_GROUPS = [
  {
    label: 'Platform Management',
    items: [
      {
        label: 'Platform Overview',
        href: '/dashboard/admin?tab=overview',
        tabKey: 'overview',
        icon: LayoutDashboard,
        tone: 'tone-green',
      },
      {
        label: 'Users & Workspaces',
        href: '/dashboard/admin?tab=users',
        tabKey: 'users',
        icon: Users,
        tone: 'tone-blue',
      },
      {
        label: 'Visit User Dashboard',
        href: '/dashboard/admin?tab=visit',
        tabKey: 'visit',
        icon: Eye,
        tone: 'tone-purple',
      },
    ],
  },
  {
    label: 'Plans & Billing',
    items: [
      {
        label: 'Subscription Plans',
        href: '/dashboard/admin?tab=plans',
        tabKey: 'plans',
        icon: Layers,
        tone: 'tone-purple',
      },
      {
        label: 'All Subscriptions',
        href: '/dashboard/admin?tab=subscriptions',
        tabKey: 'subscriptions',
        icon: BadgeIndianRupee,
        tone: 'tone-green',
      },
    ],
  },
  {
    label: 'Governance',
    items: [
      {
        label: 'User Access & Settings',
        href: '/dashboard/admin?tab=settings',
        tabKey: 'settings',
        icon: Sliders,
        tone: 'tone-yellow',
      },
    ],
  },
];

function SidebarNavGroups({ isAdminMenuMode, pathname, onCloseMobile }) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'users';

  const groupsToRender = isAdminMenuMode ? ADMIN_NAV_GROUPS : USER_NAV_GROUPS;

  const isActive = (item) => {
    if (isAdminMenuMode && item.tabKey) {
      return pathname.startsWith('/dashboard/admin') && currentTab === item.tabKey;
    }
    const cleanHref = item.href.split('?')[0];
    if (item.exact) return pathname === cleanHref;
    return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
  };

  return (
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
                  onClick={onCloseMobile}
                >
                  <span className="dash-nav-item-left">
                    <span className={`dash-nav-icon-box ${item.tone || 'tone-green'}`}>
                      <Icon size={16} strokeWidth={2.1} />
                    </span>
                    <span>{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

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
  const isAdminMenuMode = pathname.startsWith('/dashboard/admin');

  const initials = (user?.name || 'CF')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleReturnToAdmin = async () => {
    await stopImpersonating();
    router.push('/dashboard/admin?tab=users');
  };

  return (
    <div className="dash-shell">
      {/* Sidebar */}
      <aside className={`dash-sidebar ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Dashboard navigation">
        <div>
          <div className="dash-sidebar-brand">
            <Logo href={isAdminMenuMode ? '/dashboard/admin' : '/dashboard'} light size={30} />
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

          {isAdminMenuMode ? (
            <div
              className="dash-tenant-pill"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(22, 199, 132, 0.1))',
                borderColor: 'rgba(167, 139, 250, 0.28)',
              }}
            >
              <div className="dash-tenant-info">
                <div className="dash-tenant-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Crown size={14} style={{ color: '#fde047', flexShrink: 0 }} />
                  <span>Super Admin Console</span>
                </div>
                <div className="dash-tenant-meta">Platform Control Center</div>
              </div>
            </div>
          ) : (
            <div className="dash-tenant-pill">
              <div className="dash-tenant-info">
                <div className="dash-tenant-name">{business?.name || 'My Business'}</div>
                <div className="dash-tenant-meta">
                  <span>{plan?.name || 'Free'} Plan</span>
                  <span>•</span>
                  <span style={{ textTransform: 'capitalize' }}>{role || 'owner'}</span>
                </div>
              </div>
            </div>
          )}

          {/* If Super Admin is currently visiting a User Workspace, show quick button back to Admin Menu */}
          {!isAdminMenuMode && (isSuperAdmin || impersonatedBy) && (
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={handleReturnToAdmin}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(167, 139, 250, 0.4)',
                  background: 'rgba(109, 40, 217, 0.28)',
                  color: '#f5f3ff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Crown size={14} style={{ color: '#fde047' }} /> Return to Admin Menu
              </button>
            </div>
          )}

          <Suspense fallback={<div style={{ height: 320 }} />}>
            <SidebarNavGroups
              isAdminMenuMode={isAdminMenuMode}
              pathname={pathname}
              onCloseMobile={() => setMobileOpen(false)}
            />
          </Suspense>
        </div>

        <div className="dash-sidebar-footer">
          <div className="dash-user-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span className="dash-avatar">{initials}</span>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.name || (isAdminMenuMode ? 'Platform Admin' : 'Demo Owner')}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'rgba(255,255,255,0.56)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.email || (isAdminMenuMode ? 'admin@chatflow.local' : 'demo@chatflow.local')}
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
                flexShrink: 0,
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dash-main-wrap">
        {/* Super Admin Impersonation Bar when visiting another user's dashboard */}
        {impersonatedBy && !isAdminMenuMode && (
          <div className="dash-impersonation-bar" role="region" aria-label="Super Admin Workspace Impersonation">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldAlert size={18} style={{ color: '#fde047', flexShrink: 0 }} />
              <span>
                <strong>Super Admin Visitor Mode:</strong> Viewing{' '}
                <strong style={{ color: '#fde047' }}>{business?.name}</strong> User Dashboard as{' '}
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

            {isAdminMenuMode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <ShieldCheck size={18} style={{ color: '#7c3aed' }} /> ChatFlow Super Admin Portal
                </span>
                <span className="badge badge-purple">Global Platform Admin</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                  {business?.name || 'ChatFlow Workspace'}
                </span>
                {business?.industry && <span className="badge">{business.industry}</span>}
              </div>
            )}
          </div>

          <div className="dash-topbar-right">
            {isAdminMenuMode ? (
              <>
                <Link href="/dashboard/admin?tab=users" className="btn btn-outline btn-sm">
                  <Users size={15} /> Users List
                </Link>
                <Link href="/dashboard/admin?tab=plans" className="btn btn-primary btn-sm">
                  <Layers size={15} /> Manage Plans
                </Link>
                <Link href="/" className="btn btn-ghost btn-sm" title="View Public Site">
                  <ExternalLink size={15} />
                </Link>
              </>
            ) : (
              <>
                {(isSuperAdmin || impersonatedBy) && (
                  <button type="button" className="btn btn-dark btn-sm" onClick={handleReturnToAdmin}>
                    <Crown size={15} /> Super Admin Console
                  </button>
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
              </>
            )}
          </div>
        </header>

        {!isAdminMenuMode && isDemo && (
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
