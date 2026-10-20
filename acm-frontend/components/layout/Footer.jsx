'use client';

import { ArrowUpRight } from 'lucide-react';
import { AcmLogo } from '@/components/branding/AcmLogo';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner page-shell">
        <AcmLogo />
        <span className="footer-colophon">
          ASSOCIATION FOR COMPUTING MACHINERY · CAMPUS OPERATIONS · EST. 1947
        </span>
        <div className="footer-links">
          <a href="#events">Registry Index</a>
          <a href="/core/dashboard">Operations Desk</a>
          <a href="#top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            Back to Top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
