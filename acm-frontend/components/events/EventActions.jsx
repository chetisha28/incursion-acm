'use client';

import { Archive, Pencil, ShieldCheck } from 'lucide-react';

export function EventActions({ event, role, onEdit, onArchive, onResolve }) {
  if (role !== 'CORE') return null;
  return (
    <div className="event-actions" aria-label={`Actions for ${event.title}`}>
      {event.status === 'DRAFT' && onResolve && (
        <button
          type="button"
          onClick={() => onResolve?.(event)}
          style={{ color: 'var(--primary)', fontWeight: 600 }}
        >
          <ShieldCheck size={13} aria-hidden="true" /> Resolve
        </button>
      )}
      <button type="button" onClick={() => onEdit?.(event)}>
        <Pencil size={13} aria-hidden="true" /> Edit
      </button>
      <button type="button" onClick={() => onArchive?.(event)}>
        <Archive size={13} aria-hidden="true" /> Archive
      </button>
    </div>
  );
}
