'use client';

import { Archive, Pencil } from 'lucide-react';

export function EventActions({ event, role, onEdit, onArchive }) {
  if (role !== 'CORE') return null;
  return (
    <div className="event-actions" aria-label={`Actions for ${event.title}`}>
      <button type="button" onClick={() => onEdit?.(event)}><Pencil size={13} aria-hidden="true" /> Edit</button>
      <button type="button" onClick={() => onArchive?.(event)}><Archive size={13} aria-hidden="true" /> Archive</button>
    </div>
  );
}
