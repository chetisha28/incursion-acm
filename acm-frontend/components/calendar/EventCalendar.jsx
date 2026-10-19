'use client';

import dynamic from 'next/dynamic';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import listPlugin from '@fullcalendar/react/list';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Filter, Layers, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { EventDetails } from '@/components/events/EventDetails';

const FullCalendar = dynamic(() => import('@fullcalendar/react'), {
  ssr: false,
  loading: () => <LoadingState label="Initializing scheduling matrix" rows={4} />
});
const plugins = [dayGridPlugin, timeGridPlugin, listPlugin];

export function EventCalendar() {
  const [rawEvents, setRawEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const requestNumber = useRef(0);
  const requestController = useRef(null);
  const lastRange = useRef(null);

  const datesSet = useCallback(async (range) => {
    lastRange.current = range;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    const thisRequest = ++requestNumber.current;
    setLoading(true);
    setError(null);
    try {
      const endInclusive = new Date(range.end.valueOf() - 1);
      const response = await api.listEvents(
        { from: range.start.toISOString(), to: endInclusive.toISOString(), limit: 100, sortBy: 'startsAt', order: 'asc' },
        { signal: controller.signal }
      );
      if (thisRequest !== requestNumber.current) return;
      setRawEvents(response.data || []);
    } catch (requestError) {
      if (requestError.name !== 'AbortError' && thisRequest === requestNumber.current) setError(requestError);
    } finally {
      if (thisRequest === requestNumber.current) setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    if (lastRange.current) datesSet(lastRange.current);
  }, [datesSet]);

  useEffect(() => () => requestController.current?.abort(), []);

  // Detect overlapping timeslot & venue conflicts dynamically
  const conflictsMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < rawEvents.length; i++) {
      const a = rawEvents[i];
      const aStart = new Date(a.startsAt).getTime();
      const aEnd = new Date(a.endsAt).getTime();

      for (let j = i + 1; j < rawEvents.length; j++) {
        const b = rawEvents[j];
        const bStart = new Date(b.startsAt).getTime();
        const bEnd = new Date(b.endsAt).getTime();

        const timeOverlap = aStart < bEnd && aEnd > bStart;
        const venueClash = a.venue && b.venue && a.venue.trim().toLowerCase() === b.venue.trim().toLowerCase();

        if (timeOverlap && venueClash) {
          map.set(a.id, (map.get(a.id) || 0) + 1);
          map.set(b.id, (map.get(b.id) || 0) + 1);
        }
      }
    }
    return map;
  }, [rawEvents]);

  // Extract distinct categories
  const categories = useMemo(() => {
    const set = new Set();
    rawEvents.forEach((e) => { if (e.category) set.add(e.category); });
    return Array.from(set).sort();
  }, [rawEvents]);

  // Transform events for FullCalendar with category and conflict classes
  const formattedEvents = useMemo(() => {
    const filtered = selectedCategory === 'ALL'
      ? rawEvents
      : rawEvents.filter((e) => e.category === selectedCategory);

    return filtered.map((event) => {
      const isConflict = (conflictsMap.get(event.id) || 0) > 0;
      const catClass = `cal-cat-${(event.category || 'general').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const classes = [
        'calendar-event-item',
        catClass,
        isConflict ? 'calendar-event-conflict' : 'calendar-event-nominal'
      ];

      return {
        id: event.id,
        title: isConflict ? `[!] ${event.title}` : event.title,
        start: event.startsAt,
        end: event.endsAt,
        classNames: classes,
        extendedProps: {
          event,
          isConflict,
          venue: event.venue,
          category: event.category
        }
      };
    });
  }, [rawEvents, selectedCategory, conflictsMap]);

  const calendarOptions = useMemo(() => ({
    plugins,
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listMonth'
    },
    buttonText: { today: 'TODAY', month: 'MONTH', week: 'WEEK', list: 'AGENDA' },
    events: formattedEvents,
    datesSet,
    eventClick: (info) => {
      info.jsEvent.preventDefault();
      setSelected(info.event.extendedProps.event);
    },
    eventDisplay: 'block',
    dayMaxEvents: true,
    slotEventOverlap: false,
    height: 'auto',
    firstDay: 1,
    nowIndicator: true,
    eventTimeFormat: { hour: 'numeric', minute: '2-digit', meridiem: false, hour12: false },
    views: {
      listMonth: { noEventsContent: 'No published activities in this range.' }
    },
    contentHeight: 'auto'
  }), [formattedEvents, datesSet]);

  const totalConflictEvents = conflictsMap.size;

  return (
    <div className="calendar-wrap glassy-calendar">
      {/* ── Glassy Operations Header & Filter Strip ── */}
      <div className="calendar-ops-toolbar">
        <div className="calendar-ops-status">
          <span className="section-kicker">
            <CalendarDays size={12} /> SCHEDULING CONSOLE
          </span>
          <div className="calendar-stats-row">
            <span className="badge badge-default">
              {rawEvents.length} TOTAL SCHEDULED
            </span>
            {totalConflictEvents > 0 ? (
              <span className="badge badge-danger">
                <AlertTriangle size={10} /> {totalConflictEvents} VENUE CLASHES
              </span>
            ) : (
              <span className="badge badge-success">
                <CheckCircle2 size={10} /> 0 CONCURRENCY CLASHES
              </span>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="calendar-cat-filter" role="toolbar" aria-label="Filter events by category">
          <span className="micro-label"><Filter size={10} /> FILTER:</span>
          <button
            type="button"
            className={`calendar-cat-btn ${selectedCategory === 'ALL' ? 'calendar-cat-btn-active' : ''}`}
            onClick={() => setSelectedCategory('ALL')}
          >
            ALL
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`calendar-cat-btn ${selectedCategory === cat ? 'calendar-cat-btn-active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {error ? <ErrorState title="The scheduling matrix couldn’t load." message={error.message} onRetry={retry} /> : null}
      {loading && <div className="calendar-loading" role="status">Synchronizing date range…</div>}

      {/* ── FullCalendar Glassy Canvas ── */}
      <FullCalendar {...calendarOptions} />

      {/* ── Interactive Category Legend ── */}
      <div className="calendar-legend-bar">
        <span className="micro-label">CLASSIFICATION LEGEND:</span>
        <span className="legend-chip legend-chip-workshop"><i /> WORKSHOP (COBALT)</span>
        <span className="legend-chip legend-chip-hackathon"><i /> HACKATHON (AMBER)</span>
        <span className="legend-chip legend-chip-techtalk"><i /> TECH TALK (INK)</span>
        <span className="legend-chip legend-chip-conflict"><i /> CONFLICT RADAR (CRIMSON)</span>
      </div>

      <EventDetails event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
