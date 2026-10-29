'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DEMO_TEAM } from '@/lib/DemoPreviewData';
import {
  UserCheck,
  Shield,
  Mail,
  UserPlus,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const ROLE_BADGE = {
  owner: { label: 'Owner', cls: 'badge-green' },
  admin: { label: 'Admin', cls: 'badge-purple' },
  agent: { label: 'Support Agent', cls: 'badge-blue' },
};

export default function TeamPage() {
  const [members, setMembers] = useState(DEMO_TEAM);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [inviteNotice, setInviteNotice] = useState(false);

  useEffect(() => {
    api
      .get('/team/members')
      .then((res) => {
        const list = res?.data || res;
        if (Array.isArray(list) && list.length) setMembers(list);
      })
      .catch(() => {
        setMembers(DEMO_TEAM);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Team Members & Access Roles</h1>
          <p>
            Collaborate in your shared WhatsApp inbox, assign customer conversations, and manage role-based permissions.
          </p>
        </div>
      </div>

      <div className="dash-grid-2">
        {/* Active Members Table */}
        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Workspace Members ({members.length})</h3>
              <p>Members can be assigned conversations and follow-up tasks.</p>
            </div>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const roleInfo = ROLE_BADGE[m.role] || { label: m.role, cls: '' };
                    const initials = (m.name || 'TM')
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr key={m.id || m.userId}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span className="dash-avatar" style={{ width: 34, height: 34, fontSize: '0.78rem' }}>
                              {initials}
                            </span>
                            <div>
                              <strong style={{ display: 'block' }}>{m.name}</strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{m.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${roleInfo.cls}`}>{roleInfo.label}</span>
                        </td>
                        <td>
                          <span className="badge badge-green">
                            <CheckCircle2 size={12} /> {m.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Clearly Labelled "Coming Soon" Email Invite Control + Role Matrix */}
        <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
          <section className="panel-card">
            <div className="panel-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={17} color="var(--green-deep)" />
                <h3>Invite Team Member</h3>
              </div>
              <span className="badge badge-yellow">
                <Clock size={12} /> Coming Soon
              </span>
            </div>
            <div className="panel-body" style={{ display: 'grid', gap: 14 }}>
              <p style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>
                Self-serve email invitation links and seat management are <strong>coming soon</strong>. During early
                access, additional agent accounts can be provisioned via our onboarding team or seeded directly.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setInviteNotice(true);
                }}
                style={{ display: 'grid', gap: 12 }}
              >
                <div className="field">
                  <label className="label" htmlFor="inv-email">
                    Teammate Email Address
                  </label>
                  <input
                    id="inv-email"
                    type="email"
                    className="input"
                    placeholder="colleague@yourbusiness.in"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label" htmlFor="inv-role">
                    Role
                  </label>
                  <select
                    id="inv-role"
                    className="select"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="agent">Support Agent (Inbox, Contacts, Follow-ups)</option>
                    <option value="admin">Admin (Campaigns, Workflows, Settings)</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-outline btn-sm">
                  <Mail size={15} /> Send Email Invite (Coming Soon)
                </button>
              </form>

              {inviteNotice && (
                <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>
                  <span>
                    Email invitations are <strong>Coming Soon</strong>. For now, use the pre-seeded team members (
                    <code>neha@chatflow.local</code>, <code>amit@chatflow.local</code>) to test conversation assignment!
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="panel-card">
            <div className="panel-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={17} color="var(--purple)" />
                <h3>Role Permissions Matrix</h3>
              </div>
            </div>
            <div className="panel-body" style={{ display: 'grid', gap: 10, fontSize: '0.85rem' }}>
              <div>
                <strong>Owner:</strong> Full access to Billing, Business Settings, Integrations, Campaigns, Workflows,
                and CRM.
              </div>
              <div>
                <strong>Admin:</strong> Can manage Contacts, Tags, Campaigns, Automation Workflows, and Business Hours.
              </div>
              <div>
                <strong>Support Agent:</strong> Can reply in Shared Inbox, add Internal Notes, manage Follow-ups, and
                update Customer stages.
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
