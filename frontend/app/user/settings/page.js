'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_SESSION } from '@/lib/DemoPreviewData';
import {
  Settings,
  Building2,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

const DEFAULT_HOURS = DEMO_SESSION.business.businessHours;

export default function SettingsPage() {
  const { user, business, role, updateBusinessState } = useAuth();

  const [form, setForm] = useState({
    name: business?.name || 'Ananya Ethnic Studio',
    industry: business?.industry || 'Retail & Boutique',
    timezone: business?.timezone || 'Asia/Kolkata',
    phone: business?.phone || '+91 98201 44500',
    website: business?.website || 'https://ananyastudio.in',
  });

  const [hours, setHours] = useState(() => ({
    ...DEFAULT_HOURS,
    ...(business?.businessHours || {}),
  }));

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    api
      .get('/businesses/current')
      .then((res) => {
        const b = res?.data || res;
        if (b?.name) {
          setForm({
            name: b.name || '',
            industry: b.industry || 'Retail & Boutique',
            timezone: b.timezone || 'Asia/Kolkata',
            phone: b.phone || '',
            website: b.website || '',
          });
          if (b.businessHours && typeof b.businessHours === 'object') {
            setHours((prev) => ({ ...prev, ...b.businessHours }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const payload = {
      ...form,
      businessHours: hours,
    };
    try {
      const res = await api.patch('/businesses/current', payload);
      const updated = res?.data || res;
      updateBusinessState({ ...payload, ...updated });
      setFeedback({ type: 'success', message: 'Business profile and operating hours updated!' });
    } catch (err) {
      if (err?.status === 403) {
        setFeedback({ type: 'error', message: 'Only workspace owners and admins can update business settings.' });
      } else {
        updateBusinessState(payload);
        setFeedback({ type: 'success', message: 'Business settings saved in demo workspace!' });
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleDayOpen = (dayKey) => {
    setHours((prev) => ({
      ...prev,
      [dayKey]: {
        ...(prev[dayKey] || { start: '10:00', end: '20:00' }),
        open: !prev[dayKey]?.open,
      },
    }));
  };

  const updateDayTime = (dayKey, field, val) => {
    setHours((prev) => ({
      ...prev,
      [dayKey]: {
        ...(prev[dayKey] || { open: true }),
        [field]: val,
      },
    }));
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Workspace & Business Settings</h1>
          <p>
            Configure your business profile, IST operating hours for automation conditions, and account details.
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`} role="status">
          {feedback.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} style={{ display: 'grid', gap: 20 }}>
        <div className="dash-grid-2">
          {/* Business Profile Card */}
          <section className="panel-card">
            <div className="panel-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={17} color="var(--green-deep)" />
                <h3>Business Profile</h3>
              </div>
            </div>
            <div className="panel-body" style={{ display: 'grid', gap: 14 }}>
              <div className="field">
                <label className="label" htmlFor="set-name">
                  Business / Shop Name *
                </label>
                <input
                  id="set-name"
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="dash-grid-equal" style={{ gap: 12 }}>
                <div className="field">
                  <label className="label" htmlFor="set-industry">
                    Industry Category
                  </label>
                  <select
                    id="set-industry"
                    className="select"
                    value={form.industry}
                    onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
                  >
                    <option value="Retail & Boutique">Retail & Local Shop</option>
                    <option value="Coaching & Education">Coaching Centre & Education</option>
                    <option value="Salon & Wellness">Beauty Salon & Clinic</option>
                    <option value="Restaurant & Cloud Kitchen">Restaurant & Cafe</option>
                    <option value="Real Estate & Property">Real Estate Agency</option>
                    <option value="Other SMB">Other Small Business</option>
                  </select>
                </div>

                <div className="field">
                  <label className="label" htmlFor="set-tz">
                    Timezone
                  </label>
                  <select
                    id="set-tz"
                    className="select"
                    value={form.timezone}
                    onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+05:30)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST, UTC+04:00)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <div className="dash-grid-equal" style={{ gap: 12 }}>
                <div className="field">
                  <label className="label" htmlFor="set-phone">
                    Business Contact Phone
                  </label>
                  <input
                    id="set-phone"
                    type="tel"
                    className="input"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>

                <div className="field">
                  <label className="label" htmlFor="set-web">
                    Website / Catalogue URL
                  </label>
                  <input
                    id="set-web"
                    type="url"
                    className="input"
                    value={form.website}
                    onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Signed-in Account Info Card */}
          <section className="panel-card">
            <div className="panel-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={17} color="var(--purple)" />
                <h3>Your Account & Session</h3>
              </div>
            </div>
            <div className="panel-body" style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
              <div className="field">
                <span className="label">Signed-in User Name</span>
                <input type="text" className="input" value={user?.name || 'Aarav Mehta'} disabled />
              </div>
              <div className="field">
                <span className="label">Email Address</span>
                <input type="email" className="input" value={user?.email || 'demo@chatflow.local'} disabled />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
                <span style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>Workspace Role:</span>
                <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>
                  {role || 'Owner'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Tenant Isolation: Every API request is scoped server-side to your authenticated{' '}
                <code>BusinessMember</code> context via an <code>httpOnly</code> session cookie.
              </div>
            </div>
          </section>
        </div>

        {/* Business Hours Editor */}
        <section className="panel-card">
          <div className="panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={17} color="var(--green-deep)" />
              <div>
                <h3>Weekly Business Hours</h3>
                <p>Used by the &ldquo;During Business Hours&rdquo; condition in Smart Automation workflows.</p>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
          <div className="panel-body" style={{ display: 'grid', gap: 10 }}>
            {DAYS_OF_WEEK.map((d) => {
              const dayCfg = hours[d.key] || { open: true, start: '10:00', end: '20:00' };
              return (
                <div
                  key={d.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    background: dayCfg.open ? '#fff' : 'var(--surface-2)',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 150, fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={Boolean(dayCfg.open)}
                      onChange={() => toggleDayOpen(d.key)}
                      style={{ width: 17, height: 17 }}
                    />
                    {d.label}
                  </label>

                  {dayCfg.open ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="time"
                        className="input"
                        style={{ width: 135, minHeight: 36, padding: '4px 10px' }}
                        value={dayCfg.start || '10:00'}
                        onChange={(e) => updateDayTime(d.key, 'start', e.target.value)}
                      />
                      <span style={{ color: 'var(--muted)' }}>to</span>
                      <input
                        type="time"
                        className="input"
                        style={{ width: 135, minHeight: 36, padding: '4px 10px' }}
                        value={dayCfg.end || '20:00'}
                        onChange={(e) => updateDayTime(d.key, 'end', e.target.value)}
                      />
                    </div>
                  ) : (
                    <span className="badge">Closed / Away Auto-Reply Active</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </form>
    </>
  );
}
