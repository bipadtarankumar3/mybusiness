'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/brand/Logo';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  Eye,
  Layers,
  BadgeIndianRupee,
  Sliders,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Crown,
  ShieldCheck,
} from 'lucide-react';

/**
 * SUPER ADMIN SIDEBAR MENU — Dedicated navigation for `/admin/*` routes
 */
const ADMIN_NAV_GROUPS = [
  {
    label: 'Platform Management',
    items: [
      {
        label: 'Admin Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        tone: 'tone-green',
      },
      {
        label: 'Users & Workspaces',
        href: '/admin/users',
        icon: Users,
        tone: 'tone-blue',
      },
      {
        label: 'Visit User Dashboard',
        href: '/admin/visit',
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
        href: '/admin/plans',
        icon: Layers,
        tone: 'tone-purple',
      },
      {
        label: 'All Subscriptions',
        href: '/admin/subscriptions',
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
        href: '/admin/settings',
        icon: Sliders,
        tone: 'tone-yellow',
      },
    ],
  },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (user?.name || 'SA')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isActive = (item) => {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <div className="dash-shell">
      {/* Super Admin Sidebar */}
      <aside className={`dash-sidebar ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Super Admin navigation">
        <div>
          <div className="dash-sidebar-brand">
            <Logo href="/admin/dashboard" light size={30} />
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

          <nav className="dash-nav-groups">
            {ADMIN_NAV_GROUPS.map((group) => (
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
                  {user?.name || 'Platform Admin'}
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
                  {user?.email || 'admin@chatflow.local'}
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
          </div>

          <div className="dash-topbar-right">
            <Link href="/admin/users" className="btn btn-outline btn-sm">
              <Users size={15} /> Users Directory
            </Link>
            <Link href="/admin/plans" className="btn btn-primary btn-sm">
              <Layers size={15} /> Subscription Plans
            </Link>
            <Link href="/" className="btn btn-ghost btn-sm" title="View Public Site">
              <ExternalLink size={15} />
            </Link>
          </div>
        </header>

        <main id="main" className="dash-content">
          {children}
        </main>
      </div>
    </div>
  );
}

