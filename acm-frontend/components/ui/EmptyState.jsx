import { CalendarDays } from 'lucide-react';

export function EmptyState({ title = 'No events found', message = 'There are no published events to show here yet.' }) {
  return <div className="state-panel state-empty"><CalendarDays size={20} aria-hidden="true" /><span className="state-index">THE CALENDAR IS QUIET</span><h3>{title}</h3><p>{message}</p></div>;
}
