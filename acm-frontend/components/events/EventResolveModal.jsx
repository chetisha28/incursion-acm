'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  FileText,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatRange, formatTime, localInputToIso, toLocalInput } from '@/lib/dates';

export function EventResolveModal({ open, event, conflict, onClose, onResolve }) {
  const [targetStatus, setTargetStatus] = useState('PUBLISHED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [allowConflict, setAllowConflict] = useState(false);
  const [venue, setVenue] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSubmitting(false);
    setIsRescheduling(false);
    setAllowConflict(Boolean(conflict));

    if (event) {
      setTargetStatus(event.status === 'DRAFT' ? 'PUBLISHED' : event.status || 'PUBLISHED');
      setResolutionNotes(event.resolutionNotes || '');
      setVenue(event.venue || '');
      setStartsAt(event.startsAt ? toLocalInput(event.startsAt, event.timezone || 'UTC') : '');
      setEndsAt(event.endsAt ? toLocalInput(event.endsAt, event.timezone || 'UTC') : '');
    } else if (conflict) {
      setTargetStatus('PUBLISHED');
      setResolutionNotes('Approved with physical space partition / co-hosted coordination protocol.');
      setVenue(conflict.venue || '');
      setStartsAt(conflict.startsAt ? toLocalInput(conflict.startsAt, 'UTC') : '');
      setEndsAt(conflict.endsAt ? toLocalInput(conflict.endsAt, 'UTC') : '');
    }
  }, [open, event, conflict]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const eventId = event?.id || conflict?.eventId;
    if (!eventId) {
      setError('No target event specified for resolution.');
      return;
    }

    if (isRescheduling && startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setError('The scheduled end time must be later than the start time.');
      return;
    }

    const payload = {
      status: targetStatus,
      resolutionNotes: resolutionNotes.trim() || undefined,
      allowConflict
    };

    if (isRescheduling) {
      if (venue.trim()) payload.venue = venue.trim();
      if (startsAt) payload.startsAt = localInputToIso(startsAt, event?.timezone || 'UTC');
      if (endsAt) payload.endsAt = localInputToIso(endsAt, event?.timezone || 'UTC');
    }

    setSubmitting(true);
    try {
      await onResolve(eventId, payload);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to complete event resolution.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeEvent = event || (conflict ? { id: conflict.eventId, title: conflict.title, venue: conflict.venue, startsAt: conflict.startsAt, endsAt: conflict.endsAt, status: conflict.status || 'DRAFT' } : null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="OPERATIONS DESK // DECISION CONSOLE"
      title={conflict ? 'Resolve Concurrency Conflict' : 'Review & Resolve Event Status'}
      size="wide"
    >
      <form className="event-form" onSubmit={handleSubmit}>
        {/* Collision Context Banner if Conflict */}
        {conflict && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '14px 16px',
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              borderLeft: '3px solid var(--warning)',
              color: 'var(--warning-text)',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
              <strong style={{ fontSize: '13px' }}>
                Collision Case: {conflict.title} ↔ {conflict.conflictingTitle}
              </strong>
            </div>

            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              <strong>Flagged Overlaps:</strong> {(conflict.reasons || []).join('; ') || 'Overlapping timeslots and shared venue.'}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: '12px',
                alignItems: 'center',
                background: 'var(--bg-surface)',
                padding: '10px 12px',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <div>
                <span className="micro-label" style={{ color: 'var(--primary)' }}>EVENT A</span>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{conflict.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {formatDate(conflict.startsAt)} · {conflict.venue}
                </div>
              </div>
              <ArrowRightLeft size={14} style={{ color: 'var(--danger)' }} />
              <div>
                <span className="micro-label" style={{ color: 'var(--danger-text)' }}>EVENT B</span>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{conflict.conflictingTitle}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {formatDate(conflict.conflictingStartsAt || conflict.startsAt)} · {conflict.conflictingVenue || conflict.venue}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Target Event Summary */}
        {activeEvent && !conflict && (
          <div
            style={{
              padding: '14px 16px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="micro-label">TARGET SUBMISSION</span>
              <span className={`badge ${activeEvent.status === 'PUBLISHED' ? 'badge-primary' : 'badge-default'}`}>
                CURRENT: {activeEvent.status}
              </span>
            </div>
            <strong style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              {activeEvent.title}
            </strong>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span><CalendarClock size={12} style={{ display: 'inline', marginRight: '4px' }} />{formatDate(activeEvent.startsAt)} · {formatRange(activeEvent.startsAt, activeEvent.endsAt)}</span>
              <span><MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />{activeEvent.venue}</span>
            </div>
          </div>
        )}

        {/* Resolution Decision Options */}
        <div className="form-grid form-grid-two">
          <label className="field">
            <span>
              <CheckCircle2 size={13} /> Target Lifecycle Status <b>*</b>
            </span>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
            >
              <option value="PUBLISHED">Approve & Publish to Calendar</option>
              <option value="DRAFT">Return / Keep as Draft</option>
              <option value="CANCELLED">Reject / Cancel Event</option>
            </select>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
            <label className="check-field" style={{ marginTop: '16px' }}>
              <input
                type="checkbox"
                checked={allowConflict}
                onChange={(e) => setAllowConflict(e.target.checked)}
              />
              <span>
                <strong>Authorize Concurrency:</strong> Accept documented overlap without blocking
              </span>
            </label>

            <label className="check-field">
              <input
                type="checkbox"
                checked={isRescheduling}
                onChange={(e) => setIsRescheduling(e.target.checked)}
              />
              <span>
                <strong>Adjust Time/Venue:</strong> Modify timeslot or location during resolution
              </span>
            </label>
          </div>

          {/* Reschedule Fields if enabled */}
          {isRescheduling && (
            <>
              <label className="field">
                <span>Updated Venue</span>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Lab 304 or Partitioned Hall A"
                />
              </label>

              <label className="field">
                <span>Updated Start Time</span>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </label>

              <label className="field">
                <span>Updated End Time</span>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </label>
            </>
          )}

          {/* Resolution Notes */}
          <label className="field field-wide">
            <span>
              <FileText size={13} /> Official Resolution Notes & Rationale <b>*</b>
            </span>
            <textarea
              required
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Record the official administrative rationale (e.g. 'Committee approved', 'Main Hall partitioned with separate ingress', 'Rescheduled to avoid robotics clash')..."
            />
          </label>
        </div>

        {error && (
          <div className="form-error" role="alert" style={{ marginTop: '14px' }}>
            <AlertTriangle size={16} />
            <div>
              <strong>Resolution Incomplete</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="form-footer" style={{ marginTop: '18px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Resolution is recorded in the permanent chapter audit log with your Core member credentials.
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`button ${targetStatus === 'CANCELLED' ? 'button-danger' : 'button-primary'}`}
              disabled={submitting}
            >
              {submitting && <LoaderCircle className="spin" size={14} />}
              {submitting
                ? 'Resolving…'
                : targetStatus === 'PUBLISHED'
                ? 'Authorize & Publish'
                : targetStatus === 'CANCELLED'
                ? 'Reject & Cancel'
                : 'Save Resolution'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
