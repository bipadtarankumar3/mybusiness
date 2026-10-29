'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { DEMO_WORKFLOWS, formatDateTime } from '@/components/dashboard/DemoPreviewData';
import { WorkflowStatusBadge } from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import {
  Workflow,
  Plus,
  Zap,
  GitBranch,
  Play,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const TRIGGER_LABELS = {
  new_conversation: 'When a new WhatsApp conversation starts',
  keyword_received: 'When inbound message contains keywords',
  tag_added: 'When a customer tag is added',
};

export default function AutomationListPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState(DEMO_WORKFLOWS);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTriggerType, setNewTriggerType] = useState('keyword_received');
  const [creating, setCreating] = useState(false);

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/workflows');
      const list = res?.data || res;
      if (Array.isArray(list)) setWorkflows(list);
    } catch {
      setWorkflows(DEMO_WORKFLOWS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const defaultDef = {
      nodes: [
        {
          id: 'trigger-1',
          category: 'trigger',
          type: newTriggerType,
          label: TRIGGER_LABELS[newTriggerType] || 'Trigger',
          config:
            newTriggerType === 'keyword_received'
              ? { keywords: ['price', 'details', 'book'] }
              : newTriggerType === 'tag_added'
              ? { tagId: 1 }
              : {},
        },
        {
          id: 'act-1',
          category: 'action',
          type: 'send_reply',
          label: 'Send Instant Reply',
          config: {
            text: 'Namaste! Thank you for reaching out. Our team will get back to you shortly.',
          },
        },
      ],
      edges: [{ from: 'trigger-1', to: 'act-1' }],
    };

    try {
      const res = await api.post('/workflows', {
        name: newName.trim(),
        trigger: {
          type: newTriggerType,
          config: defaultDef.nodes[0].config,
        },
        definition: defaultDef,
      });
      const created = res?.data || res;
      setCreateOpen(false);
      router.push(`/dashboard/automation/${created?.id || 1}`);
    } catch {
      setCreateOpen(false);
      router.push('/dashboard/automation/1');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-title">
          <h1>Smart Workflow Automation</h1>
          <p>
            Automate routine WhatsApp replies, lead qualification tags, follow-up reminders, and team routing.
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> New Workflow
          </button>
        </div>
      </div>

      <section className="panel-card">
        <div className="panel-head">
          <div>
            <h3>Configured Workflows</h3>
            <p>Each workflow runs a deterministic Trigger → Condition → Action graph on real events.</p>
          </div>
        </div>
        <div className="panel-body">
          {loading && workflows.length === 0 ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="skeleton" style={{ height: 84 }} />
              <div className="skeleton" style={{ height: 84 }} />
            </div>
          ) : workflows.length === 0 ? (
            <EmptyState
              icon={Workflow}
              title="No automation workflows yet"
              description="Build your first Trigger → Condition → Action workflow in under 2 minutes."
              action={
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
                  <Plus size={15} /> Create First Workflow
                </button>
              }
            />
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {workflows.map((wf) => {
                const nodes = wf.definition?.nodes || [];
                const triggerType = wf.trigger?.type || nodes[0]?.type || 'keyword_received';
                return (
                  <div
                    key={wf.id}
                    style={{
                      padding: '18px 20px',
                      borderRadius: 'var(--r-lg)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 16,
                    }}
                  >
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span className="icon-tile tile-green" style={{ width: 36, height: 36, borderRadius: 10 }}>
                          <Zap size={18} />
                        </span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{wf.name}</h4>
                        <WorkflowStatusBadge status={wf.status} />
                      </div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--muted)', marginLeft: 46 }}>
                        Trigger: <strong>{TRIGGER_LABELS[triggerType] || triggerType}</strong> •{' '}
                        {nodes.length} steps in flow • Executed{' '}
                        <strong>{wf.executionCount || 0} times</strong>
                        {wf.publishedAt ? ` • Published ${formatDateTime(wf.publishedAt)}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Link href={`/dashboard/automation/${wf.id}`} className="btn btn-outline btn-sm">
                        <GitBranch size={15} /> Open Visual Builder <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Automation Workflow"
        subtitle="Start with a trigger event, then customize conditions and actions in the visual builder."
      >
        <form onSubmit={handleCreateWorkflow} style={{ display: 'grid', gap: 14 }}>
          <div className="field">
            <label className="label" htmlFor="wf-name">
              Workflow Name *
            </label>
            <input
              id="wf-name"
              type="text"
              className="input"
              placeholder="e.g. Festive Price Enquiry Auto-Responder"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="wf-trigger">
              Starting Trigger *
            </label>
            <select
              id="wf-trigger"
              className="select"
              value={newTriggerType}
              onChange={(e) => setNewTriggerType(e.target.value)}
            >
              <option value="keyword_received">Keyword Received in WhatsApp Message</option>
              <option value="new_conversation">New Customer Conversation Started</option>
              <option value="tag_added">Customer Tag Added</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
              {creating ? <span className="spinner" /> : <Play size={14} />}
              Open Visual Builder →
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
