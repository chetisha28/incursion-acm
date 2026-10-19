import { MapPin, Users, CalendarClock, ShieldCheck, Tag } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatLongDate, formatRange } from '@/lib/dates';

export function EventDetails({ event, onClose }) {
  if (!event) return null;
  return (
    <Modal open={Boolean(event)} onClose={onClose} eyebrow={event.category} title={event.title} size="wide">
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
              {event.resolutionNotes ? (
                <em>Resolution: {event.resolutionNotes}</em>
              ) : (
                <em>Registered in chapter calendar</em>
              )}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
