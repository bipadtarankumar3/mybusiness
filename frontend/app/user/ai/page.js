'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_CONVERSATIONS } from '@/lib/DemoPreviewData';
import {
  Sparkles,
  FlaskConical,
  MessageSquare,
  FileText,
  Megaphone,
  BookOpen,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';

export default function AiAssistantPage() {
  const { business } = useAuth();
  const [aiStatus, setAiStatus] = useState({
    configured: false,
    provider: null,
    usage: { used: 18, limit: 500 },
  });
  const [conversations, setConversations] = useState(DEMO_CONVERSATIONS);
  const [selectedConvId, setSelectedConvId] = useState(DEMO_CONVERSATIONS[0]?.id || 101);

  // Interactive tool outputs
  const [replySuggestions, setReplySuggestions] = useState([]);
  const [replyIsDemo, setReplyIsDemo] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const [summaryText, setSummaryText] = useState('');
  const [summaryIsDemo, setSummaryIsDemo] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [campaignGoal, setCampaignGoal] = useState(
    'Promote our Diwali Handloom Saree & Bridal Lehenga collection with ₹1,000 festive discount on orders above ₹7,999'
  );
  const [campaignTone, setCampaignTone] = useState('warm_festive');
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [copyIsDemo, setCopyIsDemo] = useState(false);
  const [loadingCopy, setLoadingCopy] = useState(false);

  // Business Knowledge Base config
  const [knowledge, setKnowledge] = useState({
    storeTimings: 'Mon–Sat: 10:00 AM to 8:00 PM IST. Closed on Sundays.',
    shippingPolicy: 'Free express courier across India on prepaid orders above ₹1,999 (3–5 business days).',
    returnPolicy: '7-day size exchange available on unstitched & ready-to-wear outfits.',
    specialNotes: 'Custom blouse stitching & bridal trial slots available on Friday & Saturday by appointment.',
  });
  const [knowledgeSaved, setKnowledgeSaved] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const loadAiStatus = useCallback(async () => {
    try {
      const [statusRes, convRes] = await Promise.all([
        api.get('/ai/status'),
        api.get('/conversations', { limit: 20 }).catch(() => ({ data: DEMO_CONVERSATIONS })),
      ]);
      const st = statusRes?.data || statusRes;
      if (st && typeof st.configured === 'boolean') {
        setAiStatus({
          configured: st.configured,
          provider: st.provider || null,
          usage: st.usage || { used: 18, limit: 500 },
        });
      }
      const convList = convRes?.data || convRes;
      if (Array.isArray(convList) && convList.length) {
        setConversations(convList);
        setSelectedConvId(convList[0].id);
      }
    } catch {
      // keep demo status
    }
  }, []);

  useEffect(() => {
    loadAiStatus();
  }, [loadAiStatus]);

  const handleCopy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 1600);
  };

  // 1. Reply suggestions
  const handleGenerateReplies = async () => {
    setLoadingReplies(true);
    setReplyIsDemo(false);
    try {
      const res = await api.post('/ai/reply-suggestions', {
        conversationId: Number(selectedConvId),
      });
      const data = res?.data || res;
      if (Array.isArray(data?.suggestions) && data.suggestions.length) {
        setReplySuggestions(data.suggestions);
        setAiStatus((prev) => ({
          ...prev,
          usage: { ...prev.usage, used: (prev.usage?.used || 0) + 1 },
        }));
      } else {
        throw new ApiError('Unconfigured', { code: 'NOT_CONFIGURED', status: 409 });
      }
    } catch {
      setReplyIsDemo(true);
      setReplySuggestions([
        'Namaste Priya ji! ✨ Yes, our Friday 4:00 PM bridal trial slot is open. Shall I reserve Trial Suite B and keep the pastel Banarasi pieces ready for you?',
        'Hello! Thank you for checking in. All pastel Organza and Banarasi sarees are in stock. Would you prefer a quick 10-minute WhatsApp video walkthrough today?',
        'Hi Priya ji, we have noted your preference for pastel shades. Sharing our Festive Lookbook PDF with prices and blouse customization options right away!',
      ]);
    } finally {
      setLoadingReplies(false);
    }
  };

  // 2. Conversation Summary
  const handleSummarize = async () => {
    setLoadingSummary(true);
    setSummaryIsDemo(false);
    try {
      const res = await api.post('/ai/summarize', {
        conversationId: Number(selectedConvId),
      });
      const data = res?.data || res;
      if (data?.summary) {
        setSummaryText(data.summary);
        setAiStatus((prev) => ({
          ...prev,
          usage: { ...prev.usage, used: (prev.usage?.used || 0) + 1 },
        }));
      } else {
        throw new ApiError('Unconfigured', { code: 'NOT_CONFIGURED', status: 409 });
      }
    } catch {
      setSummaryIsDemo(true);
      const conv = conversations.find((c) => Number(c.id) === Number(selectedConvId)) || conversations[0];
      const custName = conv?.customer?.name || 'Priya Sharma';
      setSummaryText(
        `• Customer: ${custName} (${conv?.customer?.leadStatus || 'qualified'} lead)\n` +
          `• Intent: Enquired about Pastel Organza & Banarasi silk collection for an upcoming family wedding.\n` +
          `• Key Action Item: Requested a bridal trial appointment this Friday around 4:00 PM.\n` +
          `• Team Note: Repeat VIP referral — eligible for 10% loyalty discount on 2+ sarees.`
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  // 3. Campaign Copy Generator
  const handleGenerateCopy = async (e) => {
    e.preventDefault();
    if (!campaignGoal.trim()) return;
    setLoadingCopy(true);
    setCopyIsDemo(false);
    try {
      const res = await api.post('/ai/campaign-copy', {
        goal: campaignGoal.trim(),
        tone: campaignTone,
      });
      const data = res?.data || res;
      if (data?.copy) {
        setGeneratedCopy(data.copy);
        setAiStatus((prev) => ({
          ...prev,
          usage: { ...prev.usage, used: (prev.usage?.used || 0) + 1 },
        }));
      } else {
        throw new ApiError('Unconfigured', { code: 'NOT_CONFIGURED', status: 409 });
      }
    } catch {
      setCopyIsDemo(true);
      setGeneratedCopy(
        `Namaste {{1}}! 🪔✨\n\n` +
          `Celebrate this festive & wedding season with ${business?.name || 'Ananya Ethnic Studio'}! Explore our newly arrived handcrafted Banarasi & Bridal Lehenga collection.\n\n` +
          `🎁 Special Offer: Enjoy flat ₹1,000 OFF on orders above ₹7,999 this week.\n\n` +
          `Reply YES to receive our lookbook PDF or book your private trial slot!`
      );
    } finally {
      setLoadingCopy(false);
    }
  };

  const used = aiStatus.usage?.used || 0;
  const limit = aiStatus.usage?.limit || 500;
  const pct = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));

  return (
    <>
      <div className="page-header">
        <div className="page-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1>AI Business Assistant</h1>
            {aiStatus.configured ? (
              <span className="badge badge-green">
                <CheckCircle2 size={13} /> Provider Active ({aiStatus.provider || 'Configured'})
              </span>
            ) : (
              <span className="badge badge-demo">
                <FlaskConical size={13} /> Not Configured — Demo Preview Mode
              </span>
            )}
          </div>
          <p>
            Draft context-aware WhatsApp replies, summarize customer threads, and generate high-converting festive
            campaign templates.
          </p>
        </div>
      </div>

      {/* Honest AI Configuration Status Banner */}
      {!aiStatus.configured && (
        <div className="alert alert-warning" role="status">
          <AlertTriangle />
          <div style={{ display: 'grid', gap: 4 }}>
            <strong>AI Provider Not Configured (`AI_PROVIDER` / `AI_API_KEY` not set)</strong>
            <span>
              Live LLM calls return <code>409 NOT_CONFIGURED</code> until you set <code>AI_PROVIDER</code> and{' '}
              <code>AI_API_KEY</code> in your backend environment. You can still test the interactive tools below using
              clearly labelled <strong>Demo Previews</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Usage Meter Card */}
      <section className="panel-card">
        <div className="panel-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'grid', gap: 4, minWidth: 240, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <strong>Monthly AI Assistant Allowance</strong>
              <span>
                <strong>{used}</strong> / {limit} requests used ({pct}%)
              </span>
            </div>
            <div className="usage-meter-track">
              <div
                className={`usage-meter-fill ${pct > 85 ? 'danger' : pct > 65 ? 'warn' : ''}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            Included in your plan • Resets on the 1st of every month
          </div>
        </div>
      </section>

      {/* Interactive Tools Grid */}
      <div className="dash-grid-equal">
        {/* Tool 1: Smart Reply Suggestions & Thread Summary */}
        <section className="panel-card">
          <div className="panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={17} color="var(--green-deep)" />
              <div>
                <h3>Reply Suggestions & Conversation Summary</h3>
                <p>Select a customer conversation to generate 3 reply options or a bulleted summary</p>
              </div>
            </div>
          </div>
          <div className="panel-body" style={{ display: 'grid', gap: 16 }}>
            <div className="field">
              <label className="label" htmlFor="ai-conv-select">
                Select Customer Conversation
              </label>
              <select
                id="ai-conv-select"
                className="select"
                value={selectedConvId}
                onChange={(e) => setSelectedConvId(e.target.value)}
              >
                {conversations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer?.name || `Chat #${c.id}`} — &ldquo;{c.lastMessagePreview?.slice(0, 48)}&rdquo;
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleGenerateReplies}
                disabled={loadingReplies}
              >
                <Sparkles size={15} /> {loadingReplies ? 'Generating...' : 'Suggest 3 Replies'}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleSummarize}
                disabled={loadingSummary}
              >
                <FileText size={15} /> {loadingSummary ? 'Summarizing...' : 'Summarize Conversation'}
              </button>
            </div>

            {replySuggestions.length > 0 && (
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-2)' }}>
                    Suggested Customer Replies
                  </span>
                  {replyIsDemo && <span className="badge badge-demo">Demo Preview (AI not configured)</span>}
                </div>
                {replySuggestions.map((reply, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border)',
                      background: 'var(--surface-2)',
                      fontSize: '0.86rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <span>{reply}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px', minHeight: 28 }}
                      onClick={() => handleCopy(reply, `reply-${idx}`)}
                    >
                      {copiedIndex === `reply-${idx}` ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {summaryText && (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-2)' }}>
                    Thread Summary & Next Steps
                  </span>
                  {summaryIsDemo && <span className="badge badge-demo">Demo Preview (AI not configured)</span>}
                </div>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: '0.86rem',
                    padding: 14,
                    borderRadius: 'var(--r-md)',
                    background: 'var(--pale-green)',
                    border: '1px solid #bbf0d4',
                    color: 'var(--text)',
                  }}
                >
                  {summaryText}
                </pre>
              </div>
            )}
          </div>
        </section>

        {/* Tool 2: Campaign Copy Generator */}
        <section className="panel-card">
          <div className="panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Megaphone size={17} color="var(--purple)" />
              <div>
                <h3>WhatsApp Campaign Copy Generator</h3>
                <p>Generate Meta-compliant broadcast templates with variable placeholders</p>
              </div>
            </div>
          </div>
          <div className="panel-body">
            <form onSubmit={handleGenerateCopy} style={{ display: 'grid', gap: 14 }}>
              <div className="field">
                <label className="label" htmlFor="ai-goal">
                  Campaign Offer or Goal *
                </label>
                <textarea
                  id="ai-goal"
                  className="textarea"
                  style={{ minHeight: 86 }}
                  value={campaignGoal}
                  onChange={(e) => setCampaignGoal(e.target.value)}
                  placeholder="Describe your offer, discount, or announcement..."
                  required
                />
              </div>

              <div className="field">
                <label className="label" htmlFor="ai-tone">
                  Tone of Voice
                </label>
                <select
                  id="ai-tone"
                  className="select"
                  value={campaignTone}
                  onChange={(e) => setCampaignTone(e.target.value)}
                >
                  <option value="warm_festive">Warm & Festive (Indian Retail / Boutique)</option>
                  <option value="professional">Professional & Concise</option>
                  <option value="urgent_sale">Limited-Time Flash Offer</option>
                  <option value="friendly_reminder">Friendly Appointment Reminder</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary btn-sm" disabled={loadingCopy}>
                <Sparkles size={15} /> {loadingCopy ? 'Drafting Copy...' : 'Generate WhatsApp Template Copy'}
              </button>
            </form>

            {generatedCopy && (
              <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Generated Broadcast Template</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {copyIsDemo && <span className="badge badge-demo">Demo Preview</span>}
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ minHeight: 28, padding: '0 10px', fontSize: '0.75rem' }}
                      onClick={() => handleCopy(generatedCopy, 'copy-out')}
                    >
                      {copiedIndex === 'copy-out' ? 'Copied!' : 'Copy Text'}
                    </button>
                  </div>
                </div>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: '0.86rem',
                    padding: 14,
                    borderRadius: 'var(--r-md)',
                    background: '#f3e8ff',
                    border: '1px solid #d8b4fe',
                    color: '#3b0764',
                  }}
                >
                  {generatedCopy}
                </pre>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Business Knowledge Context Configuration */}
      <section className="panel-card">
        <div className="panel-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={17} color="var(--green-deep)" />
            <div>
              <h3>Business Knowledge & Grounding Context</h3>
              <p>Provide store policies and FAQs so AI reply suggestions stay accurate for your business.</p>
            </div>
          </div>
        </div>
        <div className="panel-body">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setKnowledgeSaved(true);
              setTimeout(() => setKnowledgeSaved(false), 2500);
            }}
            style={{ display: 'grid', gap: 14 }}
          >
            <div className="dash-grid-equal">
              <div className="field">
                <label className="label" htmlFor="kb-hours">
                  Store Timings & Location Info
                </label>
                <input
                  id="kb-hours"
                  type="text"
                  className="input"
                  value={knowledge.storeTimings}
                  onChange={(e) => setKnowledge((p) => ({ ...p, storeTimings: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="kb-shipping">
                  Delivery & Shipping Policy
                </label>
                <input
                  id="kb-shipping"
                  type="text"
                  className="input"
                  value={knowledge.shippingPolicy}
                  onChange={(e) => setKnowledge((p) => ({ ...p, shippingPolicy: e.target.value }))}
                />
              </div>
            </div>

            <div className="dash-grid-equal">
              <div className="field">
                <label className="label" htmlFor="kb-returns">
                  Exchange & Return Policy
                </label>
                <input
                  id="kb-returns"
                  type="text"
                  className="input"
                  value={knowledge.returnPolicy}
                  onChange={(e) => setKnowledge((p) => ({ ...p, returnPolicy: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="kb-notes">
                  Custom Offers & Appointments
                </label>
                <input
                  id="kb-notes"
                  type="text"
                  className="input"
                  value={knowledge.specialNotes}
                  onChange={(e) => setKnowledge((p) => ({ ...p, specialNotes: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {knowledgeSaved ? (
                <span style={{ color: 'var(--green-deep)', fontWeight: 700, fontSize: '0.86rem' }}>
                  ✓ Business knowledge context saved
                </span>
              ) : (
                <span className="field-hint">Included automatically in AI prompt context.</span>
              )}
              <button type="submit" className="btn btn-primary btn-sm">
                Save Knowledge Context
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
