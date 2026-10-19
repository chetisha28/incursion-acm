'use client';

import { useCallback, useState } from 'react';
import { IntroSequence } from '@/components/animation/IntroSequence';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { EventSection } from '@/components/events/EventSection';
import { useEvents } from '@/hooks/useEvents';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/dates';

export default function HomePage() {
  const [tab, setTab] = useState('all');
  const upcoming = useEvents('upcoming', {});
  const scrollToEvents = useCallback((nextTab) => {
    if (nextTab) setTab(nextTab);
    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
  const nextEvent = upcoming.items[0];

  return (
    <>
      <Navbar activeSection={tab} onSectionNavigate={scrollToEvents} />
      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-shell page-shell">
            <div className="hero-eyebrow"><span className="eyebrow-line" /> ACM STUDENT CHAPTER <span className="eyebrow-index">CAMPUS / EVENTS</span></div>
            <div className="hero-copy">
              <div className="hero-title-stack">
                <p className="hero-overline">A place for curious minds</p>
                <h1 id="hero-title">What’s happening<br /><em>at ACM?</em></h1>
                <p className="hero-description">Workshops, technical sessions, and campus events — all in one place.</p>
                <div className="hero-actions">
                  <button type="button" className="button button-primary" onClick={() => scrollToEvents('all')}>Explore events <ArrowDown size={16} aria-hidden="true" /></button>
                  <a className="text-link" href="#about">About the chapter <ArrowUpRight size={15} aria-hidden="true" /></a>
                </div>
              </div>
              <div className="hero-art" aria-label="Animated blue ribbons suggesting flowing wind" role="img">
                <IntroSequence />
                <div className="hero-art-caption"><span>Ideas in motion</span><span>Since 1968 / Here, now</span></div>
              </div>
            </div>
            <div className="hero-bottomline">
              <span>TECHNOLOGY / PEOPLE / POSSIBILITY</span>
              <a href="#events" onClick={(event) => { event.preventDefault(); scrollToEvents('all'); }}>SCROLL TO EXPLORE <ArrowDown size={13} aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <section className="next-event-band page-shell" aria-label="Next upcoming event">
          <div className="next-event-label"><span className="status-dot" /> NEXT ON THE CALENDAR</div>
          {upcoming.loading && <div className="next-event-content loading-shimmer" aria-label="Loading upcoming event" />}
          {!upcoming.loading && upcoming.error && <div className="next-event-content"><span className="muted-copy">The event calendar is temporarily unavailable.</span><button className="text-link" onClick={upcoming.retry} type="button">Try again</button></div>}
          {!upcoming.loading && !upcoming.error && nextEvent && (
            <a className="next-event-content" href="#events" onClick={(event) => { event.preventDefault(); scrollToEvents('all'); }}>
              <span className="next-event-date">{formatDate(nextEvent.startsAt, nextEvent.timezone)}</span>
              <span className="next-event-title">{nextEvent.title}</span>
              <span className="next-event-meta">{formatTime(nextEvent.startsAt, nextEvent.timezone)} · {nextEvent.venue}</span>
              <span className="next-event-arrow"><ArrowUpRight size={17} aria-hidden="true" /></span>
            </a>
          )}
          {!upcoming.loading && !upcoming.error && !nextEvent && <div className="next-event-content"><span className="muted-copy">Nothing scheduled just yet. Check back soon.</span></div>}
        </section>

        <EventSection activeTab={tab} onTabChange={setTab} />

        <section className="chapter-note page-shell" id="about">
          <div className="chapter-note-index">01 / THE CHAPTER</div>
          <div className="chapter-note-content">
            <h2>Computer science<br />is a <em>shared practice.</em></h2>
            <p>We make room for learning out loud: building things, asking better questions, and meeting the people who make computing feel less like a screen and more like a community.</p>
            <a className="text-link" href="#events" onClick={(event) => { event.preventDefault(); scrollToEvents('all'); }}>Find your next room <ArrowUpRight size={15} aria-hidden="true" /></a>
          </div>
          <div className="chapter-note-mark" aria-hidden="true"><span>ACM</span><i>◌</i><small>STUDENT CHAPTER</small></div>
        </section>
      </main>
      <Footer />
    </>
  );
}
