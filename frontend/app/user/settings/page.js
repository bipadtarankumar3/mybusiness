'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_SESSION } from '@/lib/DemoPreviewData';
import {
  Building2,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Save,
  CreditCard,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
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

  // Razorpay Gateway State
  const [razorpay, setRazorpay] = useState({
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    isTestMode: true,
    accountName: 'Razorpay Business Gateway',
    configured: false,
    hasSecret: false,
    status: 'not_configured',
  });
  const [showSecret, setShowSecret] = useState(false);
  const [savingRazorpay, setSavingRazorpay] = useState(false);
  const [razorpayFeedback, setRazorpayFeedback] = useState(null);

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

    api
      .get('/settings/payment-gateway')
      .then((res) => {
        const d = res?.data || res;
        if (d) {
          setRazorpay((p) => ({
            ...p,
            keyId: d.keyId || '',
            isTestMode: d.isTestMode !== undefined ? d.isTestMode : true,
            accountName: d.accountName || 'Razorpay Business Gateway',
            configured: Boolean(d.configured),
            hasSecret: Boolean(d.hasSecret),
            status: d.status || 'not_configured',
          }));
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
        setFeedback({
          type: 'error',
          message: 'Only workspace owners and admins can update business settings.',
        });
      } else {
        updateBusinessState(payload);
        setFeedback({ type: 'success', message: 'Business settings saved in demo workspace!' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRazorpay = async (e) => {
    e.preventDefault();
    if (!razorpay.keyId.trim()) {
      setRazorpayFeedback({ type: 'error', message: 'Razorpay Key ID is required.' });
      return;
    }
    setSavingRazorpay(true);
    setRazorpayFeedback(null);
    try {
      const res = await api.post('/settings/payment-gateway', {
        keyId: razorpay.keyId.trim(),
        keySecret: razorpay.keySecret.trim() || undefined,
        webhookSecret: razorpay.webhookSecret.trim() || undefined,
        isTestMode: razorpay.isTestMode,
        accountName: razorpay.accountName.trim() || undefined,
      });
      const data = res?.data || res;
      setRazorpay((p) => ({
        ...p,
        configured: true,
        hasSecret: true,
        status: 'configured',
        keySecret: '', // Clear secret from form memory after encrypted store
      }));
      setRazorpayFeedback({
        type: 'success',
        message: 'Razorpay API credentials encrypted with AES-256-GCM and saved successfully!',
      });
    } catch (err) {
      setRazorpayFeedback({
        type: 'error',
        message: err?.message || 'Could not save Razorpay details.',
      });
    } finally {
      setSavingRazorpay(false);
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
            Configure your business profile, Razorpay payment gateway credentials, IST operating
            hours, and account details.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`}
          role="status"
        >
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
                <input
                  type="email"
                  className="input"
                  value={user?.email || 'demo@chatflow.local'}
                  disabled
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 6,
                }}
              >
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
              <Save size={15} /> {saving ? 'Saving...' : 'Save Profile & Hours'}
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
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      minWidth: 150,
                      fontWeight: 700,
                    }}
                  >
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

      {/* Razorpay Payment Gateway Configuration Card */}
      <section className="panel-card" style={{ marginTop: 20 }}>
        <div className="panel-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: '#0c2340',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3395ff',
                fontWeight: 900,
                fontSize: '1rem',
              }}
            >
              ₹
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0 }}>Razorpay Payment Gateway Details</h3>
                {razorpay.configured ? (
                  <span className="badge badge-green">
                    <CheckCircle2 size={12} /> Configured
                  </span>
                ) : (
                  <span className="badge">Not Configured</span>
                )}
                {razorpay.isTestMode ? (
                  <span className="badge badge-purple">Test Mode Active</span>
                ) : (
                  <span className="badge badge-green">Live Production</span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--muted)' }}>
                Add your Razorpay Key ID and Key Secret to collect subscription payments and customer
                checkout directly in INR.
              </p>
            </div>
          </div>

          <a
            href="https://dashboard.razorpay.com/app/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>Razorpay Dashboard</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {razorpayFeedback && (
          <div
            className={`alert ${
              razorpayFeedback.type === 'success' ? 'alert-success' : 'alert-error'
            }`}
            role="status"
            style={{ margin: '14px 20px 0 20px' }}
          >
            {razorpayFeedback.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
            <span>{razorpayFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveRazorpay} className="panel-body" style={{ display: 'grid', gap: 16 }}>
          <div className="dash-grid-equal" style={{ gap: 16 }}>
            <div className="field">
              <label className="label" htmlFor="rzp-key-id">
                Razorpay Key ID *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="rzp-key-id"
                  type="text"
                  className="input"
                  placeholder="rzp_test_... or rzp_live_..."
                  value={razorpay.keyId}
                  onChange={(e) => setRazorpay((p) => ({ ...p, keyId: e.target.value }))}
                  required
                />
              </div>
              <span className="field-hint">
                Found in Razorpay Dashboard → Settings → API Keys.
              </span>
            </div>

            <div className="field">
              <label className="label" htmlFor="rzp-key-secret">
                Razorpay Key Secret {razorpay.hasSecret ? '(Leave blank to keep existing)' : '*'}
              </label>
              <div className="password-input-wrap">
                <input
                  id="rzp-key-secret"
                  type={showSecret ? 'text' : 'password'}
                  className="input"
                  placeholder={razorpay.hasSecret ? '••••••••••••••••' : 'Enter Razorpay Key Secret'}
                  value={razorpay.keySecret}
                  onChange={(e) => setRazorpay((p) => ({ ...p, keySecret: e.target.value }))}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowSecret((v) => !v)}
                  aria-label={showSecret ? 'Hide key secret' : 'Show key secret'}
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span className="field-hint">
                Stored with AES-256-GCM encryption on the server. Never shared publicly.
              </span>
            </div>
          </div>

          <div className="dash-grid-equal" style={{ gap: 16 }}>
            <div className="field">
              <label className="label" htmlFor="rzp-webhook-secret">
                Webhook Secret (Optional)
              </label>
              <input
                id="rzp-webhook-secret"
                type="password"
                className="input"
                placeholder="Webhook secret for payment verification"
                value={razorpay.webhookSecret}
                onChange={(e) => setRazorpay((p) => ({ ...p, webhookSecret: e.target.value }))}
              />
              <span className="field-hint">
                Used to verify server-side webhook signatures for automated subscription renewals.
              </span>
            </div>

            <div className="field">
              <label className="label" htmlFor="rzp-account-name">
                Gateway Display Label
              </label>
              <input
                id="rzp-account-name"
                type="text"
                className="input"
                placeholder="e.g. Ananya Studio Razorpay"
                value={razorpay.accountName}
                onChange={(e) => setRazorpay((p) => ({ ...p, accountName: e.target.value }))}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Lock size={16} color="var(--green-deep)" />
              <div>
                <strong style={{ fontSize: '0.88rem' }}>Environment Mode</strong>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>
                  Toggle between Razorpay Test Mode (simulate transactions) and Live Production mode.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                <input
                  type="radio"
                  name="rzpMode"
                  checked={razorpay.isTestMode === true}
                  onChange={() => setRazorpay((p) => ({ ...p, isTestMode: true }))}
                />
                <span>Test Mode (rzp_test)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                <input
                  type="radio"
                  name="rzpMode"
                  checked={razorpay.isTestMode === false}
                  onChange={() => setRazorpay((p) => ({ ...p, isTestMode: false }))}
                />
                <span>Live Mode (rzp_live)</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={savingRazorpay}
              style={{ gap: 8 }}
            >
              <ShieldCheck size={16} />
              {savingRazorpay ? 'Saving Credentials...' : 'Save Razorpay Details'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
