'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  DEMO_CONTACTS,
  DEMO_FOLLOW_UPS,
  DEMO_SALES,
  DEMO_CONVERSATIONS,
  formatDateTime,
  formatINR,
} from '@/lib/DemoPreviewData';
import { LeadStatusBadge, ConversationStatusBadge } from '@/components/ui/StatusBadge';
import {
  ArrowLeft,
  Phone,
  Mail,
  BellRing,
  IndianRupee,
  MessageSquare,
  CheckCircle2,
  Plus,
} from 'lucide-react';

export default function ContactDetailPage({ params }) {
  const resolvedParams = use(params);
  const contactId = Number(resolvedParams?.id);

  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  // Quick forms
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpDue, setFollowUpDue] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [saleNote, setSaleNote] = useState('');

  const buildFallbackContact = useCallback((id) => {
    const base = DEMO_CONTACTS.find((c) => Number(c.id) === Number(id)) || DEMO_CONTACTS[0];
    return {
      ...base,
      followUps: DEMO_FOLLOW_UPS.filter((f) => Number(f.customerId) === Number(base.id)),
      sales: DEMO_SALES.filter((s) => Number(s.customerId) === Number(base.id)),
      conversations: DEMO_CONVERSATIONS.filter((c) => Number(c.customer?.id) === Number(base.id)),
    };
  }, []);

  const loadContact = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/contacts/${contactId}`);
      const data = res?.data || res;
      if (data?.id) {
        setContact(data);
      } else {
        setContact(buildFallbackContact(contactId));
      }
    } catch {
      setContact(buildFallbackContact(contactId));
    } finally {
      setLoading(false);
    }
  }, [contactId, buildFallbackContact]);

  useEffect(() => {
    loadContact();
  }, [loadContact]);

  const handleStatusChange = async (newStatus) => {
    if (!contact) return;
    try {
      await api.patch(`/contacts/${contact.id}`, { leadStatus: newStatus });
      setContact((prev) => ({ ...prev, leadStatus: newStatus }));
      setFeedback('Lead status updated');
    } catch {
      setContact((prev) => ({ ...prev, leadStatus: newStatus }));
      setFeedback('Lead status updated in demo workspace');
    }
  };

  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!contact || !followUpTitle.trim() || !followUpDue) return;
    try {
      const res = await api.post('/follow-ups', {
        customerId: contact.id,
        title: followUpTitle.trim(),
        dueAt: new Date(followUpDue).toISOString(),
      });
      const created = res?.data || res;
      setContact((prev) => ({
        ...prev,
        followUps: [created, ...(prev.followUps || [])],
      }));
      setFollowUpTitle('');
      setFollowUpDue('');
      setFeedback('Follow-up reminder added');
    } catch {
      const fallbackItem = {
        id: Date.now(),
        customerId: contact.id,
        title: followUpTitle.trim(),
        dueAt: new Date(followUpDue).toISOString(),
        status: 'pending',
      };
      setContact((prev) => ({
        ...prev,
        followUps: [fallbackItem, ...(prev.followUps || [])],
      }));
      setFollowUpTitle('');
      setFollowUpDue('');
      setFeedback('Follow-up added to demo workspace');
    }
  };

  const handleCompleteFollowUp = async (fId) => {
    try {
      await api.patch(`/follow-ups/${fId}`, { status: 'completed' });
    } catch {
      // ignore in demo mode
    }
    setContact((prev) => ({
      ...prev,
      followUps: (prev.followUps || []).map((f) =>
        f.id === fId ? { ...f, status: 'completed', completedAt: new Date().toISOString() } : f
      ),
    }));
  };

  const handleRecordSale = async (e) => {
    e.preventDefault();
    if (!contact || !saleAmount) return;
    try {
      const res = await api.post('/sales', {
        customerId: contact.id,
        amount: Number(saleAmount),
        note: saleNote.trim() || undefined,
      });
      const created = res?.data || res;
      setContact((prev) => ({
        ...prev,
        sales: [created, ...(prev.sales || [])],
      }));
      setSaleAmount('');
      setSaleNote('');
      setFeedback('Sale recorded and linked to customer ROI!');
    } catch {
      const created = {
        id: Date.now(),
        customerId: contact.id,
        amount: String(Number(saleAmount).toFixed(2)),
        note: saleNote.trim() || 'Store order',
        recordedAt: new Date().toISOString(),
      };
      setContact((prev) => ({
        ...prev,
        sales: [created, ...(prev.sales || [])],
      }));
      setSaleAmount('');
      setSaleNote('');
      setFeedback('Sale recorded in demo workspace!');
    }
  };

  if (loading && !contact) {
    return <div className="skeleton" style={{ height: 420 }} />;
  }

  if (!contact) {
    return (
      <div className="panel-card" style={{ padding: 32 }}>
        <p>Customer not found.</p>
        <Link href="/user/contacts" className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>
          ← Back to Contacts
        </Link>
      </div>
    );
  }

  const totalSalesAmount = (contact.sales || []).reduce((acc, s) => acc + Number(s.amount || 0), 0);

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/user/contacts" className="btn btn-outline btn-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="page-header-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1>{contact.name}</h1>
              <LeadStatusBadge status={contact.leadStatus} />
              <span className={`badge ${contact.whatsappOptIn ? 'badge-green' : 'badge-coral'}`}>
                {contact.whatsappOptIn ? 'WhatsApp Opt-In Active' : 'Opted Out'}
              </span>
            </div>
            <p style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Phone size={14} /> {contact.phone}
              </span>
              {contact.email && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Mail size={14} /> {contact.email}
                </span>
              )}
              <span>Lifetime Value: <strong>{formatINR(totalSalesAmount)}</strong></span>
            </p>
          </div>
        </div>

        <div className="page-header-actions">
          <select
            className="filter-select"
            value={contact.leadStatus || 'new'}
            onChange={(e) => handleStatusChange(e.target.value)}
            aria-label="Update lead status"
          >
            <option value="new">Stage: New Lead</option>
            <option value="contacted">Stage: Contacted</option>
            <option value="qualified">Stage: Qualified</option>
            <option value="customer">Stage: Customer</option>
            <option value="lost">Stage: Lost</option>
          </select>
          <Link href="/user/inbox" className="btn btn-primary btn-sm">
            <MessageSquare size={15} /> Open in Shared Inbox
          </Link>
        </div>
      </div>

      {feedback && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Customer Notes & Tags */}
      <div className="dash-grid-3">
        <section className="panel-card">
          <div className="panel-head">
            <h3>Customer Summary & Notes</h3>
          </div>
          <div className="panel-body" style={{ display: 'grid', gap: 14 }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Tags
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {(contact.tags || []).length === 0 ? (
                  <span style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>No tags assigned</span>
                ) : (
                  contact.tags.map((t) => (
                    <span key={t.id || t.name} className="badge badge-green">
                      {t.name}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                CRM Notes
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', marginTop: 6 }}>
                {contact.notes || 'No notes recorded yet.'}
              </p>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <div>Created: {formatDateTime(contact.createdAt)}</div>
              <div>Last Contacted: {formatDateTime(contact.lastContactedAt)}</div>
            </div>
          </div>
        </section>

        {/* Follow-up Reminders */}
        <section className="panel-card">
          <div className="panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BellRing size={17} color="var(--green-deep)" />
              <h3>Follow-up Reminders</h3>
            </div>
          </div>
          <div className="panel-body" style={{ display: 'grid', gap: 14 }}>
            <form onSubmit={handleAddFollowUp} style={{ display: 'grid', gap: 8 }}>
              <input
                type="text"
                className="input"
                style={{ minHeight: 38, fontSize: '0.85rem' }}
                placeholder="Reminder task (e.g. Share bridal lookbook)"
                value={followUpTitle}
                onChange={(e) => setFollowUpTitle(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="datetime-local"
                  className="input"
                  style={{ minHeight: 38, fontSize: '0.82rem' }}
                  value={followUpDue}
                  onChange={(e) => setFollowUpDue(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Plus size={15} /> Add
                </button>
              </div>
            </form>

            <div style={{ display: 'grid', gap: 8 }}>
              {(contact.followUps || []).length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>No follow-ups scheduled.</p>
              ) : (
                (contact.followUps || []).map((f) => (
                  <div
                    key={f.id}
                    style={{
                      padding: 10,
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.86rem',
                          textDecoration: f.status === 'completed' ? 'line-through' : 'none',
                        }}
                      >
                        {f.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        Due: {formatDateTime(f.dueAt)}
                      </div>
                    </div>
                    {f.status !== 'completed' ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ minHeight: 30, padding: '0 10px', fontSize: '0.75rem' }}
                        onClick={() => handleCompleteFollowUp(f.id)}
                      >
                        Done
                      </button>
                    ) : (
                      <span className="badge badge-green">Completed</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Recorded Sales */}
        <section className="panel-card">
          <div className="panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IndianRupee size={17} color="var(--green-deep)" />
              <h3>Recorded Sales ({formatINR(totalSalesAmount)})</h3>
            </div>
          </div>
          <div className="panel-body" style={{ display: 'grid', gap: 14 }}>
            <form onSubmit={handleRecordSale} style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="input"
                  style={{ minHeight: 38, fontSize: '0.85rem' }}
                  placeholder="Amount in ₹ (e.g. 4500)"
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Plus size={15} /> Record
                </button>
              </div>
              <input
                type="text"
                className="input"
                style={{ minHeight: 36, fontSize: '0.82rem' }}
                placeholder="Order note / invoice # (optional)"
                value={saleNote}
                onChange={(e) => setSaleNote(e.target.value)}
              />
            </form>

            <div style={{ display: 'grid', gap: 8 }}>
              {(contact.sales || []).length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>No sales recorded yet.</p>
              ) : (
                (contact.sales || []).map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: 10,
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--green-deep)' }}>{formatINR(s.amount)}</strong>
                      {s.note && <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{s.note}</div>}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {formatDateTime(s.recordedAt || s.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Conversation History */}
      <section className="panel-card">
        <div className="panel-head">
          <h3>WhatsApp Conversation History</h3>
          <Link href="/user/inbox" className="btn btn-outline btn-sm">
            Open Inbox →
          </Link>
        </div>
        <div className="panel-body">
          {(contact.conversations || []).length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>No conversations linked to this contact yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {contact.conversations.map((conv) => (
                <div
                  key={conv.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ConversationStatusBadge status={conv.status} />
                    <span style={{ fontWeight: 600 }}>Conversation #{conv.id}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                      Last message: {formatDateTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <Link href="/user/inbox" className="btn btn-ghost btn-sm">
                    View Thread →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
