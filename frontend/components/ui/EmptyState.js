'use client';

import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div
      style={{
        padding: '44px 24px',
        textAlign: 'center',
        display: 'grid',
        justifyItems: 'center',
        gap: 12,
        maxWidth: 440,
        marginInline: 'auto',
      }}
    >
      <span className="icon-tile tile-green">
        <Icon size={24} />
      </span>
      <h3 style={{ fontSize: '1.08rem', fontWeight: 700 }}>{title}</h3>
      {description && <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{description}</p>}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}
