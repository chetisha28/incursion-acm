'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, CalendarDays, LogOut, Menu, X } from 'lucide-react';
import { AcmLogo } from '@/components/branding/AcmLogo';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function Navbar({ activeSection = 'all', onSectionNavigate }) {
  const [open, setOpen] = useState(false);
  const { user, role, logout } = useAuth();
  const toast = useToast();

  const go = (key) => {
    setOpen(false);
    onSectionNavigate?.(key);
  };

  const signOut = async () => {
    try { await logout(); toast('You have signed out.'); }
    catch { toast('Could not revoke your session. Check the connection and try again.', 'error'); }
    setOpen(false);
  };

  return (
    <header className="site-header">
      <div className="nav-inner page-shell">
        <AcmLogo compact />
        <button className="nav-menu-toggle" type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav id="primary-navigation" className={`primary-nav${open ? ' primary-nav-open' : ''}`} aria-label="Main navigation">
          <button type="button" className={`nav-link${activeSection === 'all' ? ' nav-link-active' : ''}`} aria-current={activeSection === 'all' ? 'page' : undefined} onClick={() => go('all')}>Events</button>
          <button type="button" className={`nav-link${activeSection === 'calendar' ? ' nav-link-active' : ''}`} aria-current={activeSection === 'calendar' ? 'page' : undefined} onClick={() => go('calendar')}><CalendarDays size={14} aria-hidden="true" /> Calendar</button>
          <button type="button" className={`nav-link${activeSection === 'past' ? ' nav-link-active' : ''}`} aria-current={activeSection === 'past' ? 'page' : undefined} onClick={() => go('past')}>Past events</button>
          <span className="nav-divider" aria-hidden="true" />
          {role === 'CORE' && <Link className="nav-dashboard-link" href="/core/dashboard" onClick={() => setOpen(false)}>Core desk <ArrowUpRight size={14} aria-hidden="true" /></Link>}
          {user ? (
            <div className="nav-account">
              <span className="nav-user"><span className="nav-user-dot" />{user.name}<small>{role === 'CORE' ? 'CORE' : 'EXECUTIVE'}</small></span>
              <button type="button" className="nav-login-link" onClick={signOut} aria-label="Sign out"><LogOut size={15} aria-hidden="true" /><span>Sign out</span></button>
            </div>
          ) : <Link className="nav-login-link" href="/login" onClick={() => setOpen(false)}>Sign in <ArrowUpRight size={15} aria-hidden="true" /></Link>}
        </nav>
      </div>
    </header>
  );
}
