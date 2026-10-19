'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/ui/LoadingState';

export function ProtectedRoute({ roles = ['CORE', 'EXECUTIVE'], role, children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = roles ? (Array.isArray(roles) ? roles : [roles]) : (role ? [role] : ['CORE', 'EXECUTIVE']);

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?mode=core&next=/core/dashboard`);
  }, [loading, user, router]);

  if (loading) return <main className="protected-loading page-shell"><LoadingState label="Restoring your session" rows={2} /></main>;
  if (!user) return <main className="protected-loading page-shell"><p>Taking you to sign in…</p></main>;
  if (!allowed.includes(user.role)) {
    return (
      <main className="access-denied page-shell">
        <span className="micro-label">ACCESS / RESTRICTED</span>
        <h1>Access <em>restricted.</em></h1>
        <p>Your role ({user.role}) doesn’t have access to this section.</p>
        <Link className="button button-secondary" href="/">Return to public events</Link>
      </main>
    );
  }
  return children;
}

