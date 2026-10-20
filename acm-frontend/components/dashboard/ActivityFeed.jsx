import { ArrowUpRight, CalendarDays, CircleDollarSign } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/dates';

const actionNames = {
  EVENT_CREATED: 'added an event', EVENT_UPDATED: 'updated an event', EVENT_ARCHIVED: 'archived an event',
  EXPENSE_CREATED: 'submitted an expense', EXPENSE_UPDATED: 'updated an expense', EXPENSE_ARCHIVED: 'archived an expense'
};

export function ActivityFeed({ entries = [] }) {
  if (!entries.length) return <div className="dashboard-quiet"><span className="quiet-mark">—</span><p>Recent event and expense activity will appear here.</p></div>;
  return <ol className="activity-feed">{entries.map((entry) => {
    const expense = entry.entityType === 'Expense';
    return <li className="activity-item" key={entry.id}>
      <span className={`activity-icon${expense ? ' activity-icon-expense' : ''}`}>{expense ? <CircleDollarSign size={15} /> : <CalendarDays size={15} />}</span>
      <div className="activity-copy"><p><strong>{entry.actor?.name || 'A chapter member'}</strong> {actionNames[entry.action] || entry.action.toLowerCase().replaceAll('_', ' ')}{entry.metadata?.title ? <>: <strong>{entry.metadata.title}</strong></> : null}</p><small>{formatDate(entry.createdAt)} · {formatTime(entry.createdAt)}</small></div>
      <ArrowUpRight size={14} aria-hidden="true" />
    </li>;
  })}</ol>;
}
