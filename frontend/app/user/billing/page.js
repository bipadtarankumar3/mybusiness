'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { currency, plans, priceFor, limitLabels } from '@/lib/pricing';
import { formatDateTime } from '@/lib/DemoPreviewData';
import Modal from '@/components/ui/Modal';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function BillingPage() {
  const { plan: authPlan, refreshAuth } = useAuth();
  const [cycle, setCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [subscription, setSubscription] = useState({
    plan: { code: authPlan?.code || 'growth', name: authPlan?.name || 'Growth' },
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 24 * 86400 * 1000).toISOString(),
    billingCycle: 'monthly',
  });
  const [usage, setUsage] = useState({
    period: '2026-10',
    items: [
      { metric: 'contacts', used: 148, limit: 10000, cost: '0.00' },
      { metric: 'messages', used: 640, limit: 10000, cost: '0.00' },
      { metric: 'campaign_messages', used: 42, limit: 5000, cost: '36.96' },
      { metric: 'ai_requests', used: 18, limit: 500, cost: '0.00' },
    ],
  });

  // Razorpay Checkout State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [payError, setPayError] = useState('');
  const [toast, setToast] = useState('');
  const [testMethod, setTestMethod] = useState('upi'); // upi | card | netbanking

  useEffect(() => {
    // Load Razorpay Checkout SDK script dynamically
    if (typeof window !== 'undefined' && !document.getElementById('razorpay-checkout-js')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }

    Promise.all([
      api.get('/billing/subscription').catch(() => null),
      api.get('/billing/usage').catch(() => null),
    ]).then(([subRes, usgRes]) => {
      const sub = subRes?.data || subRes;
      const usg = usgRes?.data || usg;
      if (sub?.plan) setSubscription(sub);
      if (Array.isArray(usg?.items)) setUsage(usg);
    });
  }, []);

  const currentPlanCode = subscription?.plan?.code || authPlan?.code || 'free';

  // Initiate direct Razorpay payment
  const handleInitiatePayment = async (plan) => {
    setPayError('');
    setActivePlan(plan);
    setProcessingPayment(true);

    try {
      const res = await api.post('/billing/create-order', {
        planCode: plan.code,
        billingCycle: cycle,
      });
      const data = res?.data || res;

      // If directly upgraded (free tier or zero price)
      if (data?.upgradedDirectly) {
        if (data.subscription) setSubscription(data.subscription);
        setToast(`Plan switched to ${plan.name}!`);
        await refreshAuth();
        setProcessingPayment(false);
        return;
      }

      setOrderData(data);

      // Check if real Razorpay script is loaded and Key ID is present
      const hasLiveRazorpay =
        typeof window !== 'undefined' &&
        window.Razorpay &&
        data?.keyId &&
        !data.keyId.includes('simulated') &&
        !data.keyId.includes('chatflow_gateway');

      if (hasLiveRazorpay) {
        try {
          const rzp = new window.Razorpay({
            key: data.keyId,
            amount: data.amount,
            currency: data.currency || 'INR',
            name: 'ChatFlow Platform',
            description: `${plan.name} (${cycle}) Upgrade`,
            order_id: data.orderId,
            prefill: {
              name: data.user?.name || '',
              email: data.user?.email || '',
            },
            theme: { color: '#00a884' },
            handler: async (response) => {
              await handleVerifyPayment({
                planCode: plan.code,
                billingCycle: cycle,
                razorpayOrderId: response.razorpay_order_id || data.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
            },
          });
          rzp.on('payment.failed', (resp) => {
            setPayError(resp.error?.description || 'Payment was declined or cancelled.');
          });
          rzp.open();
          setProcessingPayment(false);
          return;
        } catch {
          // Fall back to modal simulator
        }
      }

      // If simulated or test mode, open checkout modal
      setCheckoutModalOpen(true);
    } catch (err) {
      setPayError(err?.message || 'Could not initiate checkout order.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Complete & verify payment
  const handleVerifyPayment = async (verifyPayload) => {
    setProcessingPayment(true);
    setPayError('');
    try {
      const res = await api.post('/billing/verify-payment', verifyPayload);
      const data = res?.data || res;

      if (data?.subscription) {
        setSubscription(data.subscription);
      }
      setToast(data?.message || `Successfully upgraded to ${activePlan?.name || 'new plan'}!`);
      setCheckoutModalOpen(false);
      setOrderData(null);
      await refreshAuth();
    } catch (err) {
      setPayError(err?.message || 'Payment verification failed.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!orderData || !activePlan) return;
    const paymentId = `pay_sim_${Date.now()}`;
    await handleVerifyPayment({
      planCode: activePlan.code,
      billingCycle: cycle,
      razorpayOrderId: orderData.orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: 'simulated_signature_ok',
    });
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Billing, Plan & Razorpay Direct Checkout</h1>
          <p>
            Transparent Indian Rupee (₹) pricing for small businesses. Pay directly with Razorpay
            via UPI, Cards, or NetBanking, or have an admin upgrade you instantly.
          </p>
        </div>

        <div className="page-header-actions">
          <div className="tabs-bar" role="group" aria-label="Billing cycle toggle">
            <button
              type="button"
              className={`tab-btn ${cycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setCycle('monthly')}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              className={`tab-btn ${cycle === 'yearly' ? 'active' : ''}`}
              onClick={() => setCycle('yearly')}
            >
              Yearly (2 Months Free)
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="alert alert-success" role="status" style={{ marginBottom: 16 }}>
          <CheckCircle2 />
          <span>{toast}</span>
        </div>
      )}

      {/* Current Subscription & Usage Meters */}
      <div className="dash-grid-2">
        <section className="panel-card">
          <div className="panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CreditCard size={18} color="var(--green-deep)" />
              <h3>Current Subscription</h3>
            </div>
            <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>
              {subscription.status || 'Active'}
            </span>
          </div>
          <div className="panel-body" style={{ display: 'grid', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  Active Workspace Plan
                </span>
                <h2 style={{ fontSize: '1.85rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>{subscription.plan?.name || 'Growth'} Plan</span>
                  <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                    {subscription.billingCycle === 'yearly' ? 'Yearly Billing' : 'Monthly Billing'}
                  </span>
                </h2>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>
                <Calendar size={14} style={{ display: 'inline', marginRight: 5 }} />
                Period renews: <strong>{formatDateTime(subscription.currentPeriodEnd)}</strong>
              </div>
            </div>

            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--r-md)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: '#0c2340',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3395ff',
                    fontWeight: 900,
                  }}
                >
                  ₹
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem' }}>Direct Razorpay Payments Active</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    Pay in INR via UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, or NetBanking.
                  </div>
                </div>
              </div>

              <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <ShieldCheck size={13} /> Instant Activation
              </span>
            </div>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-head">
            <div>
              <h3>Current Period Usage ({usage.period || 'Current Month'})</h3>
              <p>Real-time quota tracking across contacts, messages, campaigns, and AI</p>
            </div>
          </div>
          <div className="panel-body" style={{ display: 'grid', gap: 14 }}>
            {(usage.items || []).map((item) => {
              const limitNum = Number(item.limit) > 0 ? Number(item.limit) : 1000;
              const pct = Math.min(100, Math.round(((item.used || 0) / limitNum) * 100));
              return (
                <div key={item.metric} style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <strong style={{ textTransform: 'capitalize' }}>
                      {item.metric.replace(/_/g, ' ')}
                    </strong>
                    <span>
                      <strong>{item.used}</strong> / {item.limit === -1 ? 'Unlimited' : item.limit}
                      {Number(item.cost) > 0 ? ` (Est. ₹${Number(item.cost).toFixed(2)})` : ''}
                    </span>
                  </div>
                  <div className="usage-meter-track">
                    <div
                      className={`usage-meter-fill ${pct > 85 ? 'danger' : pct > 65 ? 'warn' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Plan Comparison Cards with Direct Razorpay Upgrade */}
      <section className="panel-card" style={{ marginTop: 20 }}>
        <div className="panel-head">
          <div>
            <h3>Select a Plan & Pay Directly</h3>
            <p>
              Upgrades take effect immediately upon payment confirmation. Super Admins can also
              upgrade your workspace directly from the Admin Console.
            </p>
          </div>
        </div>
        <div className="panel-body">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {plans.map((p) => {
              const price = priceFor(p, cycle);
              const isCurrent = p.code === currentPlanCode;
              const isPendingThisPlan = processingPayment && activePlan?.code === p.code;

              return (
                <div
                  key={p.code}
                  style={{
                    padding: 20,
                    borderRadius: 'var(--r-lg)',
                    border: isCurrent
                      ? '2px solid var(--green)'
                      : p.recommended
                      ? '2px solid #8b5cf6'
                      : '1px solid var(--border)',
                    background: isCurrent ? 'var(--pale-green)' : '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                    boxShadow: p.recommended ? '0 4px 12px rgba(139, 92, 246, 0.12)' : 'none',
                  }}
                >
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{p.name}</h4>
                      {isCurrent ? (
                        <span className="badge badge-green">Current Plan</span>
                      ) : p.recommended ? (
                        <span className="badge badge-purple">
                          <Sparkles size={11} /> Popular
                        </span>
                      ) : null}
                    </div>

                    <div>
                      {price === null ? (
                        <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>Custom</div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                            {currency}
                            {price.toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            / {cycle === 'yearly' ? 'year' : 'month'}
                          </span>
                        </div>
                      )}
                      <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 4 }}>
                        {p.blurb}
                      </p>
                    </div>

                    <div
                      style={{
                        borderTop: '1px solid var(--border)',
                        paddingTop: 10,
                        display: 'grid',
                        gap: 6,
                        fontSize: '0.8rem',
                      }}
                    >
                      {Object.entries(p.limits || {}).map(([k, val]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--muted)' }}>{limitLabels[k] || k}:</span>
                          <strong>{val}</strong>
                        </div>
                      ))}
                    </div>

                    <ul style={{ display: 'grid', gap: 6, fontSize: '0.82rem', marginTop: 4 }}>
                      {(p.features || []).map((f) => (
                        <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <CheckCircle2
                            size={14}
                            color="var(--green-deep)"
                            style={{ flexShrink: 0, marginTop: 3 }}
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isCurrent ? (
                    <button type="button" className="btn btn-outline btn-sm btn-block" disabled>
                      ✓ Active Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`btn btn-sm btn-block ${
                        p.recommended ? 'btn-primary' : 'btn-dark'
                      }`}
                      onClick={() => handleInitiatePayment(p)}
                      disabled={processingPayment}
                      style={{
                        gap: 8,
                        fontWeight: 700,
                        boxShadow: p.recommended ? '0 2px 6px rgba(0, 168, 132, 0.3)' : 'none',
                      }}
                    >
                      {isPendingThisPlan ? (
                        <>
                          <span className="spinner" /> Preparing Checkout...
                        </>
                      ) : p.monthly === null ? (
                        'Contact Enterprise Sales'
                      ) : (
                        <>
                          <span>Pay with Razorpay</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Razorpay Interactive Checkout Modal */}
      <Modal
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="Razorpay Secure Checkout"
        subtitle={`Upgrading to ${activePlan?.name || 'Selected'} Plan (${
          cycle === 'yearly' ? 'Yearly' : 'Monthly'
        })`}
        size="md"
      >
        <div style={{ display: 'grid', gap: 16 }}>
          {payError && (
            <div className="alert alert-error" style={{ fontSize: '0.82rem' }}>
              <Info size={14} />
              <span>{payError}</span>
            </div>
          )}

          {/* Checkout Order Summary */}
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--r-md)',
              background: '#0c2340',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                Amount to Pay
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8' }}>
                ₹{((orderData?.amount || 0) / 100).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                Order #{orderData?.orderId || 'rzp_order'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-purple" style={{ background: '#334155', color: '#38bdf8' }}>
                Razorpay Checkout
              </span>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                Instant Activation
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="label" style={{ marginBottom: 8 }}>
              Select Payment Method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { id: 'upi', label: 'UPI (GPay / PhonePe)' },
                { id: 'card', label: 'Debit / Credit Card' },
                { id: 'netbanking', label: 'NetBanking' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`btn btn-sm ${testMethod === m.id ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTestMethod(m.id)}
                  style={{ fontSize: '0.78rem', padding: '8px 6px', textAlign: 'center' }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {testMethod === 'upi' && (
            <div
              style={{
                padding: 12,
                borderRadius: 'var(--r-md)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                display: 'grid',
                gap: 6,
                fontSize: '0.82rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>VPA / UPI ID:</span>
                <code>business@okaxis</code>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                Supports Google Pay, PhonePe, Paytm, BHIM, and all UPI apps.
              </div>
            </div>
          )}

          {testMethod === 'card' && (
            <div
              style={{
                padding: 12,
                borderRadius: 'var(--r-md)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                display: 'grid',
                gap: 6,
                fontSize: '0.82rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Card Number:</span>
                <code>4000 1234 5678 9010</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Expires:</span>
                <code>12/28</code>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                Visa, MasterCard, RuPay & American Express supported.
              </div>
            </div>
          )}

          {testMethod === 'netbanking' && (
            <div
              style={{
                padding: 12,
                borderRadius: 'var(--r-md)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                display: 'grid',
                gap: 6,
                fontSize: '0.82rem',
              }}
            >
              <div>Supported Banks: HDFC, ICICI, SBI, Axis, Kotak Mahindra.</div>
            </div>
          )}

          <div
            style={{
              padding: 10,
              borderRadius: 'var(--r-md)',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Lock size={14} color="#059669" />
            <span>
              256-bit encrypted via Razorpay Payment Gateway. Workspace quotas update immediately.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setCheckoutModalOpen(false)}
              disabled={processingPayment}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSimulatePaymentSuccess}
              disabled={processingPayment}
              style={{ gap: 8, fontWeight: 700 }}
            >
              <Zap size={14} />
              {processingPayment
                ? 'Verifying Payment...'
                : `Complete Payment (₹${((orderData?.amount || 0) / 100).toLocaleString('en-IN')})`}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
