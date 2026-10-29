'use client';

import {
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  FlaskConical,
  Send,
  XCircle,
} from 'lucide-react';

const LEAD_STATUS_MAP = {
  new: { label: 'New Lead', cls: 'badge-blue' },
  contacted: { label: 'Contacted', cls: 'badge-yellow' },
  qualified: { label: 'Qualified', cls: 'badge-purple' },
  customer: { label: 'Customer', cls: 'badge-green' },
  lost: { label: 'Lost', cls: 'badge-coral' },
};

const CONV_STATUS_MAP = {
  open: { label: 'Open', cls: 'badge-green' },
  pending: { label: 'Pending', cls: 'badge-yellow' },
  resolved: { label: 'Resolved', cls: '' },
};

const CAMPAIGN_STATUS_MAP = {
  draft: { label: 'Draft', cls: '' },
  scheduled: { label: 'Scheduled', cls: 'badge-blue' },
  sending: { label: 'Sending', cls: 'badge-purple' },
  completed: { label: 'Completed', cls: 'badge-green' },
  failed: { label: 'Failed', cls: 'badge-coral' },
  cancelled: { label: 'Cancelled', cls: 'badge-yellow' },
};

const WORKFLOW_STATUS_MAP = {
  draft: { label: 'Draft', cls: '' },
  published: { label: 'Published', cls: 'badge-green' },
  paused: { label: 'Paused', cls: 'badge-yellow' },
};

export function LeadStatusBadge({ status }) {
  const item = LEAD_STATUS_MAP[status] || { label: status || 'Unknown', cls: '' };
  return <span className={`badge ${item.cls}`}>{item.label}</span>;
}

export function ConversationStatusBadge({ status }) {
  const item = CONV_STATUS_MAP[status] || { label: status || 'Open', cls: '' };
  return <span className={`badge ${item.cls}`}>{item.label}</span>;
}

export function CampaignStatusBadge({ status }) {
  const item = CAMPAIGN_STATUS_MAP[status] || { label: status || 'Draft', cls: '' };
  return <span className={`badge ${item.cls}`}>{item.label}</span>;
}

export function WorkflowStatusBadge({ status }) {
  const item = WORKFLOW_STATUS_MAP[status] || { label: status || 'Draft', cls: '' };
  return <span className={`badge ${item.cls}`}>{item.label}</span>;
}

export function MessageStatusIndicator({ status }) {
  switch (status) {
    case 'simulated':
      return (
        <span
          className="badge badge-demo"
          title="Stored locally in demo mode — WhatsApp Cloud API not configured so this message was not sent over WhatsApp."
          style={{ padding: '1px 7px', fontSize: '0.68rem' }}
        >
          <FlaskConical size={11} />
          Simulated (demo)
        </span>
      );
    case 'queued':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <Clock size={12} /> Queued
        </span>
      );
    case 'accepted':
    case 'sent':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <Check size={13} /> Sent
        </span>
      );
    case 'delivered':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <CheckCheck size={13} /> Delivered
        </span>
      );
    case 'read':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#0284c7', fontWeight: 700 }}>
          <CheckCheck size={13} /> Read
        </span>
      );
    case 'failed':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--danger)', fontWeight: 700 }}>
          <XCircle size={12} /> Failed
        </span>
      );
    case 'received':
      return <span>Received</span>;
    default:
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <Send size={11} /> {status || 'Sent'}
        </span>
      );
  }
}

export default LeadStatusBadge;
