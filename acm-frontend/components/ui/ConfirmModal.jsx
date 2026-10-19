'use client';

import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { Modal } from './Modal';

export function ConfirmModal({
  open,
  title = 'Confirm Destructive Action',
  message,
  confirmLabel = 'Confirm Archive',
  confirmTone = 'danger',
  confirming = false,
  onClose,
  onConfirm
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="AUDIT DESK // VERIFICATION"
      title={title}
      size="normal"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '4px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderLeft: '3px solid var(--danger)',
            padding: '12px 14px',
            color: 'var(--danger-text)'
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--danger)' }} />
          <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
            <p style={{ margin: 0, fontWeight: 500 }}>{message}</p>
          </div>
        </div>

        <div className="form-footer" style={{ marginTop: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            This action updates official chapter records.
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="button button-secondary button-compact"
              onClick={onClose}
              disabled={confirming}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`button button-${confirmTone} button-compact`}
              onClick={onConfirm}
              disabled={confirming}
            >
              {confirming && <LoaderCircle className="spin" size={13} />}
              {confirming ? 'Processing…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
