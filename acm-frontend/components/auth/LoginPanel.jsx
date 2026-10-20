'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowUpRight, CalendarCheck, CircleDollarSign, Eye, EyeOff,
  KeyRound, LoaderCircle, ShieldCheck, ShieldAlert, Sparkles, Zap
} from 'lucide-react';
import { AcmLogo } from '@/components/branding/AcmLogo';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const FEATURES = [
  {
    icon: CalendarCheck,
    title: 'Collision Detection Matrix',
    description: 'Automated temporal & venue collision checking across all campus events.',
  },
  {
    icon: CircleDollarSign,
    title: 'Double-Entry Ledger',
    description: 'Track semester budget allocations, category caps, and expenditure vouchers.',
  },
  {
    icon: ShieldAlert,
    title: 'Operational Governance',
    description: 'Role-tiered access control for Executive officers and Core administrators.',
  },
];

export function LoginPanel() {
  const [kind, setKind] = useState('executive');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [returnPath, setReturnPath] = useState('/');
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'core') setKind('core');
    const next = params.get('next');
    if (next?.startsWith('/') && !next.startsWith('//')) setReturnPath(next);
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace((user.role === 'CORE' || user.role === 'ADMIN') ? '/core/dashboard' : returnPath);
  }, [loading, user, returnPath, router]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const signedIn = await login(kind, { email: email.trim(), password });
      toast(`Welcome back, ${signedIn.name}.`);
      router.replace((signedIn.role === 'CORE' || signedIn.role === 'ADMIN') ? '/core/dashboard' : returnPath);
    } catch (loginError) {
      setError(
        loginError?.status === 401
          ? 'That email and password combination was not recognized for this role.'
          : loginError.message || 'Sign-in could not be completed.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (roleKind) => {
    setKind(roleKind);
    setError('');
    if (roleKind === 'core') {
      setEmail('core@acm.org');
      setPassword('CorePassword123!');
    } else {
      setEmail('executive@acm.org');
      setPassword('ExecutivePassword123!');
    }
  };

  return (
    <main className="login-page">
      <header className="login-topbar page-shell">
        <AcmLogo />
        <Link href="/" className="login-back">
          <ArrowLeft size={13} /> Back to Public Events
        </Link>
      </header>

      <div className="login-layout page-shell">
        {/* ── Left Aside ── */}
        <div className="login-aside">
          <p className="section-kicker">
            <KeyRound size={12} />
            ACM CHAPTER // ACCESS CONTROL
          </p>
          <h1>
            Chapter operations,<br /><em>conflict-aware.</em>
          </h1>
          <p>
            Authenticate to coordinate university workshops, analyze physical venue concurrency, and audit chapter semester expenditures.
          </p>

          <div className="login-features">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="login-feature">
                <div className="login-feature-icon">
                  <Icon size={14} />
                </div>
                <div className="login-feature-text">
                  <strong>{title}</strong>
                  <span>{description}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="login-aside-stamp">
            <span>SEC. 01</span>
            <span>ASSOCIATION FOR COMPUTING MACHINERY<br />CHAPTER OPERATIONS CONSOLE</span>
            <ShieldCheck size={18} />
          </div>
        </div>

        {/* ── Auth Card ── */}
        <section className="login-card" aria-labelledby="login-heading">
          <div className="login-mode-tabs" role="tablist" aria-label="Choose sign-in access">
            <button
              role="tab"
              type="button"
              id="tab-executive"
              aria-selected={kind === 'executive'}
              aria-controls="panel-executive"
              className={kind === 'executive' ? 'login-mode-active' : ''}
              onClick={() => { setKind('executive'); setError(''); }}
            >
              [ EXECUTIVE DESK ]
            </button>
            <button
              role="tab"
              type="button"
              id="tab-core"
              aria-selected={kind === 'core'}
              aria-controls="panel-core"
              className={kind === 'core' ? 'login-mode-active' : ''}
              onClick={() => { setKind('core'); setError(''); }}
            >
              [ CORE ADMINISTRATOR ]
            </button>
          </div>

          <div className="login-card-heading">
            <span className="micro-label">
              <Zap size={11} />
              {kind === 'core' ? 'ROLE: CORE ADMINISTRATOR' : 'ROLE: EXECUTIVE OFFICER'}
            </span>
            <h2 id="login-heading">
              {kind === 'core' ? 'Chapter Management Console' : 'Event Submission Portal'}
            </h2>
            <p>
              {kind === 'core'
                ? 'Review draft submissions, resolve scheduling concurrency conflicts, and oversee fiscal expenditures.'
                : 'Propose new campus technical sessions for conflict scanning and log expense claims.'}
            </p>
          </div>

          <form
            id={kind === 'core' ? 'panel-core' : 'panel-executive'}
            onSubmit={submit}
            className="login-form"
          >
            <label className="field">
              <span>Member Email Address</span>
              <input
                autoComplete="username"
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={kind === 'core' ? 'core@acm.org' : 'executive@acm.org'}
              />
            </label>

            <label className="field">
              <span>Security Password</span>
              <span className="password-input">
                <input
                  autoComplete="current-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter credential password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </span>
            </label>

            {error && (
              <p className="login-error" role="alert">
                <ShieldAlert size={14} />
                {error}
              </p>
            )}

            <button
              id={`login-submit-${kind}`}
              className="button button-primary login-submit button-lg"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderCircle className="spin" size={15} /> Authenticating…
                </>
              ) : (
                <>
                  Sign In to Desk <ArrowUpRight size={14} />
                </>
              )}
            </button>

            <button
              type="button"
              className="demo-fill-btn"
              id={`demo-fill-${kind}`}
              onClick={() => fillDemo(kind)}
            >
              <Sparkles size={12} />
              Fill {kind === 'core' ? 'Core Admin' : 'Executive'} Demo Credentials
            </button>
          </form>

          <p className="login-footnote">
            <ShieldCheck size={13} />
            Authenticated via ACM Core Cryptographic Session Tokens.
          </p>
        </section>
      </div>

      <footer className="login-page-footer page-shell">
        <span>ASSOCIATION FOR COMPUTING MACHINERY // OPERATIONS DESK</span>
        <span>CONFLICT-AWARE CAMPUS EVENT &amp; FINANCIAL ENGINE</span>
      </footer>
    </main>
  );
}
