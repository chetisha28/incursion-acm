'use client';

import { useEffect, useState } from 'react';
import { WindSwirl } from './WindSwirl';

export function IntroSequence() {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alreadySeen = sessionStorage.getItem('acm.introSeen') === 'true';
    if (reduced || alreadySeen) { setSettled(true); return undefined; }
    const timer = window.setTimeout(() => {
      setSettled(true);
      sessionStorage.setItem('acm.introSeen', 'true');
    }, 3900);
    return () => window.clearTimeout(timer);
  }, []);

  const skip = () => {
    sessionStorage.setItem('acm.introSeen', 'true');
    setSettled(true);
  };

  return (
    <div className={`intro-art${settled ? ' intro-settled' : ''}`}>
      <WindSwirl />
      <div className="intro-art-mark" aria-hidden="true">
        <span className="intro-mark-letters">ACM</span>
        <span className="intro-mark-rule" />
        <span className="intro-mark-caption">IDEAS IN MOTION</span>
      </div>
      {!settled && <button className="skip-intro" type="button" onClick={skip}>Skip intro <span aria-hidden="true">↗</span></button>}
    </div>
  );
}
