'use client';

import { ArrowBigUp, ArrowUpRight, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react';
import { dateStamp, formatLongDate, formatRange } from '@/lib/dates';
import { EventActions } from './EventActions';

export function EventCard({
  event,
  role,
  userId,
  onOpen,
  onEdit,
  onArchive,
  onResolve,
  onUpvote,
  isUpvoting = false,
  index = 0
}) {
  const stamp = dateStamp(event.startsAt, event.timezone);
  const upvotesCount = event.upvotes?.length || 0;
  const hasUpvoted = Boolean(userId && event.upvotes?.some((u) => u.userId === userId));
  const isPeerVerified = upvotesCount >= 2;
  const canUpvote = Boolean(event.status === 'DRAFT' && (role === 'EXECUTIVE' || role === 'CORE' || role === 'ADMIN') && onUpvote);

  return (
    <article className={`event-card event-card-${index % 4}`}>
      <div
        className="event-card-main"
        role="button"
        tabIndex={0}
        onClick={() => onOpen?.(event)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen?.(event);
          }
        }}
        aria-label={`View ${event.title}`}
      >
        <span className="event-date-block">
          <strong>{stamp.day}</strong>
          <small>{stamp.month}</small>
        </span>
        <span className="event-card-content">
          <span className="event-card-topline">
            <span className="event-category">{event.category}</span>
            <span className="event-card-date">{formatLongDate(event.startsAt, event.timezone)}</span>
            {event.status === 'DRAFT' && (
              <span className="badge badge-warning" style={{ fontSize: '10px', padding: '2px 6px' }}>
                IN REVIEW
              </span>
            )}
            {isPeerVerified && (
              <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <Sparkles size={10} /> PEER VERIFIED
              </span>
            )}
          </span>
          <span className="event-card-title">{event.title}</span>
          <span className="event-card-meta">
            <span>{formatRange(event.startsAt, event.endsAt, event.timezone)}</span>
            <span className="meta-dot">/</span>
            <span>
              <MapPin size={13} aria-hidden="true" />
              {event.venue}
            </span>
          </span>
          <span className="event-card-organizer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              Hosted by {event.organizer}
              {event.createdBy && (
                <span style={{ opacity: 0.85, fontStyle: 'italic', display: 'block', fontSize: '11px', marginTop: '2px' }}>
                  Submitted by {event.createdBy.name}
                </span>
              )}
            </span>

            {/* Interactive Upvoting Button (Requirement 3 & Upvote Fix) */}
            {canUpvote && (
              <button
                type="button"
                className={`event-upvote-btn ${hasUpvoted ? 'event-upvote-btn-active' : ''} ${isUpvoting ? 'event-upvote-btn-loading' : ''}`}
                disabled={isUpvoting}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isUpvoting) onUpvote(event);
                }}
                title={isUpvoting ? 'Updating vote…' : hasUpvoted ? 'Remove your verification upvote' : 'Upvote to verify this proposal'}
                aria-label={hasUpvoted ? `Upvoted by you. Total: ${upvotesCount}` : `Upvote event. Total: ${upvotesCount}`}
                style={{ opacity: isUpvoting ? 0.6 : 1, cursor: isUpvoting ? 'wait' : 'pointer' }}
              >
                <ArrowBigUp size={14} fill={hasUpvoted ? 'currentColor' : 'none'} />
                <span>{upvotesCount}</span>
              </button>
            )}
          </span>
        </span>
        <span className="event-card-open" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>
      </div>

      <EventActions
        event={event}
        role={role}
        onEdit={onEdit}
        onArchive={onArchive}
        onResolve={onResolve}
      />
    </article>
  );
}
