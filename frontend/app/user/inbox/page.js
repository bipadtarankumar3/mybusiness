'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import {
  DEMO_CONVERSATIONS,
  DEMO_MESSAGES_BY_CONV,
  DEMO_TEAM,
  formatDateTime,
  formatRelativeTime,
} from '@/lib/DemoPreviewData';
import {
  ConversationStatusBadge,
  LeadStatusBadge,
  MessageStatusIndicator,
} from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import {
  Search,
  Send,
  StickyNote,
  Sparkles,
  UserCheck,
  Phone,
  CalendarPlus,
  ExternalLink,
  CheckCircle2,
  FlaskConical,
  MessageSquare,
  PanelRightOpen,
  ArrowLeft,
} from 'lucide-react';

function SharedInboxInner() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const { user, isDemo } = useAuth();

  // Filters
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [assignedFilter, setAssignedFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);

  // Conversations & Active Chat
  const [conversations, setConversations] = useState(DEMO_CONVERSATIONS);
  const [activeId, setActiveId] = useState(DEMO_CONVERSATIONS[0]?.id || null);
  const [messages, setMessages] = useState(DEMO_MESSAGES_BY_CONV[DEMO_CONVERSATIONS[0]?.id] || []);
  const [teamMembers, setTeamMembers] = useState(DEMO_TEAM);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Mobile responsive view toggles
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'thread'
  const [crmDrawerOpen, setCrmDrawerOpen] = useState(false);

  // Composer state
  const [composerType, setComposerType] = useState('text'); // 'text' | 'note'
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [composerNotice, setComposerNotice] = useState('');

  // AI Quick Suggestions state
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // CRM side panel state
  const [crmNotes, setCrmNotes] = useState('');
  const [savingCrm, setSavingCrm] = useState(false);
  const [crmFeedback, setCrmFeedback] = useState('');
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpDue, setFollowUpDue] = useState('');

  const messagesEndRef = useRef(null);

  const activeConversation = conversations.find((c) => Number(c.id) === Number(activeId)) || null;
  const activeCustomer = activeConversation?.customer || null;

  // Load team members once
  useEffect(() => {
    api
      .get('/team/members')
      .then((res) => {
        const list = res?.data || res;
        if (Array.isArray(list) && list.length) setTeamMembers(list);
      })
      .catch(() => {});
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/conversations', {
        status: statusFilter || undefined,
        assigned: assignedFilter || undefined,
        search: debouncedSearch || undefined,
        limit: 50,
      });
      const list = res?.data || res;
      if (Array.isArray(list)) {
        setConversations(list);
        if (list.length > 0 && !list.some((c) => Number(c.id) === Number(activeId))) {
          setActiveId(list[0].id);
        }
      }
    } catch {
      const filtered = DEMO_CONVERSATIONS.filter((c) => {
        if (statusFilter && c.status !== statusFilter) return false;
        if (assignedFilter === 'unassigned' && c.assignedTo) return false;
        if (assignedFilter === 'me' && c.assignedTo?.id !== (user?.id || 1)) return false;
        if (debouncedSearch) {
          const q = debouncedSearch.toLowerCase();
          const matchName = c.customer?.name?.toLowerCase().includes(q);
          const matchPhone = c.customer?.phone?.toLowerCase().includes(q);
          const matchPreview = c.lastMessagePreview?.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchPreview) return false;
        }
        return true;
      });
      setConversations(filtered);
      if (filtered.length > 0 && !filtered.some((c) => Number(c.id) === Number(activeId))) {
        setActiveId(filtered[0].id);
      }
    } finally {
      setLoadingList(false);
    }
  }, [statusFilter, assignedFilter, debouncedSearch, activeId, user?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when activeId changes
  useEffect(() => {
    if (!activeId) return;
    setLoadingMessages(true);
    setAiSuggestions([]);
    setComposerNotice('');
    api
      .get(`/conversations/${activeId}/messages`, { limit: 100 })
      .then((res) => {
        const list = res?.data || res;
        if (Array.isArray(list)) {
          setMessages(list);
        } else {
          setMessages(DEMO_MESSAGES_BY_CONV[activeId] || []);
        }
      })
      .catch(() => {
        setMessages(DEMO_MESSAGES_BY_CONV[activeId] || []);
      })
      .finally(() => {
        setLoadingMessages(false);
      });
  }, [activeId]);

  useEffect(() => {
    if (activeCustomer) {
      setCrmNotes(activeCustomer.notes || '');
      setCrmFeedback('');
    }
  }, [activeCustomer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeId]);

  // Send message or internal note
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || !activeConversation) return;

    setSending(true);
    setComposerNotice('');
    try {
      const res = await api.post(`/conversations/${activeConversation.id}/messages`, {
        body: trimmed,
        type: composerType,
      });
      const created = res?.data || res;
      setMessages((prev) => [...prev, created]);
      setBody('');
      if (created?.status === 'simulated') {
        setComposerNotice(
          'Message saved with "Simulated (demo)" status because WhatsApp Cloud API is not configured.'
        );
      }
    } catch (err) {
      if (err?.status === 422) {
        setComposerNotice(err.message || 'Outside 24h customer-service window — an approved template is required.');
      } else {
        // Fallback optimistic demo message when backend is offline
        const optimistic = {
          id: Date.now(),
          conversationId: activeConversation.id,
          direction: 'outbound',
          type: composerType,
          body: trimmed,
          status: composerType === 'note' ? 'received' : 'simulated',
          sentBy: { id: user?.id || 1, name: user?.name || 'Aarav Mehta' },
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);
        setBody('');
        if (composerType === 'text') {
          setComposerNotice('Stored as Simulated (demo) — connect WhatsApp Cloud API in Integrations for live delivery.');
        }
      }
    } finally {
      setSending(false);
    }
  };

  // Update conversation status or assignment
  const handleUpdateConversation = async (patch) => {
    if (!activeConversation) return;
    try {
      const res = await api.patch(`/conversations/${activeConversation.id}`, patch);
      const updated = res?.data || res;
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversation.id ? { ...c, ...updated, ...patch } : c))
      );
    } catch {
      const member =
        patch.assignedToUserId !== undefined
          ? teamMembers.find((m) => Number(m.userId || m.id) === Number(patch.assignedToUserId)) || null
          : activeConversation.assignedTo;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                ...(patch.status ? { status: patch.status } : {}),
                ...(patch.assignedToUserId !== undefined
                  ? { assignedTo: member ? { id: member.userId || member.id, name: member.name } : null }
                  : {}),
              }
            : c
        )
      );
    }
  };

  // Update customer leadStatus or notes
  const handleUpdateCustomer = async (patch) => {
    if (!activeCustomer) return;
    setSavingCrm(true);
    setCrmFeedback('');
    try {
      const res = await api.patch(`/contacts/${activeCustomer.id}`, patch);
      const updated = res?.data || res;
      setConversations((prev) =>
        prev.map((c) =>
          c.customer?.id === activeCustomer.id
            ? { ...c, customer: { ...c.customer, ...updated, ...patch } }
            : c
        )
      );
      setCrmFeedback('Customer record updated');
    } catch {
      setConversations((prev) =>
        prev.map((c) =>
          c.customer?.id === activeCustomer.id ? { ...c, customer: { ...c.customer, ...patch } } : c
        )
      );
      setCrmFeedback('Updated in demo workspace');
    } finally {
      setSavingCrm(false);
    }
  };

  // Quick follow-up creation
  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    if (!activeCustomer || !followUpTitle.trim() || !followUpDue) return;
    setSavingCrm(true);
    setCrmFeedback('');
    try {
      await api.post('/follow-ups', {
        customerId: activeCustomer.id,
        title: followUpTitle.trim(),
        dueAt: new Date(followUpDue).toISOString(),
      });
      setFollowUpTitle('');
      setFollowUpDue('');
      setCrmFeedback('Follow-up reminder scheduled!');
    } catch {
      setFollowUpTitle('');
      setFollowUpDue('');
      setCrmFeedback('Follow-up reminder added to demo schedule!');
    } finally {
      setSavingCrm(false);
    }
  };

  // Request AI reply suggestions
  const handleSuggestReplies = async () => {
    if (!activeConversation) return;
    setLoadingAi(true);
    try {
      const res = await api.post('/ai/reply-suggestions', {
        conversationId: activeConversation.id,
      });
      const data = res?.data || res;
      if (Array.isArray(data?.suggestions) && data.suggestions.length) {
        setAiSuggestions(data.suggestions);
      } else {
        throw new Error('Demo fallback');
      }
    } catch {
      const name = activeCustomer?.name?.split(' ')[0] || 'there';
      setAiSuggestions([
        `Namaste ${name} ji! Yes, that slot is available. Shall I confirm it for you and share location details?`,
        `Hi ${name}, thank you for reaching out! Sharing our latest festive catalogue & pricing below. Let me know your preferred colour.`,
        `Hello ${name}! We have noted your request. Our senior stylist will call you shortly to finalize the details.`,
      ]);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="inbox-layout">
      {/* Column 1: Conversation List */}
      <section
        className={`inbox-list-col ${mobileView === 'thread' ? 'hidden-mobile' : ''}`}
        aria-label="Conversations list"
      >
        <div className="inbox-list-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Shared Inbox</h2>
            <span className="badge badge-green">{conversations.length} chats</span>
          </div>

          <div className="toolbar-search" style={{ maxWidth: 'none', minWidth: 0 }}>
            <Search />
            <input
              type="search"
              className="input"
              placeholder="Search name, phone, message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search conversations"
            />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: '', label: 'All' },
              { key: 'open', label: 'Open' },
              { key: 'pending', label: 'Pending' },
              { key: 'resolved', label: 'Resolved' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                className={`tab-btn ${statusFilter === t.key ? 'active' : ''}`}
                style={{ padding: '5px 10px', fontSize: '0.76rem' }}
                onClick={() => setStatusFilter(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <select
              className="filter-select"
              style={{ width: '100%', minHeight: 34, fontSize: '0.8rem' }}
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              aria-label="Filter by assignment"
            >
              <option value="">All team assignments</option>
              <option value="me">Assigned to me</option>
              <option value="unassigned">Unassigned only</option>
            </select>
          </div>
        </div>

        <div className="inbox-conv-items">
          {loadingList && conversations.length === 0 ? (
            <div style={{ padding: 16, display: 'grid', gap: 10 }}>
              <div className="skeleton" style={{ height: 68 }} />
              <div className="skeleton" style={{ height: 68 }} />
              <div className="skeleton" style={{ height: 68 }} />
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No matching conversations"
              description="Try clearing your search or status filter."
            />
          ) : (
            conversations.map((conv) => {
              const selected = Number(conv.id) === Number(activeId);
              return (
                <button
                  key={conv.id}
                  type="button"
                  className={`inbox-conv-item ${selected ? 'active' : ''}`}
                  onClick={() => {
                    setActiveId(conv.id);
                    setMobileView('thread');
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <strong
                      style={{
                        fontSize: '0.92rem',
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {conv.customer?.name || conv.customer?.phone || `Chat #${conv.id}`}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', flexShrink: 0 }}>
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {conv.lastMessagePreview || 'No messages yet'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <ConversationStatusBadge status={conv.status} />
                      {conv.isDemo && (
                        <span className="badge badge-demo" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          Demo
                        </span>
                      )}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span
                        style={{
                          background: 'var(--green)',
                          color: '#04261b',
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          borderRadius: 999,
                          padding: '1px 7px',
                        }}
                      >
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Column 2: Active Chat Thread */}
      <section
        className={`inbox-thread-col ${mobileView === 'list' ? 'hidden-mobile' : ''}`}
        aria-label="Active conversation thread"
      >
        {!activeConversation ? (
          <div style={{ margin: 'auto' }}>
            <EmptyState
              icon={MessageSquare}
              title="Select a conversation"
              description="Choose a customer thread from the left panel to view messages and CRM context."
            />
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="inbox-thread-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setMobileView('list')}
                  style={{ padding: '4px 8px' }}
                  title="Back to list"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '1rem' }}>
                      {activeCustomer?.name || 'Customer'}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {activeCustomer?.phone}
                    </span>
                    {(activeConversation.isDemo || isDemo) && (
                      <span className="badge badge-demo">
                        <FlaskConical size={12} /> Demo Thread
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                    Assigned to: <strong>{activeConversation.assignedTo?.name || 'Unassigned'}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <select
                  className="filter-select"
                  style={{ minHeight: 34, fontSize: '0.8rem' }}
                  value={activeConversation.assignedTo?.id || ''}
                  onChange={(e) =>
                    handleUpdateConversation({
                      assignedToUserId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  aria-label="Assign conversation to team member"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.userId || m.id} value={m.userId || m.id}>
                      Assign: {m.name} ({m.role})
                    </option>
                  ))}
                </select>

                <select
                  className="filter-select"
                  style={{ minHeight: 34, fontSize: '0.8rem' }}
                  value={activeConversation.status}
                  onChange={(e) => handleUpdateConversation({ status: e.target.value })}
                  aria-label="Conversation status"
                >
                  <option value="open">Status: Open</option>
                  <option value="pending">Status: Pending</option>
                  <option value="resolved">Status: Resolved</option>
                </select>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setCrmDrawerOpen((v) => !v)}
                  title="Toggle Customer CRM Panel"
                >
                  <PanelRightOpen size={15} /> CRM
                </button>
              </div>
            </div>

            {/* Demo Mode Clarity Strip inside Inbox */}
            {(activeConversation.isDemo || isDemo) && (
              <div
                style={{
                  padding: '6px 16px',
                  background: '#fffbeb',
                  borderBottom: '1px solid #fde68a',
                  fontSize: '0.76rem',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <span>
                  <FlaskConical size={12} style={{ display: 'inline', marginRight: 5 }} />
                  Outbound replies in this demo conversation are stored with status{' '}
                  <strong>Simulated (demo)</strong> — never marked as delivered without WhatsApp webhook confirmation.
                </span>
              </div>
            )}

            {/* Message Thread Scroll */}
            <div className="inbox-messages-scroll">
              {loadingMessages ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div className="skeleton" style={{ height: 54, width: '60%' }} />
                  <div className="skeleton" style={{ height: 54, width: '65%', justifySelf: 'end' }} />
                </div>
              ) : messages.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No messages in this thread yet"
                  description="Send a message or add a private internal note for your team below."
                />
              ) : (
                messages.map((msg) => {
                  const isNote = msg.type === 'note';
                  const rowCls = isNote
                    ? 'note'
                    : msg.direction === 'inbound'
                    ? 'inbound'
                    : 'outbound';

                  return (
                    <div key={msg.id} className={`msg-row ${rowCls}`}>
                      <div className="msg-bubble">
                        {isNote && (
                          <div
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: 4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            <StickyNote size={13} /> Internal Team Note (Private — never sent to customer)
                          </div>
                        )}
                        <div>{msg.body}</div>
                      </div>
                      <div className="msg-meta">
                        <span>{formatDateTime(msg.createdAt)}</span>
                        {msg.sentBy?.name && <span>• {msg.sentBy.name}</span>}
                        {!isNote && msg.direction === 'outbound' && (
                          <>
                            <span>•</span>
                            <MessageStatusIndicator status={msg.status} />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Suggestions Strip */}
            {aiSuggestions.length > 0 && (
              <div
                style={{
                  padding: '10px 16px',
                  background: '#f3e8ff',
                  borderTop: '1px solid #d8b4fe',
                  display: 'grid',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b21a8' }}>
                    <Sparkles size={13} style={{ display: 'inline', marginRight: 4 }} />
                    AI Suggested Replies (Click to insert)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAiSuggestions([])}
                    style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: '#6b21a8' }}
                  >
                    Dismiss
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {aiSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setComposerType('text');
                        setBody(s);
                      }}
                      style={{
                        background: '#fff',
                        border: '1px solid #d8b4fe',
                        borderRadius: 10,
                        padding: '7px 11px',
                        fontSize: '0.78rem',
                        textAlign: 'left',
                        minWidth: 220,
                        maxWidth: 300,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Composer */}
            <form
              onSubmit={handleSendMessage}
              className={`inbox-composer ${composerType === 'note' ? 'note-mode' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className={`tab-btn ${composerType === 'text' ? 'active' : ''}`}
                    style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                    onClick={() => setComposerType('text')}
                  >
                    <Send size={13} /> WhatsApp Reply
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${composerType === 'note' ? 'active' : ''}`}
                    style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                    onClick={() => setComposerType('note')}
                  >
                    <StickyNote size={13} /> Internal Note
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.78rem', minHeight: 30, padding: '0 10px', color: '#6d3fd8' }}
                  onClick={handleSuggestReplies}
                  disabled={loadingAi}
                >
                  <Sparkles size={14} /> {loadingAi ? 'Drafting...' : 'AI Suggest Reply'}
                </button>
              </div>

              {composerNotice && (
                <div style={{ fontSize: '0.76rem', color: '#854d0e', fontWeight: 600 }}>{composerNotice}</div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  className="input"
                  style={{ minHeight: 42 }}
                  placeholder={
                    composerType === 'note'
                      ? 'Write a private team note (never sent to customer)...'
                      : 'Type a WhatsApp reply...'
                  }
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <button
                  type="submit"
                  className={composerType === 'note' ? 'btn btn-dark' : 'btn btn-primary'}
                  style={{ minHeight: 42, paddingInline: 18 }}
                  disabled={sending || !body.trim()}
                >
                  {sending ? <span className="spinner" /> : composerType === 'note' ? <StickyNote size={16} /> : <Send size={16} />}
                  {composerType === 'note' ? 'Save Note' : 'Send'}
                </button>
              </div>
            </form>
          </>
        )}
      </section>

      {/* Column 3: Customer CRM Context Panel */}
      <aside
        className={`inbox-crm-col ${crmDrawerOpen ? 'mobile-open' : ''}`}
        aria-label="Customer CRM details"
      >
        {!activeCustomer ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>No customer selected.</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: '1.08rem', fontWeight: 800 }}>{activeCustomer.name}</h3>
                <div
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <Phone size={13} /> {activeCustomer.phone}
                </div>
              </div>
              <Link
                href={`/user/contacts/${activeCustomer.id}`}
                className="btn btn-outline btn-sm"
                style={{ padding: '4px 10px', minHeight: 32, fontSize: '0.76rem' }}
              >
                Profile <ExternalLink size={12} />
              </Link>
            </div>

            {crmFeedback && (
              <div className="alert alert-success" style={{ padding: '8px 12px', fontSize: '0.78rem' }}>
                <CheckCircle2 size={14} />
                <span>{crmFeedback}</span>
              </div>
            )}

            <div className="crm-section">
              <h4>Lead Stage</h4>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <LeadStatusBadge status={activeCustomer.leadStatus} />
                <select
                  className="filter-select"
                  style={{ minHeight: 34, fontSize: '0.8rem' }}
                  value={activeCustomer.leadStatus || 'new'}
                  onChange={(e) => handleUpdateCustomer({ leadStatus: e.target.value })}
                  aria-label="Change customer lead status"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="customer">Customer</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>

            <div className="crm-section">
              <h4>Tags & Opt-In</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Array.isArray(activeCustomer.tags) && activeCustomer.tags.length > 0 ? (
                  activeCustomer.tags.map((tag) => (
                    <span
                      key={tag.id || tag.name}
                      className="badge"
                      style={{
                        background: `${tag.color || '#16C784'}18`,
                        color: tag.color || '#087f5b',
                        border: `1px solid ${tag.color || '#16C784'}44`,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>No tags assigned</span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>
                WhatsApp Broadcast Opt-in:{' '}
                <strong style={{ color: activeCustomer.whatsappOptIn ? 'var(--green-deep)' : 'var(--danger)' }}>
                  {activeCustomer.whatsappOptIn ? 'Opted In' : 'Opted Out'}
                </strong>
              </div>
            </div>

            <div className="crm-section">
              <h4>Customer Notes</h4>
              <textarea
                className="textarea"
                style={{ minHeight: 84, fontSize: '0.84rem' }}
                placeholder="Preferences, sizes, order history..."
                value={crmNotes}
                onChange={(e) => setCrmNotes(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={savingCrm}
                onClick={() => handleUpdateCustomer({ notes: crmNotes })}
              >
                Save Customer Notes
              </button>
            </div>

            <form className="crm-section" onSubmit={handleCreateFollowUp}>
              <h4>Quick Schedule Follow-up</h4>
              <input
                type="text"
                className="input"
                style={{ minHeight: 38, fontSize: '0.84rem' }}
                placeholder="e.g. Confirm Friday 4 PM trial"
                value={followUpTitle}
                onChange={(e) => setFollowUpTitle(e.target.value)}
                required
              />
              <input
                type="datetime-local"
                className="input"
                style={{ minHeight: 38, fontSize: '0.82rem' }}
                value={followUpDue}
                onChange={(e) => setFollowUpDue(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={savingCrm}>
                <CalendarPlus size={14} /> Add Reminder
              </button>
            </form>
          </>
        )}
      </aside>
    </div>
  );
}

export default function SharedInboxPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 'calc(100vh - 68px)' }} />}>
      <SharedInboxInner />
    </Suspense>
  );
}
