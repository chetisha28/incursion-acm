'use client';

import { ArrowUpRight, MapPin } from 'lucide-react';
import { dateStamp, formatLongDate, formatRange } from '@/lib/dates';
import { EventActions } from './EventActions';

export function EventCard({ event, role, onOpen, onEdit, onArchive, index = 0 }) {
  const stamp = dateStamp(event.startsAt, event.timezone);
  return (
    <article className={`event-card event-card-${index % 4}`}>
      <button className="event-card-main" type="button" onClick={() => onOpen?.(event)} aria-label={`View ${event.title}`}>
        <span className="event-date-block"><strong>{stamp.day}</strong><small>{stamp.month}</small></span>
        <span className="event-card-content">
          <span className="event-card-topline"><span className="event-category">{event.category}</span><span className="event-card-date">{formatLongDate(event.startsAt, event.timezone)}</span></span>
          <span className="event-card-title">{event.title}</span>
          <span className="event-card-meta"><span>{formatRange(event.startsAt, event.endsAt, event.timezone)}</span><span className="meta-dot">/</span><span><MapPin size={13} aria-hidden="true" />{event.venue}</span></span>
          <span className="event-card-organizer">Hosted by {event.organizer}</span>
        </span>
        <span className="event-card-open" aria-hidden="true"><ArrowUpRight size={18} /></span>
      </button>
      <EventActions event={event} role={role} onEdit={onEdit} onArchive={onArchive} />
    </article>
  );
}
