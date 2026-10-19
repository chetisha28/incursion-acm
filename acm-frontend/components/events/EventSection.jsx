'use client';

import { useCallback, useMemo, useState } from 'react';
import { ArrowDown, Plus, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useEvents } from '@/hooks/useEvents';
import { api } from '@/lib/api';
import { EventTabs } from './EventTabs';
import { EventGrid } from './EventGrid';
import { EventFilters } from './EventFilters';
import { EventForm } from './EventForm';
import { EventDetails } from './EventDetails';
import { EventCalendar } from '@/components/calendar/EventCalendar';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';

export function EventSection({ activeTab, onTabChange }) {
  const [filters, setFilters] = useState({ category: '', search: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirming: false,
    onConfirm: null
  });

  const { user, role, token } = useAuth();
  const toast = useToast();
  const mode = activeTab === 'past' ? 'past' : 'list';
  const events = useEvents(mode, filters, token);
  const categories = useMemo(() => [...new Set(events.items.map((event) => event.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [events.items]);
  const changeFilters = useCallback((change) => setFilters((current) => ({ ...current, ...change })), []);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (event) => { setSelected(null); setEditing(event); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const saveEvent = async (payload) => {
    if (!token) throw new Error('Sign in to submit an event.');
    if (editing) await api.updateEvent(editing.id, payload, token);
    else await api.createEvent(payload, token);
    events.refresh();
    toast(role === 'EXECUTIVE' && !editing ? 'Your event was submitted as a draft for Core review.' : 'Event saved to the ACM calendar.');
  };

  const archive = (event) => {
    setConfirmModal({
      open: true,
      title: `Archive “${event.title}”?`,
      message: `The event will be marked cancelled and removed from the active calendar. Chapter archives and linked expense records will be preserved.`,
      confirming: false,
      onConfirm: async () => {
        setConfirmModal((curr) => ({ ...curr, confirming: true }));
        try {
          await api.archiveEvent(event.id, token);
          toast('Event archived and marked cancelled.');
          setSelected(null);
          events.refresh();
          setConfirmModal((curr) => ({ ...curr, open: false, confirming: false }));
        } catch (error) {
          toast(error.message, 'error');
          setConfirmModal((curr) => ({ ...curr, confirming: false }));
        }
      }
    });
  };

  return (
    <section className="events-section page-shell" id="events" aria-labelledby="events-heading">
      <div className="section-heading-row">
        <div><p className="section-kicker">THE ACM CALENDAR</p><h2 id="events-heading">Find your <em>next thing.</em></h2></div>
        <p className="section-aside">Good ideas don’t happen in a vacuum.<br />Start with a room and a time.</p>
      </div>
      <EventTabs active={activeTab} onChange={onTabChange} />
      <div id="event-tab-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="event-tab-panel" tabIndex="0">
        {activeTab === 'all' && <>
          <div className="event-tools"><div className="event-list-intro"><span className="micro-label"><SlidersHorizontal size={13} /> UPCOMING / PUBLISHED</span><p>All times are shown in each event’s local timezone.</p></div><div className="event-tools-actions">{(role === 'EXECUTIVE' || role === 'CORE') && <button type="button" className="button button-primary button-compact" onClick={openCreate}><Plus size={15} /> {role === 'EXECUTIVE' ? 'Submit an event' : 'Create event'}</button>}</div></div>
          <EventFilters categories={categories} category={filters.category} search={filters.search} onChange={changeFilters} />
          {events.loading && events.items.length === 0 && <LoadingState label="Loading upcoming events" />}
          {events.error && <ErrorState message={events.error.message} onRetry={events.retry} />}
          {!events.loading && !events.error && events.items.length === 0 && <EmptyState title={filters.search || filters.category ? 'No matching events' : 'No upcoming events'} message={filters.search || filters.category ? 'Try another search or category.' : 'The next date is still being planned. Check back when the calendar moves.'} />}
          {events.items.length > 0 && <EventGrid events={events.items} role={role} onOpen={setSelected} onEdit={openEdit} onArchive={archive} />}
          {events.hasMore && <div className="load-more-row"><button type="button" className="button button-secondary" disabled={events.loading} onClick={events.loadMore}>{events.loading ? 'Loading…' : 'Load more events'} {!events.loading && <ArrowDown size={14} />}</button><span>Showing {events.items.length} of {events.pagination.total}</span></div>}
        </>}
        {activeTab === 'calendar' && <EventCalendar />}
        {activeTab === 'past' && <>
          <div className="past-intro"><span className="micro-label">THE ARCHIVE / COMPLETED</span><p>A record of the rooms we filled and the things we figured out together.</p></div>
          {events.loading && events.items.length === 0 && <LoadingState label="Loading past events" />}
          {events.error && <ErrorState title="The archive couldn’t load." message={events.error.message} onRetry={events.retry} />}
          {!events.loading && !events.error && events.items.length === 0 && <EmptyState title="The archive is empty" message="Completed public events will appear here." />}
          {events.items.length > 0 && <EventGrid events={events.items} role="VIEWER" onOpen={setSelected} />}
        </>}
      </div>
      <EventDetails event={selected} onClose={() => setSelected(null)} />
      <EventForm open={formOpen} event={editing} role={role} onClose={closeForm} onSave={saveEvent} />
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel="Archive Event"
        confirmTone="danger"
        confirming={confirmModal.confirming}
        onClose={() => setConfirmModal((curr) => ({ ...curr, open: false }))}
        onConfirm={confirmModal.onConfirm}
      />
      {user && <span className="visually-hidden" aria-live="polite">Signed in as {user.name}</span>}
    </section>
  );
}
