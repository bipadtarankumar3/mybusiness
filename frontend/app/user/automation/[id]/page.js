'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  DEMO_WORKFLOWS,
  DEMO_TAGS,
  DEMO_TEAM,
} from '@/lib/DemoPreviewData';
import { WorkflowStatusBadge } from '@/components/ui/StatusBadge';
import {
  ArrowLeft,
  Zap,
  GitBranch,
  Play,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Sliders,
} from 'lucide-react';

const NODE_CATALOG = {
  trigger: [
    { type: 'keyword_received', label: 'Keyword Received' },
    { type: 'new_conversation', label: 'New Conversation Started' },
    { type: 'tag_added', label: 'Customer Tag Added' },
  ],
  condition: [
    { type: 'business_hours', label: 'During Business Hours' },
    { type: 'has_tag', label: 'Customer Has Tag' },
    { type: 'lead_status_is', label: 'Lead Status Matches' },
  ],
  action: [
    { type: 'send_reply', label: 'Send Auto-Reply Message' },
    { type: 'add_tag', label: 'Add Customer Tag' },
    { type: 'update_lead_status', label: 'Update Lead Status' },
    { type: 'create_follow_up', label: 'Create Follow-up Reminder' },
    { type: 'assign_member', label: 'Assign to Team Member' },
  ],
};

function buildEdges(nodes) {
  const edges = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({ from: nodes[i].id, to: nodes[i + 1].id });
  }
  return edges;
}

export default function WorkflowBuilderPage({ params }) {
  const resolvedParams = use(params);
  const workflowId = Number(resolvedParams?.id || 1);

  const [workflow, setWorkflow] = useState(
    () => DEMO_WORKFLOWS.find((w) => Number(w.id) === workflowId) || DEMO_WORKFLOWS[0]
  );
  const [name, setName] = useState(workflow.name);
  const [nodes, setNodes] = useState(workflow.definition?.nodes || []);
  const [selectedNodeId, setSelectedNodeId] = useState(workflow.definition?.nodes?.[0]?.id || null);
  const [tags, setTags] = useState(DEMO_TAGS);
  const [team, setTeam] = useState(DEMO_TEAM);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }

  useEffect(() => {
    api
      .get('/tags')
      .then((res) => {
        const list = res?.data || res;
        if (Array.isArray(list) && list.length) setTags(list);
      })
      .catch(() => {});
    api
      .get('/team/members')
      .then((res) => {
        const list = res?.data || res;
        if (Array.isArray(list) && list.length) setTeam(list);
      })
      .catch(() => {});
  }, []);

  const loadWorkflow = useCallback(async () => {
    try {
      const res = await api.get(`/workflows/${workflowId}`);
      const data = res?.data || res;
      if (data?.id) {
        setWorkflow(data);
        setName(data.name || 'Untitled Workflow');
        const loadedNodes = data.definition?.nodes || [];
        setNodes(loadedNodes);
        if (loadedNodes.length) setSelectedNodeId(loadedNodes[0].id);
      }
    } catch {
      const fallback = DEMO_WORKFLOWS.find((w) => Number(w.id) === workflowId) || DEMO_WORKFLOWS[0];
      setWorkflow(fallback);
      setName(fallback.name);
      setNodes(fallback.definition?.nodes || []);
      setSelectedNodeId(fallback.definition?.nodes?.[0]?.id || null);
    }
  }, [workflowId]);

  useEffect(() => {
    loadWorkflow();
  }, [loadWorkflow]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0] || null;

  const updateSelectedNode = (patch) => {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedNode.id
          ? {
              ...n,
              ...patch,
              config: patch.config ? { ...n.config, ...patch.config } : n.config,
            }
          : n
      )
    );
  };

  const addNode = (category) => {
    const defaultItem = NODE_CATALOG[category][0];
    const id = `${category}-${Date.now()}`;
    const newNode = {
      id,
      category,
      type: defaultItem.type,
      label: defaultItem.label,
      config:
        defaultItem.type === 'send_reply'
          ? { text: 'Namaste! We have received your message.' }
          : defaultItem.type === 'create_follow_up'
          ? { title: 'Follow up with customer', delayHours: 4 }
          : defaultItem.type === 'add_tag' || defaultItem.type === 'has_tag'
          ? { tagId: tags[0]?.id || 1 }
          : defaultItem.type === 'lead_status_is' || defaultItem.type === 'update_lead_status'
          ? { status: 'qualified' }
          : defaultItem.type === 'assign_member'
          ? { userId: team[0]?.userId || 1 }
          : {},
    };

    if (category === 'condition') {
      // Insert condition right after trigger (or before first action)
      const firstActionIdx = nodes.findIndex((n) => n.category === 'action');
      if (firstActionIdx > 0) {
        const next = [...nodes];
        next.splice(firstActionIdx, 0, newNode);
        setNodes(next);
      } else {
        setNodes((prev) => [...prev, newNode]);
      }
    } else {
      setNodes((prev) => [...prev, newNode]);
    }
    setSelectedNodeId(id);
  };

  const removeNode = (id) => {
    const target = nodes.find((n) => n.id === id);
    if (!target || target.category === 'trigger') return;
    const remaining = nodes.filter((n) => n.id !== id);
    setNodes(remaining);
    if (selectedNodeId === id) {
      setSelectedNodeId(remaining[0]?.id || null);
    }
  };

  // Validate graph client-side before save/publish
  const validateGraph = () => {
    const triggers = nodes.filter((n) => n.category === 'trigger');
    if (triggers.length !== 1) {
      return 'Workflow must have exactly one starting Trigger node.';
    }
    const actions = nodes.filter((n) => n.category === 'action');
    if (actions.length === 0) {
      return 'Workflow must contain at least one Action node.';
    }
    for (const n of nodes) {
      if (n.type === 'send_reply' && !n.config?.text?.trim()) {
        return `Action "${n.label}" requires reply message text.`;
      }
      if (n.type === 'keyword_received') {
        const kw = n.config?.keywords;
        if (!Array.isArray(kw) || kw.length === 0) {
          return 'Keyword Trigger requires at least one keyword.';
        }
      }
    }
    return null;
  };

  const buildPayload = () => {
    const triggerNode = nodes.find((n) => n.category === 'trigger') || nodes[0];
    return {
      name: name.trim() || 'Untitled Workflow',
      trigger: {
        type: triggerNode?.type || 'keyword_received',
        config: triggerNode?.config || {},
      },
      definition: {
        nodes,
        edges: buildEdges(nodes),
      },
    };
  };

  const handleSaveDraft = async () => {
    setFeedback(null);
    setSaving(true);
    try {
      const payload = buildPayload();
      const res = await api.patch(`/workflows/${workflow.id}`, payload);
      const updated = res?.data || res;
      setWorkflow((prev) => ({ ...prev, ...updated }));
      setFeedback({ type: 'success', message: 'Workflow graph saved successfully.' });
    } catch {
      setFeedback({ type: 'success', message: 'Workflow saved in demo workspace.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setFeedback(null);
    const validationErr = validateGraph();
    if (validationErr) {
      setFeedback({ type: 'error', message: validationErr });
      return;
    }

    setPublishing(true);
    try {
      const payload = buildPayload();
      await api.patch(`/workflows/${workflow.id}`, payload).catch(() => {});
      const res = await api.post(`/workflows/${workflow.id}/publish`);
      const published = res?.data || res;
      setWorkflow((prev) => ({ ...prev, ...published, status: 'published' }));
      setFeedback({
        type: 'success',
        message: 'Workflow validated and published! It will now execute automatically on matching events.',
      });
    } catch (err) {
      if (err?.status === 422) {
        setFeedback({ type: 'error', message: err.message || 'Workflow validation failed.' });
      } else {
        setWorkflow((prev) => ({
          ...prev,
          status: 'published',
          publishedAt: new Date().toISOString(),
        }));
        setFeedback({
          type: 'success',
          message: 'Workflow validated and published in demo workspace!',
        });
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/user/automation" className="btn btn-outline btn-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <input
            type="text"
            className="input"
            style={{ fontWeight: 800, fontSize: '1.1rem', minHeight: 40, width: 340, maxWidth: '100%' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Workflow name"
          />
          <WorkflowStatusBadge status={workflow.status} />
        </div>

        <div className="page-header-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => addNode('condition')}>
            <Plus size={15} /> Add Condition
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => addNode('action')}>
            <Plus size={15} /> Add Action
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={handleSaveDraft} disabled={saving}>
            <Save size={15} /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handlePublish} disabled={publishing}>
            <Play size={15} /> {publishing ? 'Publishing...' : 'Validate & Publish'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`} role="status">
          {feedback.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="workflow-builder-grid">
        {/* Left: Visual Node Graph Canvas */}
        <section className="workflow-canvas" aria-label="Visual workflow canvas">
          {nodes.map((node, index) => {
            const isSelected = node.id === selectedNode?.id;
            const badgeCls =
              node.category === 'trigger'
                ? 'badge-green'
                : node.category === 'condition'
                ? 'badge-yellow'
                : 'badge-purple';

            return (
              <div
                key={node.id}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div
                  className={`wf-node-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className={`badge ${badgeCls}`} style={{ textTransform: 'uppercase' }}>
                      {node.category === 'trigger' ? <Zap size={12} /> : <GitBranch size={12} />}
                      Step {index + 1}: {node.category}
                    </span>
                    {node.category !== 'trigger' && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 4, minHeight: 26, color: 'var(--danger)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNode(node.id);
                        }}
                        aria-label="Remove node"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>{node.label}</div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 4 }}>
                    {node.type === 'keyword_received' &&
                      `Keywords: ${(node.config?.keywords || []).join(', ') || 'None'}`}
                    {node.type === 'send_reply' && `Reply: "${node.config?.text || ''}"`}
                    {node.type === 'create_follow_up' &&
                      `Task: "${node.config?.title || 'Follow up'}" (+${node.config?.delayHours || 4}h)`}
                    {(node.type === 'add_tag' || node.type === 'has_tag' || node.type === 'tag_added') &&
                      `Tag ID: #${node.config?.tagId || 1}`}
                    {(node.type === 'lead_status_is' || node.type === 'update_lead_status') &&
                      `Lead Stage: ${node.config?.status || 'qualified'}`}
                    {node.type === 'assign_member' &&
                      `Assign Member ID: #${node.config?.userId || 'Round-robin'}`}
                    {node.type === 'business_hours' && 'Evaluates workspace business hours'}
                    {node.type === 'new_conversation' && 'Runs on first inbound message'}
                  </div>
                </div>

                {index < nodes.length - 1 && (
                  <div className="wf-connector" aria-hidden="true">
                    <div className="wf-connector-line" />
                    <svg width="14" height="10" viewBox="0 0 14 10" style={{ marginTop: -2 }}>
                      <path d="M1 1L7 8L13 1" stroke="#16C784" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => addNode('condition')}>
              <Plus size={14} /> + Condition Step
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => addNode('action')}>
              <Plus size={14} /> + Action Step
            </button>
          </div>
        </section>

        {/* Right: Node Inspector & Configuration Panel */}
        <aside className="panel-card">
          <div className="panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders size={16} color="var(--green-deep)" />
              <h3>Step Inspector</h3>
            </div>
          </div>
          <div className="panel-body" style={{ display: 'grid', gap: 16 }}>
            {!selectedNode ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
                Click any node on the canvas to configure its parameters.
              </p>
            ) : (
              <>
                <div className="field">
                  <label className="label" htmlFor="node-type">
                    Step Type ({selectedNode.category.toUpperCase()})
                  </label>
                  <select
                    id="node-type"
                    className="select"
                    value={selectedNode.type}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      const catalogItem = NODE_CATALOG[selectedNode.category]?.find(
                        (item) => item.type === nextType
                      );
                      updateSelectedNode({
                        type: nextType,
                        label: catalogItem?.label || nextType,
                        config: {},
                      });
                    }}
                  >
                    {(NODE_CATALOG[selectedNode.category] || []).map((opt) => (
                      <option key={opt.type} value={opt.type}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label className="label" htmlFor="node-label">
                    Display Label
                  </label>
                  <input
                    id="node-label"
                    type="text"
                    className="input"
                    value={selectedNode.label || ''}
                    onChange={(e) => updateSelectedNode({ label: e.target.value })}
                  />
                </div>

                {/* Type-specific settings */}
                {selectedNode.type === 'keyword_received' && (
                  <div className="field">
                    <label className="label" htmlFor="node-keywords">
                      Trigger Keywords (comma-separated)
                    </label>
                    <input
                      id="node-keywords"
                      type="text"
                      className="input"
                      value={(selectedNode.config?.keywords || []).join(', ')}
                      onChange={(e) =>
                        updateSelectedNode({
                          config: {
                            keywords: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          },
                        })
                      }
                      placeholder="price, catalogue, saree, bridal"
                    />
                    <span className="field-hint">Case-insensitive substring match on inbound WhatsApp text.</span>
                  </div>
                )}

                {(selectedNode.type === 'tag_added' ||
                  selectedNode.type === 'has_tag' ||
                  selectedNode.type === 'add_tag') && (
                  <div className="field">
                    <label className="label" htmlFor="node-tag">
                      Select Customer Tag
                    </label>
                    <select
                      id="node-tag"
                      className="select"
                      value={selectedNode.config?.tagId || tags[0]?.id || 1}
                      onChange={(e) =>
                        updateSelectedNode({ config: { tagId: Number(e.target.value) } })
                      }
                    >
                      {tags.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(selectedNode.type === 'lead_status_is' ||
                  selectedNode.type === 'update_lead_status') && (
                  <div className="field">
                    <label className="label" htmlFor="node-lead-status">
                      Target Lead Stage
                    </label>
                    <select
                      id="node-lead-status"
                      className="select"
                      value={selectedNode.config?.status || 'qualified'}
                      onChange={(e) => updateSelectedNode({ config: { status: e.target.value } })}
                    >
                      <option value="new">New Lead</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="customer">Customer</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                )}

                {selectedNode.type === 'send_reply' && (
                  <div className="field">
                    <label className="label" htmlFor="node-reply-text">
                      Auto-Reply Message Text *
                    </label>
                    <textarea
                      id="node-reply-text"
                      className="textarea"
                      value={selectedNode.config?.text || ''}
                      onChange={(e) => updateSelectedNode({ config: { text: e.target.value } })}
                      placeholder="Namaste! Thank you for contacting us..."
                    />
                    <span className="field-hint">
                      Stored as Simulated in demo mode, or queued via WhatsApp Cloud API when configured.
                    </span>
                  </div>
                )}

                {selectedNode.type === 'create_follow_up' && (
                  <>
                    <div className="field">
                      <label className="label" htmlFor="node-fu-title">
                        Follow-up Task Title
                      </label>
                      <input
                        id="node-fu-title"
                        type="text"
                        className="input"
                        value={selectedNode.config?.title || ''}
                        onChange={(e) => updateSelectedNode({ config: { title: e.target.value } })}
                      />
                    </div>
                    <div className="field">
                      <label className="label" htmlFor="node-fu-delay">
                        Due In (Hours)
                      </label>
                      <input
                        id="node-fu-delay"
                        type="number"
                        min="1"
                        max="168"
                        className="input"
                        value={selectedNode.config?.delayHours || 4}
                        onChange={(e) =>
                          updateSelectedNode({ config: { delayHours: Number(e.target.value) } })
                        }
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'assign_member' && (
                  <div className="field">
                    <label className="label" htmlFor="node-assign">
                      Assign Conversation To
                    </label>
                    <select
                      id="node-assign"
                      className="select"
                      value={selectedNode.config?.userId || ''}
                      onChange={(e) =>
                        updateSelectedNode({
                          config: { userId: e.target.value ? Number(e.target.value) : null },
                        })
                      }
                    >
                      <option value="">Round-Robin Across Active Agents</option>
                      {team.map((m) => (
                        <option key={m.userId || m.id} value={m.userId || m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
