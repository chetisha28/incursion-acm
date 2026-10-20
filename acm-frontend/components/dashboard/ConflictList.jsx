import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { formatDate, formatRange } from '@/lib/dates';

export function ConflictList({ conflicts = [] }) {
  if (!conflicts.length) {
    return (
      <div className="ops-status-clear-banner" style={{ margin: '8px 0' }}>
        <span><strong>STATUS: NOMINAL.</strong> No scheduling collisions detected across active university venues.</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {conflicts.map((conflict) => (
        <article
          key={`${conflict.eventId}-${conflict.conflictingEventId}`}
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--danger-border)',
            borderLeft: '3px solid var(--danger)'
          }}
        >
          <div style={{ color: 'var(--danger)' }}>
            <AlertTriangle size={15} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="badge badge-danger" style={{ fontSize: '9px', padding: '1px 4px' }}>CONCURRENCY</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {conflict.title} <span style={{ color: 'var(--danger-text)' }}>↔</span> {conflict.conflictingTitle}
              </strong>
            </div>
            <span className="tnum" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {formatDate(conflict.startsAt)} · {formatRange(conflict.startsAt, conflict.endsAt)} · {conflict.venue}
            </span>
            <small style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {(conflict.reasons || []).join(' · ')}
            </small>
          </div>
          <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
        </article>
      ))}
    </div>
  );
}
