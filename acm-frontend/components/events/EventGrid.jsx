import { EventCard } from './EventCard';

export function EventGrid({ events, role, onOpen, onEdit, onArchive }) {
  return <div className="event-list" aria-live="polite">{events.map((event, index) => <EventCard key={event.id} event={event} role={role} index={index} onOpen={onOpen} onEdit={onEdit} onArchive={onArchive} />)}</div>;
}
