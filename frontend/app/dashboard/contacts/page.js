'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, applyServerErrors } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import {
  DEMO_CONTACTS,
  DEMO_TAGS,
  formatDateTime,
} from '@/components/dashboard/DemoPreviewData';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { LeadStatusBadge } from '@/components/ui/StatusBadge';
import {
  Users,
  Search,
  Plus,
  Tag,
  Edit3,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
} from 'lucide-react';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .trim()
    .min(8, 'Enter a valid phone number (e.g. +919876543210)'),
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email address'),
  leadStatus: z.enum(['new', 'contacted', 'qualified', 'customer', 'lost']).default('new'),
  source: z
    .enum(['whatsapp', 'website', 'walk_in', 'referral', 'manual', 'import'])
    .default('whatsapp'),
  notes: z.string().optional(),
  whatsappOptIn: z.boolean().default(true),
});

const TAG_PALETTE = ['#16C784', '#8B5CF6', '#60A5FA', '#FB7185', '#FBBF24', '#087F5B'];

function ContactsPageInner() {
  const searchParams = useSearchParams();
  const openCreateInitially = searchParams.get('new') === '1';

  const [contacts, setContacts] = useState(DEMO_CONTACTS);
  const [tags, setTags] = useState(DEMO_TAGS);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: DEMO_CONTACTS.length, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [leadStatus, setLeadStatus] = useState('');
  const [tagId, setTagId] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);

  // Modals
  const [contactModalOpen, setContactModalOpen] = useState(openCreateInitially);
  const [editingContact, setEditingContact] = useState(null);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [formServerError, setFormServerError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_PALETTE[0]);
  const [savingTag, setSavingTag] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      phone: '+91',
      email: '',
      leadStatus: 'new',
      source: 'whatsapp',
      notes: '',
      whatsappOptIn: true,
    },
  });

  const loadTags = useCallback(async () => {
    try {
      const res = await api.get('/tags');
      const list = res?.data || res;
      if (Array.isArray(list)) setTags(list);
    } catch {
      // keep demo tags
    }
  }, []);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/contacts', {
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        leadStatus: leadStatus || undefined,
        tagId: tagId || undefined,
        sort,
      });
      const list = res?.data || res;
      if (Array.isArray(list)) {
        setContacts(list);
        setMeta(
          res?.meta || {
            page,
            limit: 20,
            total: list.length,
            totalPages: Math.max(1, Math.ceil(list.length / 20)),
          }
        );
      }
    } catch {
      const filtered = DEMO_CONTACTS.filter((c) => {
        if (leadStatus && c.leadStatus !== leadStatus) return false;
        if (tagId && !c.tags?.some((t) => Number(t.id) === Number(tagId))) return false;
        if (debouncedSearch) {
          const q = debouncedSearch.toLowerCase();
          if (
            !c.name?.toLowerCase().includes(q) &&
            !c.phone?.toLowerCase().includes(q) &&
            !c.email?.toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return true;
      });
      setContacts(filtered);
      setMeta({ page: 1, limit: 20, total: filtered.length, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, leadStatus, tagId, sort]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const openCreateModal = () => {
    setEditingContact(null);
    setFormServerError('');
    setSelectedTagIds([]);
    reset({
      name: '',
      phone: '+91',
      email: '',
      leadStatus: 'new',
      source: 'whatsapp',
      notes: '',
      whatsappOptIn: true,
    });
    setContactModalOpen(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setFormServerError('');
    setSelectedTagIds((contact.tags || []).map((t) => t.id));
    reset({
      name: contact.name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      leadStatus: contact.leadStatus || 'new',
      source: contact.source || 'whatsapp',
      notes: contact.notes || '',
      whatsappOptIn: Boolean(contact.whatsappOptIn),
    });
    setContactModalOpen(true);
  };

  const toggleTagSelection = (id) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const onSaveContact = async (values) => {
    setFormServerError('');
    const payload = {
      ...values,
      email: values.email || null,
      tagIds: selectedTagIds,
    };

    try {
      if (editingContact) {
        const res = await api.patch(`/contacts/${editingContact.id}`, payload);
        const updated = res?.data || res;
        setContacts((prev) =>
          prev.map((c) => (c.id === editingContact.id ? { ...c, ...updated } : c))
        );
      } else {
        const res = await api.post('/contacts', payload);
        const created = res?.data || res;
        setContacts((prev) => [created, ...prev]);
      }
      setContactModalOpen(false);
      loadContacts();
    } catch (err) {
      if (err?.status === 409) {
        setError('phone', {
          type: 'server',
          message: err.message || 'A contact with this phone number already exists in your business.',
        });
        return;
      }
      if (!applyServerErrors(err, setError)) {
        // Offline demo fallback
        if (err?.status === 0 || err?.status >= 500) {
          const resolvedTags = tags.filter((t) => selectedTagIds.includes(t.id));
          if (editingContact) {
            setContacts((prev) =>
              prev.map((c) =>
                c.id === editingContact.id ? { ...c, ...payload, tags: resolvedTags } : c
              )
            );
          } else {
            setContacts((prev) => [
              {
                id: Date.now(),
                ...payload,
                tags: resolvedTags,
                createdAt: new Date().toISOString(),
                lastContactedAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }
          setContactModalOpen(false);
        } else {
          setFormServerError(err?.message || 'Failed to save contact.');
        }
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.del(`/contacts/${deleteTarget.id}`);
      setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setSavingTag(true);
    try {
      const res = await api.post('/tags', { name: newTagName.trim(), color: newTagColor });
      const created = res?.data || res;
      setTags((prev) => [...prev, { customerCount: 0, ...created }]);
      setNewTagName('');
    } catch {
      setTags((prev) => [
        ...prev,
        { id: Date.now(), name: newTagName.trim(), color: newTagColor, customerCount: 0 },
      ]);
      setNewTagName('');
    } finally {
      setSavingTag(false);
    }
  };

  const handleDeleteTag = async (id) => {
    try {
      await api.del(`/tags/${id}`);
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setTags((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Contacts & Customer CRM</h1>
          <p>
            Manage your customer directory, WhatsApp broadcast opt-ins, lead stages, and segmentation tags.
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setTagModalOpen(true)}>
            <Tag size={15} /> Manage Tags ({tags.length})
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <Search />
          <input
            type="search"
            className="input"
            placeholder="Search by customer name, +91 phone, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Search contacts"
          />
        </div>

        <div className="toolbar-filters">
          <select
            className="filter-select"
            value={leadStatus}
            onChange={(e) => {
              setLeadStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by lead status"
          >
            <option value="">All Lead Stages</option>
            <option value="new">New Lead</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="customer">Customer</option>
            <option value="lost">Lost</option>
          </select>

          <select
            className="filter-select"
            value={tagId}
            onChange={(e) => {
              setTagId(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by tag"
          >
            <option value="">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                Tag: {t.name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort contacts"
          >
            <option value="-createdAt">Newest First</option>
            <option value="createdAt">Oldest First</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Contacts Table + Mobile Cards */}
      <section className="panel-card">
        {loading && contacts.length === 0 ? (
          <div style={{ padding: 24, display: 'grid', gap: 12 }}>
            <div className="skeleton" style={{ height: 48 }} />
            <div className="skeleton" style={{ height: 48 }} />
            <div className="skeleton" style={{ height: 48 }} />
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts found"
            description="Add your first customer or adjust your search and tag filters."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
                <Plus size={15} /> Add First Contact
              </button>
            }
          />
        ) : (
          <>
            <div className="data-table-wrap hide-mobile-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone & Source</th>
                    <th>Lead Stage</th>
                    <th>Tags</th>
                    <th>WhatsApp Opt-In</th>
                    <th>Last Contacted</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link
                          href={`/dashboard/contacts/${c.id}`}
                          style={{ fontWeight: 700, color: 'var(--text)', display: 'block' }}
                        >
                          {c.name}
                        </Link>
                        {c.email && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{c.email}</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.phone}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'capitalize' }}>
                          Source: {(c.source || 'whatsapp').replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <LeadStatusBadge status={c.leadStatus} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {(c.tags || []).map((t) => (
                            <span
                              key={t.id || t.name}
                              className="badge"
                              style={{
                                background: `${t.color || '#16C784'}18`,
                                color: t.color || '#087f5b',
                              }}
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {c.whatsappOptIn ? (
                          <span className="badge badge-green">
                            <CheckCircle2 size={12} /> Opted In
                          </span>
                        ) : (
                          <span className="badge badge-coral">
                            <XCircle size={12} /> Opted Out
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                        {formatDateTime(c.lastContactedAt || c.createdAt)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <Link
                            href={`/dashboard/contacts/${c.id}`}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '6px 10px' }}
                            title="View customer 360 profile"
                          >
                            <ExternalLink size={15} />
                          </Link>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '6px 10px' }}
                            onClick={() => openEditModal(c)}
                            title="Edit contact"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '6px 10px', color: 'var(--danger)' }}
                            onClick={() => setDeleteTarget(c)}
                            title="Delete contact"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards List */}
            <div className="mobile-cards-list" style={{ padding: 14 }}>
              {contacts.map((c) => (
                <div
                  key={c.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    padding: 14,
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Link href={`/dashboard/contacts/${c.id}`} style={{ fontWeight: 800, fontSize: '1rem' }}>
                        {c.name}
                      </Link>
                      <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 2 }}>
                        <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {c.phone}
                      </div>
                    </div>
                    <LeadStatusBadge status={c.leadStatus} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(c.tags || []).map((t) => (
                      <span key={t.id || t.name} className="badge">
                        {t.name}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href={`/dashboard/contacts/${c.id}`} className="btn btn-outline btn-sm">
                      View Profile
                    </Link>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEditModal(c)}>
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => setDeleteTarget(c)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="pagination-bar">
              <span>
                Showing <strong>{contacts.length}</strong> of <strong>{meta.total || contacts.length}</strong> contacts
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {meta.totalPages || 1}
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={page >= (meta.totalPages || 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Create / Edit Contact Modal */}
      <Modal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title={editingContact ? `Edit ${editingContact.name}` : 'Add Customer Contact'}
        subtitle="Phone numbers are normalized and deduplicated per business."
      >
        {formServerError && <div className="alert alert-error">{formServerError}</div>}

        <form id="contact-form" onSubmit={handleSubmit(onSaveContact)} style={{ display: 'grid', gap: 14 }} noValidate>
          <div className="dash-grid-equal" style={{ gap: 12 }}>
            <div className="field">
              <label className="label" htmlFor="c-name">
                Customer Name *
              </label>
              <input
                id="c-name"
                type="text"
                className="input"
                placeholder="e.g. Priya Sharma"
                aria-invalid={Boolean(errors.name)}
                {...register('name')}
              />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>

            <div className="field">
              <label className="label" htmlFor="c-phone">
                WhatsApp Phone Number *
              </label>
              <input
                id="c-phone"
                type="tel"
                className="input"
                placeholder="+919876543210"
                aria-invalid={Boolean(errors.phone)}
                {...register('phone')}
              />
              {errors.phone && <span className="field-error">{errors.phone.message}</span>}
            </div>
          </div>

          <div className="dash-grid-equal" style={{ gap: 12 }}>
            <div className="field">
              <label className="label" htmlFor="c-email">
                Email Address (optional)
              </label>
              <input
                id="c-email"
                type="email"
                className="input"
                placeholder="priya@example.in"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>

            <div className="field">
              <label className="label" htmlFor="c-status">
                Lead Stage
              </label>
              <select id="c-status" className="select" {...register('leadStatus')}>
                <option value="new">New Lead</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="customer">Customer</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="c-source">
              Acquisition Source
            </label>
            <select id="c-source" className="select" {...register('source')}>
              <option value="whatsapp">WhatsApp Inbound</option>
              <option value="website">Website / Instagram Link</option>
              <option value="walk_in">Store Walk-in</option>
              <option value="referral">Customer Referral</option>
              <option value="manual">Manual Entry</option>
              <option value="import">Bulk Import</option>
            </select>
          </div>

          <div className="field">
            <span className="label">Assign Segmentation Tags</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tags.map((tag) => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTagSelection(tag.id)}
                    className="badge"
                    style={{
                      padding: '6px 12px',
                      border: active ? `2px solid ${tag.color || '#16C784'}` : '1px solid var(--border-strong)',
                      background: active ? `${tag.color || '#16C784'}22` : '#fff',
                      color: 'var(--text)',
                    }}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="c-notes">
              CRM Notes
            </label>
            <textarea
              id="c-notes"
              className="textarea"
              style={{ minHeight: 80 }}
              placeholder="Add customer preferences, sizes, or past order notes..."
              {...register('notes')}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', fontWeight: 600 }}>
            <input type="checkbox" {...register('whatsappOptIn')} style={{ width: 18, height: 18 }} />
            Customer has opted in to receive WhatsApp broadcast & utility messages
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setContactModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
              {isSubmitting ? <span className="spinner" /> : null}
              {editingContact ? 'Update Contact' : 'Create Contact'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Tag Manager Modal */}
      <Modal
        open={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        title="Manage Customer Tags"
        subtitle="Create colour-coded tags to segment customers for targeted WhatsApp broadcasts."
      >
        <form onSubmit={handleCreateTag} style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="input"
              style={{ minHeight: 40 }}
              placeholder="New tag name (e.g. Festive VIP)"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={savingTag}>
              <Plus size={15} /> Add Tag
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Colour:</span>
            {TAG_PALETTE.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setNewTagColor(hex)}
                aria-label={`Select color ${hex}`}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: hex,
                  border: newTagColor === hex ? '3px solid var(--text)' : '2px solid transparent',
                }}
              />
            ))}
          </div>
        </form>

        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          {tags.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: t.color || '#16C784',
                  }}
                />
                <strong>{t.name}</strong>
                {t.customerCount !== undefined && (
                  <span className="badge">{t.customerCount} contacts</span>
                )}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--danger)', padding: '4px 8px' }}
                onClick={() => handleDeleteTag(t.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Delete Contact Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Contact"
        description={`Are you sure you want to remove "${deleteTarget?.name}" (${deleteTarget?.phone})? This performs a safe soft-delete so historical analytics stay accurate.`}
        confirmLabel="Delete Contact"
      />
    </>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 420 }} />}>
      <ContactsPageInner />
    </Suspense>
  );
}
