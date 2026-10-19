'use client';

import { AlertTriangle, ArrowRightLeft, CalendarClock, CheckCircle2, MapPin } from 'lucide-react';
import { formatDate, formatRange } from '@/lib/dates';

export function ConflictCenter({ conflicts = [], role, onEditEvent }) {
  if (!conflicts.length) {
    return (
      <div className="state-panel state-empty" style={{ borderLeft: '3px solid var(--success)' }}>
        <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
        <span className="badge badge-success" style={{ marginTop: '12px' }}>CALENDAR SYNCHRONIZED</span>
        <h3>Zero Scheduling Conflicts Detected</h3>
        <p>All approved and proposed chapter events have clear, non-overlapping timeslots and venues across the campus.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Alert Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '12px 18px',
          background: 'var(--warning-bg)',
          border: '1px solid var(--warning-border)',
          borderLeft: '3px solid var(--warning)',
          color: 'var(--warning-text)'
        }}
      >
        <AlertTriangle size={20} style={{ flexShrink: 0, color: 'var(--warning)' }} />
        <div>
          <strong style={{ fontSize: '13px', display: 'block', letterSpacing: '-0.01em' }}>
            {conflicts.length} Potential Scheduling Collision{conflicts.length > 1 ? 's' : ''} Detected
          </strong>
          <span style={{ fontSize: '12px', opacity: 0.9 }}>
            ACM’s automated engine flags overlapping timeslots, shared venues, and target audience clashes to prevent campus turnout division.
          </span>
        </div>
      </div>

      {/* Conflicts Comparison Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {conflicts.map((conflict, index) => (
          <div
            key={`${conflict.eventId}-${conflict.conflictingEventId}-${index}`}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '3px solid var(--danger)',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Header / Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-danger">
                  <AlertTriangle size={11} /> COLLISION DETECTED
                </span>
                <span className="micro-label">CASE REF #{index + 1}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(conflict.reasons || []).map((reason, rIdx) => (
                  <span key={rIdx} className="badge badge-warning">
                    {reason}
                  </span>
                ))}
              </div>
            </div>

            {/* Side-by-Side Comparison */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: '16px',
                alignItems: 'center',
                background: 'var(--bg-subtle)',
                padding: '14px 16px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {/* Event A */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="micro-label" style={{ color: 'var(--primary)' }}>EVENT A (PROPOSED)</span>
                <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  {conflict.title}
                </strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <CalendarClock size={12} style={{ color: 'var(--primary)' }} />
                  <span className="tnum">{formatDate(conflict.startsAt)} · {formatRange(conflict.startsAt, conflict.endsAt)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <MapPin size={12} />
                  <span>{conflict.venue}</span>
                </div>
              </div>

              {/* Intersect Icon */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--danger)'
                }}
              >
                <ArrowRightLeft size={14} />
              </div>

              {/* Event B */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="micro-label" style={{ color: 'var(--danger-text)' }}>EVENT B (CONFLICTING)</span>
                <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  {conflict.conflictingTitle}
                </strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <CalendarClock size={12} style={{ color: 'var(--danger)' }} />
                  <span className="tnum">{formatDate(conflict.startsAt)} · {formatRange(conflict.startsAt, conflict.endsAt)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <MapPin size={12} />
                  <span>{conflict.venue}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <span className="micro-label">
                {role === 'CORE'
                  ? 'CORE DESK: MODIFY TIMESLOT OR VENUE TO RESOLVE CONCURRENCY'
                  : 'CONTACT CORE DESK TO ADJUST PROPOSED SCHEDULE'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {role === 'CORE' && (
                  <button
                    type="button"
                    className="button button-danger button-compact"
                    onClick={() => onEditEvent?.({ id: conflict.eventId, title: conflict.title })}
                  >
                    Reschedule Event
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
