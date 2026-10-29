'use client';

import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm action',
  description = 'Are you sure you want to proceed?',
  confirmLabel = 'Delete',
  loading = false,
  danger = true,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={
              danger
                ? { background: 'var(--danger)', color: '#fff' }
                : { background: 'var(--green)', color: '#04261b' }
            }
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : null}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <span className={`icon-tile ${danger ? 'tile-coral' : 'tile-yellow'}`}>
          <AlertTriangle size={22} />
        </span>
        <div style={{ display: 'grid', gap: 6 }}>
          <p style={{ fontSize: '0.94rem', color: 'var(--text-2)' }}>{description}</p>
        </div>
      </div>
    </Modal>
  );
}
