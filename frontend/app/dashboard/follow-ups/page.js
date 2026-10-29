'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  DEMO_FOLLOW_UPS,
  DEMO_CONTACTS,
  formatDateTime,
} from '@/components/dashboard/DemoPreviewData';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import {
  BellRing,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  Trash2,
  AlertTriangle,
  Phone,
} from 'lucide-react';

const TABS = [
  { key: 'overdue', label: 'Overdue', badgeCls: 'badge-coral' },
  { key: 'today', label: 'Due Today', badgeCls: 'badge-yellow' },
  { key: 'upcoming', label: 'Upcoming', badgeCls: 'badge-blue' },
  { key: 'completed', label: 'Completed', badgeCls: 'badge-green' },
];

export default function FollowUpsPage() {
  const [activeTab, setActiveTab] = useState('overdue');
  const [items, setItems] = useState(DEMO_FOLLOW_UPS);
  const [contacts, setContacts] = useState(DEMO_CONTACTS);
  const [loading, setLoading] = useState(true);

  // Create / Reschedule Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [customerId, setCustomerId] = useState(DEMO_CONTACTS[0]?.id || 1);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get('/contacts', { limit: 100 })
      .then((res) => {
        const list = res?.data || res;
        if (Array.isArray(list) && list.length) {
          setContacts(list);
          setCustomerId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const filterDemoByTab = useCallback((allItems, tab) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 86400 * 1000);

    return allItems.filter((item) => {
      if (tab === 'completed') return item.status === 'completed';
      if (item.status === 'completed' || item.status === 'cancelled') return false;
      const d = new Date(item.dueAt);
      if (tab === 'overdue') return d < now;
      if (tab === 'today') return d >= startOfToday && d <= endOfToday;
      if (tab === 'upcoming') return d > endOfToday;
      return true;
    });
  }, []);

  const loadFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const params =
        activeTab === 'completed'
          ? { status: 'completed', limit: 50 }
          : { status: 'pending', due: activeTab, limit: 50 };
      const res = await api.get('/follow-ups', params);
      const list = res?.data || res;
      if (Array.isArray(list)) {
        setItems(list);
      }
    } catch {
      setItems(DEMO_FOLLOW_UPS);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadFollowUps();
  }, [loadFollowUps]);

  const displayedItems = items.some((i) => i.id >= 200 && i.id <= 210)
    ? filterDemoByTab(items, activeTab)
    : items;

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setNotes('');
    const tomorrow = new Date(Date.now() + 4 * 3600 * 1000);
    setDueAt(tomorrow.toISOString().slice(0, 16));
    setModalOpen(true);
  };

  const openRescheduleModal = (item) => {
    setEditingItem(item);
    setCustomerId(item.customerId || item.customer?.id || 1);
    setTitle(item.title || '');
    setNotes(item.notes || '');
    setDueAt(item.dueAt ? new Date(item.dueAt).toISOString().slice(0, 16) : '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueAt) return;
    setSaving(true);
    try {
      if (editingItem) {
        const res = await api.patch(`/follow-ups/${editingItem.id}`, {
          title: title.trim(),
          notes: notes.trim() || null,
          dueAt: new Date(dueAt).toISOString(),
        });
        const updated = res?.data || res;
        setItems((prev) => prev.map((f) => (f.id === editingItem.id ? { ...f, ...updated } : f)));
      } else {
        const res = await api.post('/follow-ups', {
          customerId: Number(customerId),
          title: title.trim(),
          notes: notes.trim() || undefined,
          dueAt: new Date(dueAt).toISOString(),
        });
        const created = res?.data || res;
        setItems((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      loadFollowUps();
    } catch {
      const cust = contacts.find((c) => Number(c.id) === Number(customerId)) || DEMO_CONTACTS[0];
      if (editingItem) {
        setItems((prev) =>
          prev.map((f) =>
            f.id === editingItem.id
              ? { ...f, title: title.trim(), notes: notes.trim(), dueAt: new Date(dueAt).toISOString() }
              : f
          )
        );
      } else {
        setItems((prev) => [
          {
            id: Date.now(),
            customerId: cust.id,
            customer: { id: cust.id, name: cust.name, phone: cust.phone },
            title: title.trim(),
            notes: notes.trim(),
            dueAt: new Date(dueAt).toISOString(),
            status: 'pending',
          },
          ...prev,
        ]);
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCompleted = async (item) => {
    try {
      await api.patch(`/follow-ups/${item.id}`, { status: 'completed' });
    } catch {
      // fallback in demo mode
    }
    setItems((prev) =>
      prev.map((f) =>
        f.id === item.id ? { ...f, status: 'completed', completedAt: new Date().toISOString() } : f
      )
    );
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.del(`/follow-ups/${deleteTarget.id}`);
    } catch {
      // fallback
    }
    setItems((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Follow-up Reminders</h1>
          <p>
            Never lose a warm WhatsApp enquiry — track overdue callbacks, today’s tasks, and upcoming reminders.
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
            <Plus size={16} /> Schedule Follow-up
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="tabs-bar" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={activeTab === t.key}
              className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <section className="panel-card">
        <div className="panel-body">
          {loading && displayedItems.length === 0 ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="skeleton" style={{ height: 76 }} />
              <div className="skeleton" style={{ height: 76 }} />
            </div>
          ) : displayedItems.length === 0 ? (
            <EmptyState
              icon={BellRing}
              title={`No ${activeTab} follow-ups`}
              description="You’re all caught up here! Schedule a new reminder to stay on top of customer enquiries."
              action={
                <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
                  <Plus size={15} /> Create Follow-up
                </button>
              }
            />
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {displayedItems.map((item) => {
                const isOverdue =
                  item.status !== 'completed' && new Date(item.dueAt).getTime() < Date.now();
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '16px 18px',
                      borderRadius: 'var(--r-lg)',
                      border: `1px solid ${isOverdue ? '#fecdd3' : 'var(--border)'}`,
                      background: isOverdue ? '#fff9fa' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 14,
                    }}
                  >
                    <div style={{ display: 'grid', gap: 6, flex: 1, minWidth: 260 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {isOverdue && (
                          <span className="badge badge-coral">
                            <AlertTriangle size={12} /> Overdue
                          </span>
                        )}
                        {item.status === 'completed' && (
                          <span className="badge badge-green">
                            <CheckCircle2 size={12} /> Completed
                          </span>
                        )}
                        <strong style={{ fontSize: '1rem' }}>{item.title}</strong>
                      </div>

                      {item.notes && (
                        <p style={{ fontSize: '0.86rem', color: 'var(--text-2)' }}>{item.notes}</p>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          flexWrap: 'wrap',
                          fontSize: '0.8rem',
                          color: 'var(--muted)',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={13} /> Due: <strong>{formatDateTime(item.dueAt)}</strong>
                        </span>
                        {item.customer && (
                          <Link
                            href={`/dashboard/contacts/${item.customer.id || item.customerId}`}
                            style={{
                              fontWeight: 700,
                              color: 'var(--green-deep)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            <Phone size={12} /> {item.customer.name} ({item.customer.phone})
                          </Link>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.status !== 'completed' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleMarkCompleted(item)}
                          >
                            <CheckCircle2 size={15} /> Complete
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => openRescheduleModal(item)}
                          >
                            <Calendar size={14} /> Reschedule
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => setDeleteTarget(item)}
                        title="Delete reminder"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Create / Reschedule Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Reschedule Follow-up' : 'Schedule Customer Follow-up'}
        subtitle="Set a due date and task note so your team follows up on time."
      >
        <form onSubmit={handleSave} style={{ display: 'grid', gap: 14 }}>
          {!editingItem && (
            <div className="field">
              <label className="label" htmlFor="fu-customer">
                Customer *
              </label>
              <select
                id="fu-customer"
                className="select"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label className="label" htmlFor="fu-title">
              Follow-up Task Title *
            </label>
            <input
              id="fu-title"
              type="text"
              className="input"
              placeholder="e.g. Call regarding festive saree measurements"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="fu-due">
              Due Date & Time *
            </label>
            <input
              id="fu-due"
              type="datetime-local"
              className="input"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="fu-notes">
              Notes (optional)
            </label>
            <textarea
              id="fu-notes"
              className="textarea"
              style={{ minHeight: 80 }}
              placeholder="Context or promised discount details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {editingItem ? 'Save Changes' : 'Create Reminder'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Follow-up Reminder"
        description={`Delete the follow-up reminder "${deleteTarget?.title}"?`}
        confirmLabel="Delete Reminder"
      />
    </>
  );
}
