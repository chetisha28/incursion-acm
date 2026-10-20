import { EventCard } from './EventCard';

export function EventGrid({
  events,
  role,
  userId,
  onOpen,
  onEdit,
  onArchive,
  onResolve,
  onUpvote,
  upvotingId
}) {
  return (
    <div className="event-list" aria-live="polite">
      {events.map((event, index) => (
        <EventCard
          key={event.id}
          event={event}
          role={role}
          userId={userId}
          index={index}
          onOpen={onOpen}
          onEdit={onEdit}
          onArchive={onArchive}
          onResolve={onResolve}
          onUpvote={onUpvote}
          isUpvoting={upvotingId === event.id}
        />
      ))}
    </div>
  );
}
