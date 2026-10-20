import { ArrowBigUp, CalendarClock, MapPin, ShieldCheck, Sparkles, ThumbsUp, UserCheck, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatLongDate, formatRange } from '@/lib/dates';

export function EventDetails({ event, role, userId, onClose, onUpvote, isUpvoting = false }) {
  if (!event) return null;
  const upvotesCount = event.upvotes?.length || 0;
  const hasUpvoted = Boolean(userId && event.upvotes?.some((u) => u.userId === userId));
  const isPeerVerified = upvotesCount >= 2;
  const canUpvote = Boolean(event.status === 'DRAFT' && (role === 'EXECUTIVE' || role === 'CORE' || role === 'ADMIN') && onUpvote);
  const upvoterNames = (event.upvotes || [])
    .map((u) => u.user?.name)
    .filter(Boolean);

  return (
    <Modal
      open={Boolean(event)}
      onClose={onClose}
      eyebrow={event.category}
      title={event.title}
      size="wide"
    >
      <div className="event-detail-content">
        <p className="event-detail-description">{event.description}</p>

        <div className="event-detail-facts">
          <div>
            <CalendarClock size={16} />
            <span>
              <small>WHEN</small>
              <strong>{formatLongDate(event.startsAt, event.timezone)}</strong>
              <em>{formatRange(event.startsAt, event.endsAt, event.timezone)} · {event.timezone}</em>
            </span>
          </div>

          <div>
            <MapPin size={16} />
            <span>
              <small>WHERE</small>
              <strong>{event.venue}</strong>
              <em>Organized by {event.organizer}</em>
            </span>
          </div>

          <div>
            <Users size={16} />
            <span>
              <small>WHO IT’S FOR</small>
              <strong>{event.expectedAudience}</strong>
              {event.campusRelevant && <em>Marked as campus-wide relevant</em>}
            </span>
          </div>

          <div>
            <ShieldCheck size={16} />
            <span>
              <small>CHAPTER STATUS</small>
              <strong>{event.status || 'PUBLISHED'}</strong>
              {event.createdBy && (
                <em>Submitted by {event.createdBy.name} ({event.createdBy.role})</em>
              )}
              {event.resolutionNotes && (
                <em style={{ color: 'var(--primary)', marginTop: '2px', display: 'block' }}>
                  Resolution: {event.resolutionNotes}
                </em>
              )}
            </span>
          </div>

          {/* Upvotes & Verification Endorsement Details (Requirement 3) */}
          <div>
            <ThumbsUp size={16} />
            <span>
              <small>PEER VERIFICATION & ENDORSEMENTS</small>
              <strong>
                {upvotesCount} Executive Upvote{upvotesCount === 1 ? '' : 's'}
                {isPeerVerified && (
                  <span
                    className="badge badge-success"
                    style={{ marginLeft: '8px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                  >
                    <Sparkles size={10} /> PEER VERIFIED
                  </span>
                )}
              </strong>
              {upvoterNames.length > 0 ? (
                <em>Endorsed by: {upvoterNames.join(', ')}</em>
              ) : (
                <em>Awaiting chapter executive verifications</em>
              )}
            </span>
          </div>
        </div>

        {/* Upvote action in modal footer if awaiting review */}
        {canUpvote && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {hasUpvoted
                ? 'You have verified this event proposal.'
                : 'Do you believe this event is legitimate and expected to take place?'}
            </span>
            <button
              type="button"
              className={`button ${hasUpvoted ? 'button-secondary' : 'button-primary'} button-compact`}
              disabled={isUpvoting}
              onClick={() => {
                if (!isUpvoting) onUpvote(event);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: isUpvoting ? 0.7 : 1 }}
            >
              <ArrowBigUp size={15} fill={hasUpvoted ? 'currentColor' : 'none'} />
              <span>{isUpvoting ? 'Updating…' : hasUpvoted ? `Upvoted (${upvotesCount}) · Remove Vote` : `Upvote Proposal (${upvotesCount})`}</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
