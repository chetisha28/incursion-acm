'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowBigUp,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Calendar,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileSpreadsheet,
  FileText,
  IndianRupee,
  KeyRound,
  Layers,
  LayoutDashboard,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UsersRound,
  Wallet
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate, formatINR, formatRange, formatTime } from '@/lib/dates';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AcmLogo } from '@/components/branding/AcmLogo';
import { ConflictList } from './ConflictList';
import { ConflictCenter } from './ConflictCenter';
import { AnalyticsReports } from './AnalyticsReports';
import { ActivityFeed } from './ActivityFeed';
import { TeamManagement } from './TeamManagement';
import { WorkAssignments } from './WorkAssignments';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { EventForm } from '@/components/events/EventForm';
import { EventResolveModal } from '@/components/events/EventResolveModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { BudgetModal } from '@/components/budgets/BudgetModal';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

function DashboardContent() {
  const { user, token, logout } = useAuth();
  const toast = useToast();

  // Tab State: 'overview' | 'conflicts' | 'expenses' | 'analytics'
  const [activeTab, setActiveTab] = useState('overview');

  // Dashboard Data State
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Expenses & Events State
  const [expenses, setExpenses] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [agendaFilter, setAgendaFilter] = useState('ALL');

  // Team & Work Assignments State
  const [teamUsers, setTeamUsers] = useState([]);
  const [workAssignments, setWorkAssignments] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [workLoading, setWorkLoading] = useState(false);
  const [presetAssignee, setPresetAssignee] = useState(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [upvotingEventId, setUpvotingEventId] = useState(null);

  // Modal States
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [resolvingItem, setResolvingItem] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    confirmTone: 'danger',
    confirming: false,
    onConfirm: null
  });
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  // Load Dashboard Data
  const loadDashboard = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.coreDashboard(token, { signal });
      setDashboard(response.data);
      if (response.data?.teamMembers) setTeamUsers(response.data.teamMembers);
      if (response.data?.workAssignments) setWorkAssignments(response.data.workAssignments);
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [token]);

  // Load Expenses & Events for Dropdown
  const loadExpensesAndEvents = useCallback(async (signal) => {
    if (!token) return;
    setExpensesLoading(true);
    try {
      const [expRes, evRes] = await Promise.all([
        api.listExpenses({ limit: 50 }, token, { signal }),
        api.listEvents({ limit: 100, status: 'ALL' }, token, { signal })
      ]);
      setExpenses(expRes.data || []);
      setEventsList(evRes.data || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Could not load expenses list:', err);
      }
    } finally {
      if (!signal?.aborted) setExpensesLoading(false);
    }
  }, [token]);

  // Load Team Users and Work Assignments
  const loadTeamAndWork = useCallback(async (signal) => {
    if (!token) return;
    setTeamLoading(true);
    setWorkLoading(true);
    try {
      const [userRes, workRes] = await Promise.all([
        api.listUsers({ limit: 100 }, token, { signal }),
        api.listWorkAssignments({ limit: 100 }, token, { signal })
      ]);
      setTeamUsers(userRes.data || []);
      setWorkAssignments(workRes.data || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Could not load team / work assignments:', err);
      }
    } finally {
      if (!signal?.aborted) {
        setTeamLoading(false);
        setWorkLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboard(controller.signal);
    loadExpensesAndEvents(controller.signal);
    loadTeamAndWork(controller.signal);
    return () => controller.abort();
  }, [loadDashboard, loadExpensesAndEvents, loadTeamAndWork, refreshKey]);

  // Upvote Handler with optimistic update and concurrency lock
  const handleUpvoteEvent = async (event) => {
    if (!token) return;
    if (upvotingEventId === event.id) return;
    setUpvotingEventId(event.id);
    try {
      const res = await api.upvoteEvent(event.id, token);
      const newUpvotes = res.data.upvotes || [];
      // Optimistic update in eventsList
      setEventsList((curr) =>
        curr.map((e) => (e.id === event.id ? { ...e, upvotes: newUpvotes } : e))
      );
      // Optimistic update in dashboard eventsUnderReview
      setDashboard((curr) => {
        if (!curr) return curr;
        return {
          ...curr,
          eventsUnderReview: (curr.eventsUnderReview || []).map((e) =>
            e.id === event.id ? { ...e, upvotes: newUpvotes } : e
          )
        };
      });
      toast(
        res.data.upvoted
          ? `Endorsed “${event.title}” (${res.data.upvoteCount} upvotes).`
          : `Removed endorsement for “${event.title}”.`
      );
    } catch (err) {
      toast(err.message || 'Could not update verification upvote.', 'error');
    } finally {
      setUpvotingEventId(null);
    }
  };

  const refreshAll = () => setRefreshKey((k) => k + 1);

  // Sign out
  const signOut = async () => {
    try {
      await logout();
      window.location.assign('/');
    } catch (logoutError) {
      toast(logoutError.message || 'Could not revoke your session.', 'error');
    }
  };

  // Event Handlers
  const handleSaveEvent = async (payload) => {
    if (editingEvent) {
      await api.updateEvent(editingEvent.id, payload, token);
      toast(`Event “${payload.title || 'Event'}” updated.`);
    } else {
      await api.createEvent(payload, token);
      toast('New event scheduled on the chapter calendar.');
    }
    setCreateEventOpen(false);
    setEditingEvent(null);
    refreshAll();
  };

  const handleEditEventFromConflict = async (conflictEventRef) => {
    try {
      const res = await api.event(conflictEventRef.id || conflictEventRef.eventId, token);
      setEditingEvent(res.data);
      setCreateEventOpen(true);
    } catch (err) {
      toast('Could not load event for rescheduling: ' + err.message, 'error');
    }
  };

  const handleOpenResolve = (eventOrConflict) => {
    setResolvingItem(eventOrConflict);
    setResolveModalOpen(true);
  };

  const handleResolveEvent = async (id, payload) => {
    await api.resolveEvent(id, payload, token);
    toast(`Event successfully resolved (Status: ${payload.status || 'PUBLISHED'}).`);
    setResolveModalOpen(false);
    setResolvingItem(null);
    refreshAll();
  };

  const handleQuickApprove = async (event) => {
    try {
      await api.resolveEvent(
        event.id,
        { status: 'PUBLISHED', resolutionNotes: 'Approved directly from Core Review Queue.' },
        token
      );
      toast(`Proposal “${event.title}” approved and published.`);
      refreshAll();
    } catch (err) {
      toast(err.message || 'Could not approve event.', 'error');
    }
  };

  const handleQuickReject = (event) => {
    setConfirmModal({
      open: true,
      title: `Reject Proposal “${event.title}”?`,
      message: `This will mark the event proposal as CANCELLED. The submitting executive will be informed via status history.`,
      confirmLabel: 'Reject Proposal',
      confirmTone: 'danger',
      confirming: false,
      onConfirm: async () => {
        setConfirmModal((curr) => ({ ...curr, confirming: true }));
        try {
          await api.resolveEvent(
            event.id,
            { status: 'CANCELLED', resolutionNotes: 'Rejected during Core desk review.' },
            token
          );
          toast(`Proposal “${event.title}” marked as rejected.`);
          setConfirmModal((curr) => ({ ...curr, open: false, confirming: false }));
          refreshAll();
        } catch (err) {
          toast(err.message || 'Could not reject proposal.', 'error');
          setConfirmModal((curr) => ({ ...curr, confirming: false }));
        }
      }
    });
  };

  const handleArchiveEvent = (event) => {
    setConfirmModal({
      open: true,
      title: `Archive “${event.title}”?`,
      message: `The event will be marked CANCELLED and removed from public calendar listings. Linked financial history and audit logs will be permanently preserved.`,
      confirmLabel: 'Archive Event',
      confirmTone: 'danger',
      confirming: false,
      onConfirm: async () => {
        setConfirmModal((curr) => ({ ...curr, confirming: true }));
        try {
          await api.archiveEvent(event.id, token);
          toast(`Event “${event.title}” archived.`);
          setConfirmModal((curr) => ({ ...curr, open: false, confirming: false }));
          refreshAll();
        } catch (err) {
          toast(err.message || 'Failed to archive event', 'error');
          setConfirmModal((curr) => ({ ...curr, confirming: false }));
        }
      }
    });
  };

  // Expense Handlers
  const handleOpenNewExpense = () => {
    setEditingExpense(null);
    setExpenseModalOpen(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseModalOpen(true);
  };

  const handleSaveExpense = async (payload) => {
    if (editingExpense) {
      await api.updateExpense(editingExpense.id, payload, token);
      toast('Expense record successfully updated.');
    } else {
      await api.createExpense(payload, token);
      toast('New expense logged in chapter financials.');
    }
    setExpenseModalOpen(false);
    setEditingExpense(null);
    refreshAll();
  };

  const handleArchiveExpense = (expense) => {
    setConfirmModal({
      open: true,
      title: `Archive Expense Record?`,
      message: `Archive expense of ${formatINR(expense.amount)} for “${expense.description}”? The accounting entry will be archived while preserving historical balance audits.`,
      confirmLabel: 'Archive Expense',
      confirmTone: 'danger',
      confirming: false,
      onConfirm: async () => {
        setConfirmModal((curr) => ({ ...curr, confirming: true }));
        try {
          await api.archiveExpense(expense.id, token);
          toast('Expense record archived.');
          setConfirmModal((curr) => ({ ...curr, open: false, confirming: false }));
          refreshAll();
        } catch (err) {
          toast(err.message || 'Failed to archive expense', 'error');
          setConfirmModal((curr) => ({ ...curr, confirming: false }));
        }
      }
    });
  };

  // Budget Handlers
  const handleSaveBudget = async (payload) => {
    if (dashboard?.currentBudget?.id) {
      await api.updateBudget(dashboard.currentBudget.id, payload, token);
      toast('Semester budget allocation updated.');
    } else {
      await api.createBudget(payload, token);
      toast('New semester budget established.');
    }
    setBudgetModalOpen(false);
    refreshAll();
  };

  const conflictCount = dashboard?.detectedConflicts?.length || 0;
  const primaryConflict = dashboard?.detectedConflicts?.[0] || null;

  // Upcoming scheduled events list sorted chronologically with status filtering
  const filteredAgenda = useMemo(() => {
    if (!eventsList.length) return [];
    let list = [...eventsList];
    if (agendaFilter === 'DRAFT') {
      list = list.filter((ev) => ev.status === 'DRAFT');
    } else if (agendaFilter === 'PUBLISHED') {
      list = list.filter((ev) => ev.status === 'PUBLISHED');
    } else if (agendaFilter === 'CANCELLED') {
      list = list.filter((ev) => ev.status === 'CANCELLED');
    }
    return list.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }, [eventsList, agendaFilter]);

  const inReviewEvents = useMemo(() => {
    const list = dashboard?.eventsUnderReview?.length
      ? dashboard.eventsUnderReview
      : eventsList.filter((e) => e.status === 'DRAFT');
    return [...list].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }, [dashboard?.eventsUnderReview, eventsList]);

  const draftCount = useMemo(() => inReviewEvents.length, [inReviewEvents]);
  const pubCount = useMemo(() => eventsList.filter((e) => e.status === 'PUBLISHED').length, [eventsList]);
  const cancCount = useMemo(() => eventsList.filter((e) => e.status === 'CANCELLED').length, [eventsList]);

  // Financial calculations
  const totalBudget = Number(dashboard?.currentBudget?.totalAmount) || 0;
  const totalExpended = Number(dashboard?.totalExpenses) || 0;
  const remainingBudget = Number(dashboard?.remainingBudget) || Math.max(0, totalBudget - totalExpended);
  const budgetUtilization = totalBudget > 0 ? Math.min(100, Math.round((totalExpended / totalBudget) * 100)) : 0;

  return (
    <main className="dashboard-page">
      {/* ── Precision Editorial Topbar ── */}
      <header className="dashboard-topbar">
        <div className="page-shell dashboard-topbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <AcmLogo compact />
            <span className="ops-status-badge">
              <span className="status-dot" style={{ background: 'var(--success)' }} />
              OPERATIONS DESK // DIV. 01
            </span>
          </div>

          <div className="dashboard-account">
            <span className="dashboard-user">
              <span className="dashboard-user-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || 'C'}
              </span>
              <span className="dashboard-user-name">{user?.name}</span>
              <span className="badge badge-default">
                {user?.role === 'ADMIN' ? 'ADMINISTRATOR' : 'CORE MEMBER'}
              </span>
            </span>
            <button
              className="button button-outline button-compact"
              type="button"
              onClick={() => setPasswordModalOpen(true)}
              title="Change account password"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <KeyRound size={12} /> Password
            </button>
            <button className="button button-outline button-compact" type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Operations Shell ── */}
      <div className="dashboard-main page-shell">
        <nav className="dashboard-breadcrumb" aria-label="Breadcrumb">
          <Link href="/"><ArrowLeft size={13} /> Public Campus Portal</Link>
          <span aria-hidden="true">/</span>
          <span>Operations & Conflict Center</span>
          <span className="dashboard-system-clock">
            SYSTEM DATE: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
          </span>
        </nav>

        {/* ── Masthead: Title & Technical Actions ── */}
        <div className="dashboard-title-row">
          <div>
            <p className="section-kicker">CHAPTER DESK // SYSTEM CONSOLE</p>
            <h1>Operations & <em>Conflict Registry</em></h1>
            <p className="dashboard-subtitle">
              Conflict-aware calendar scheduling, university venue collision radar, and chapter financial ledger.
            </p>
          </div>

          <div className="dashboard-cta-group">
            <button
              type="button"
              className="button button-outline button-compact"
              onClick={refreshAll}
              title="Synchronize records with server"
            >
              <RefreshCw size={13} /> Sync Data
            </button>
            <button
              type="button"
              className="button button-secondary button-compact"
              onClick={handleOpenNewExpense}
            >
              <IndianRupee size={13} /> Record Expense
            </button>
            <button
              type="button"
              id="create-event-btn"
              className="button button-primary button-compact"
              onClick={() => { setEditingEvent(null); setCreateEventOpen(true); }}
            >
              <CalendarPlus size={13} /> Schedule Event
            </button>
          </div>
        </div>

        {/* ── Architectural Workspace Sub-Navigation ── */}
        <nav className="workspace-nav-bar" aria-label="Dashboard Workspace Views">
          <button
            type="button"
            className={`workspace-nav-btn ${activeTab === 'overview' ? 'workspace-nav-btn-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            [ 01 · OVERVIEW ]
          </button>

          <button
            type="button"
            className={`workspace-nav-btn ${activeTab === 'conflicts' ? 'workspace-nav-btn-active' : ''}`}
            onClick={() => setActiveTab('conflicts')}
          >
            [ 02 · CONFLICT CENTER ]
            {conflictCount > 0 ? (
              <span className="badge badge-danger">
                {conflictCount} CRITICAL
              </span>
            ) : (
              <span className="badge badge-success">0 CLEARED</span>
            )}
          </button>

          <button
            type="button"
            className={`workspace-nav-btn ${activeTab === 'expenses' ? 'workspace-nav-btn-active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            [ 03 · FINANCIAL LEDGER ]
            <span className="badge badge-default">{expenses.length}</span>
          </button>

          <button
            type="button"
            className={`workspace-nav-btn ${activeTab === 'analytics' ? 'workspace-nav-btn-active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            [ 04 · ANALYTICAL REPORT ]
          </button>

          <button
            type="button"
            className={`workspace-nav-btn ${activeTab === 'team' ? 'workspace-nav-btn-active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            [ 05 · CHAPTER TEAM & EXECUTIVES ]
            <span className="badge badge-default">{teamUsers.length}</span>
          </button>

          <button
            type="button"
            className={`workspace-nav-btn ${activeTab === 'work' ? 'workspace-nav-btn-active' : ''}`}
            onClick={() => setActiveTab('work')}
          >
            [ 06 · WORK ASSIGNMENTS ]
            <span className="badge badge-default">{workAssignments.length}</span>
          </button>
        </nav>

        {/* ── Loading / Error States ── */}
        {loading && !dashboard && <LoadingState label="Synchronizing chapter operational desk" rows={4} />}
        {error && (
          <ErrorState
            title="Core desk is temporarily unavailable."
            message={error.message}
            onRetry={refreshAll}
          />
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW 1: FUNCTIONAL OPERATIONS OVERVIEW (SWISS EDITORIAL)
            ══════════════════════════════════════════════════════════ */}
        {dashboard && activeTab === 'overview' && (
          <div className="ops-overview-layout">
            {/* ── Section A: Continuous Operational Ticker Ribbon (No 4 floating cards!) ── */}
            <section className="ops-ticker-ribbon" aria-label="Current chapter operational status">
              <div className="ops-ticker-cell">
                <span className="ops-ticker-label">01 // SCHEDULED AGENDA</span>
                <div className="ops-ticker-data">
                  <span className="ops-ticker-num">{dashboard.upcomingEvents ?? 0}</span>
                  <span className="ops-ticker-sub">Published Active</span>
                </div>
                <div className="ops-ticker-meta">
                  <span>{dashboard.draftEvents ?? 0} In Review</span>
                  <span className="meta-sep">/</span>
                  <span>{dashboard.pastEvents ?? 0} Archived</span>
                </div>
              </div>

              <div className="ops-ticker-cell">
                <span className="ops-ticker-label">02 // FINANCIAL UTILIZATION</span>
                <div className="ops-ticker-data">
                  <span className="ops-ticker-num">{budgetUtilization}%</span>
                  <span className="ops-ticker-sub">of Approved Allocation</span>
                </div>
                <div className="ops-ticker-meta">
                  <span className="tnum">{formatINR(totalExpended)}</span>
                  <span className="meta-sep">/</span>
                  <span className="tnum">{formatINR(totalBudget)}</span>
                </div>
              </div>

              <div className="ops-ticker-cell">
                <span className="ops-ticker-label">03 // REMAINING RESERVE</span>
                <div className="ops-ticker-data">
                  <span className="ops-ticker-num tnum" style={{ color: remainingBudget < 10000 ? 'var(--warning-text)' : 'var(--text-primary)' }}>
                    {formatINR(remainingBudget)}
                  </span>
                </div>
                <div className="ops-ticker-meta">
                  <span>{dashboard.currentBudget?.name || 'Semester Fund'}</span>
                </div>
              </div>

              <div className={`ops-ticker-cell ${conflictCount > 0 ? 'ops-ticker-cell-alert' : 'ops-ticker-cell-clear'}`}>
                <span className="ops-ticker-label">04 // COLLISION RADAR</span>
                <div className="ops-ticker-data">
                  <span className="ops-ticker-num" style={{ color: conflictCount > 0 ? 'var(--danger-text)' : 'var(--success-text)' }}>
                    {conflictCount > 0 ? `${conflictCount} COLLISION` : 'CLEAR'}
                  </span>
                </div>
                <div className="ops-ticker-meta">
                  <span>{conflictCount > 0 ? 'Immediate resolution required' : 'All venues & times verified'}</span>
                </div>
              </div>
            </section>

            {/* ── Section B: Primary Asymmetric Operations Desk (62% / 38%) ── */}
            <div className="ops-split-grid">
              {/* ── Left Column: Active Collisions + Scheduled Agenda ── */}
              <div className="ops-primary-column">
                {/* Situation Alert: Direct Collision Comparison */}
                {conflictCount > 0 && primaryConflict ? (
                  <section className="ops-situation-alert" aria-label="Scheduling conflict notice">
                    <div className="ops-situation-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-danger">
                          <AlertTriangle size={11} /> CRITICAL COLLISION #{1}
                        </span>
                        <span className="micro-label">SCHEDULING DESK RADAR</span>
                      </div>
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => setActiveTab('conflicts')}
                      >
                        Inspect all conflicts ({conflictCount}) <ArrowUpRight size={13} />
                      </button>
                    </div>

                    <div className="ops-collision-row">
                      <div className="ops-collision-side">
                        <span className="micro-label" style={{ color: 'var(--primary)' }}>EVENT A (PROPOSED)</span>
                        <strong className="ops-collision-title">{primaryConflict.title}</strong>
                        <div className="ops-collision-meta">
                          <MapPin size={12} />
                          <span>{primaryConflict.venue}</span>
                          <span className="meta-sep">·</span>
                          <span className="tnum">{formatDate(primaryConflict.startsAt)}</span>
                        </div>
                      </div>

                      <div className="ops-collision-vs">
                        <span className="badge badge-danger">VS</span>
                      </div>

                      <div className="ops-collision-side">
                        <span className="micro-label" style={{ color: 'var(--text-muted)' }}>EVENT B (CONFLICTING)</span>
                        <strong className="ops-collision-title">{primaryConflict.conflictingTitle}</strong>
                        <div className="ops-collision-meta">
                          <MapPin size={12} />
                          <span>{primaryConflict.venue}</span>
                          <span className="meta-sep">·</span>
                          <span className="tnum">{formatTime(primaryConflict.startsAt)} - {formatTime(primaryConflict.endsAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ops-collision-footer">
                      <div className="ops-collision-reasons">
                        <span className="micro-label">CLASH REASONS:</span>
                        {(primaryConflict.reasons || []).map((r, idx) => (
                          <span key={idx} className="badge badge-warning">{r}</span>
                        ))}
                      </div>
                      <div className="ops-collision-actions">
                        <button
                          type="button"
                          className="button button-danger button-compact"
                          onClick={() => handleEditEventFromConflict(primaryConflict)}
                        >
                          <Pencil size={12} /> Reschedule Event
                        </button>
                      </div>
                    </div>
                  </section>
                ) : (
                  <div className="ops-status-clear-banner">
                    <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                    <span><strong>COLLISION RADAR: ALL CLEAR.</strong> All published and proposed campus activities have distinct timeslots and venues.</span>
                  </div>
                )}

                {/* ── Section: Review Queue for Events Under Review (Requirement 2 & 3) ── */}
                {inReviewEvents.length > 0 && (
                  <section
                    className="ops-review-queue-section"
                    aria-label="Proposals under review"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderLeft: '4px solid var(--warning)',
                      padding: '20px 24px',
                      marginBottom: '24px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <p className="section-kicker" style={{ color: 'var(--warning-text)', margin: '0 0 4px 0' }}>
                          EXECUTIVE PROPOSALS // AWAITING CORE DECISION
                        </p>
                        <h2 style={{ margin: 0, fontSize: '18px' }}>
                          Proposals Under Review ({inReviewEvents.length})
                        </h2>
                      </div>
                      <span className="badge badge-warning" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}>
                        <Clock size={12} /> {inReviewEvents.length} PENDING DECISION
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '14px'
                      }}
                    >
                      {inReviewEvents.map((revEvent) => {
                        const upvoteCount = revEvent.upvotes?.length || 0;
                        const isVerified = upvoteCount >= 2;
                        const isColliding = dashboard.detectedConflicts?.some(
                          (c) => c.eventId === revEvent.id || c.conflictingEventId === revEvent.id
                        );
                        const matchingConflict = dashboard.detectedConflicts?.find(
                          (c) => c.eventId === revEvent.id || c.conflictingEventId === revEvent.id
                        );

                        const hasUpvoted = Boolean(user?.id && revEvent.upvotes?.some((u) => u.userId === user.id));
                        const isUpvotingThis = upvotingEventId === revEvent.id;

                        return (
                          <div
                            key={revEvent.id}
                            style={{
                              background: 'var(--bg-subtle)',
                              border: isColliding ? '1px solid var(--danger-border)' : '1px solid var(--border-subtle)',
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span className="badge badge-default">{revEvent.category}</span>
                                <span className="badge badge-warning">IN REVIEW</span>
                                {isVerified && (
                                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}>
                                    <Sparkles size={10} /> PEER VERIFIED ({upvoteCount})
                                  </span>
                                )}
                                {isColliding && (
                                  <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}>
                                    <AlertTriangle size={10} /> CLASH
                                  </span>
                                )}
                              </div>
                              <span className="tnum" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {formatDate(revEvent.startsAt)}
                              </span>
                            </div>

                            <div>
                              <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', lineHeight: 1.3 }}>
                                {revEvent.title}
                              </strong>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {revEvent.description}
                              </p>
                            </div>

                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CalendarClock size={12} />
                                {formatTime(revEvent.startsAt)} - {formatTime(revEvent.endsAt)} · {revEvent.venue}
                              </span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <UserCheck size={12} />
                                Submitter: <strong>{revEvent.createdBy?.name || revEvent.organizer}</strong>
                                {revEvent.createdBy?.email ? ` (${revEvent.createdBy.email})` : ''}
                              </span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <ArrowBigUp size={12} style={{ color: upvoteCount > 0 ? 'var(--primary)' : 'inherit' }} />
                                <strong>{upvoteCount}</strong> Executive Peer Endorsement{upvoteCount === 1 ? '' : 's'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className={`button ${hasUpvoted ? 'button-secondary' : 'button-outline'} button-compact`}
                                style={{ height: '26px', fontSize: '11px', padding: '0 8px', gap: '3px' }}
                                disabled={isUpvotingThis}
                                onClick={() => handleUpvoteEvent(revEvent)}
                                title={hasUpvoted ? 'Remove your endorsement' : 'Endorse / peer-verify this proposal'}
                              >
                                <ArrowBigUp size={12} fill={hasUpvoted ? 'currentColor' : 'none'} />
                                <span>{isUpvotingThis ? 'Updating…' : hasUpvoted ? `Endorsed (${upvoteCount})` : `Endorse (${upvoteCount})`}</span>
                              </button>
                              <button
                                type="button"
                                className="button button-primary button-compact"
                                style={{ height: '26px', fontSize: '11px', padding: '0 8px' }}
                                onClick={() => handleQuickApprove(revEvent)}
                                title="Approve immediately and publish to chapter calendar"
                              >
                                <CheckCircle2 size={12} /> Approve
                              </button>
                              <button
                                type="button"
                                className="button button-outline button-compact"
                                style={{ height: '26px', fontSize: '11px', padding: '0 8px' }}
                                onClick={() => handleOpenResolve(matchingConflict || revEvent)}
                                title="Open full resolution console"
                              >
                                <ShieldCheck size={12} /> Resolve
                              </button>
                              <button
                                type="button"
                                className="button button-danger button-compact"
                                style={{ height: '26px', fontSize: '11px', padding: '0 8px' }}
                                onClick={() => handleQuickReject(revEvent)}
                                title="Reject proposal"
                              >
                                <Trash2 size={12} /> Reject
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Structured Scheduled Agenda (Operations Register) */}
                <section className="ops-agenda-section" aria-label="Chapter scheduled agenda">
                  <div className="ops-section-head">
                    <div>
                      <p className="section-kicker">OPERATIONAL REGISTER</p>
                      <h2>Scheduled Chapter Agenda</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link href="/#events" className="text-link" style={{ fontSize: '11px' }}>
                        Public View <ArrowUpRight size={12} />
                      </Link>
                      <button
                        type="button"
                        className="button button-primary button-compact"
                        onClick={() => { setEditingEvent(null); setCreateEventOpen(true); }}
                      >
                        <Plus size={12} /> Add Event
                      </button>
                    </div>
                  </div>

                  {/* Agenda Status Filters */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`calendar-cat-btn ${agendaFilter === 'ALL' ? 'calendar-cat-btn-active' : ''}`}
                      onClick={() => setAgendaFilter('ALL')}
                    >
                      ALL ({eventsList.length})
                    </button>
                    <button
                      type="button"
                      className={`calendar-cat-btn ${agendaFilter === 'DRAFT' ? 'calendar-cat-btn-active' : ''}`}
                      onClick={() => setAgendaFilter('DRAFT')}
                    >
                      IN REVIEW / DRAFTS ({draftCount})
                    </button>
                    <button
                      type="button"
                      className={`calendar-cat-btn ${agendaFilter === 'PUBLISHED' ? 'calendar-cat-btn-active' : ''}`}
                      onClick={() => setAgendaFilter('PUBLISHED')}
                    >
                      ACTIVE / PUBLISHED ({pubCount})
                    </button>
                    <button
                      type="button"
                      className={`calendar-cat-btn ${agendaFilter === 'CANCELLED' ? 'calendar-cat-btn-active' : ''}`}
                      onClick={() => setAgendaFilter('CANCELLED')}
                    >
                      CANCELLED ({cancCount})
                    </button>
                  </div>

                  <div className="ops-agenda-table-wrap">
                    <table className="ops-agenda-table">
                      <thead>
                        <tr>
                          <th style={{ width: '90px' }}>Date</th>
                          <th style={{ width: '130px' }}>Timeslot</th>
                          <th>Event Title, Organizer & Submitter</th>
                          <th>Venue</th>
                          <th style={{ width: '110px' }}>Endorsements</th>
                          <th style={{ width: '100px' }}>Status</th>
                          <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAgenda.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                              No events found in this view. Use “Schedule Event” above to log a new date.
                            </td>
                          </tr>
                        ) : (
                          filteredAgenda.map((event) => {
                            const isColliding = dashboard.detectedConflicts?.some(
                              (c) => c.eventId === event.id || c.conflictingEventId === event.id
                            );
                            const matchingConflict = dashboard.detectedConflicts?.find(
                              (c) => c.eventId === event.id || c.conflictingEventId === event.id
                            );
                            const upvoteCount = event.upvotes?.length || 0;

                            return (
                              <tr key={event.id} className={isColliding ? 'ops-row-collision' : ''}>
                                <td className="tnum" style={{ fontWeight: 600 }}>
                                  {formatDate(event.startsAt, event.timezone)}
                                </td>
                                <td className="tnum" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                                  {formatTime(event.startsAt, event.timezone)} - {formatTime(event.endsAt, event.timezone)}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                                      {event.title}
                                    </strong>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                      {event.category} · Hosted by {event.organizer}
                                      {event.createdBy && (
                                        <span style={{ display: 'block', color: 'var(--text-secondary)' }}>
                                          Submitter: <strong>{event.createdBy.name}</strong> ({event.createdBy.role})
                                        </span>
                                      )}
                                      {event.resolutionNotes && (
                                        <span style={{ display: 'block', color: 'var(--primary)', fontStyle: 'italic', marginTop: '2px' }}>
                                          Note: {event.resolutionNotes}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                                    {event.venue}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="text-link"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '12px',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '2px 4px',
                                      opacity: upvotingEventId === event.id ? 0.6 : 1
                                    }}
                                    disabled={upvotingEventId === event.id}
                                    onClick={() => handleUpvoteEvent(event)}
                                    title={user?.id && event.upvotes?.some((u) => u.userId === user.id) ? 'Remove your endorsement' : 'Click to endorse this proposal'}
                                  >
                                    <ArrowBigUp
                                      size={13}
                                      fill={user?.id && event.upvotes?.some((u) => u.userId === user.id) ? 'currentColor' : 'none'}
                                      style={{ color: upvoteCount > 0 ? 'var(--primary)' : 'var(--text-muted)' }}
                                    />
                                    <strong>{upvoteCount}</strong>
                                    {upvoteCount >= 2 && (
                                      <span className="badge badge-success" style={{ fontSize: '9px', padding: '1px 4px' }}>
                                        VERIFIED
                                      </span>
                                    )}
                                  </button>
                                </td>
                                <td>
                                  {isColliding ? (
                                    <span className="badge badge-danger">
                                      <AlertTriangle size={10} /> CLASH
                                    </span>
                                  ) : event.status === 'DRAFT' ? (
                                    <span className="badge badge-warning">
                                      IN REVIEW
                                    </span>
                                  ) : event.status === 'CANCELLED' ? (
                                    <span className="badge badge-danger">
                                      CANCELLED
                                    </span>
                                  ) : (
                                    <span className="badge badge-primary">
                                      PUBLISHED
                                    </span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                                    {(event.status === 'DRAFT' || isColliding) && (
                                      <button
                                        type="button"
                                        className="button button-compact button-outline"
                                        style={{ height: '26px', fontSize: '10px', padding: '0 6px', gap: '3px' }}
                                        onClick={() => handleOpenResolve(matchingConflict || event)}
                                        title={event.status === 'DRAFT' ? 'Review and resolve draft submission' : 'Resolve scheduling concurrency'}
                                      >
                                        <ShieldCheck size={11} /> Resolve
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="icon-button icon-button-ghost"
                                      onClick={() => { setEditingEvent(event); setCreateEventOpen(true); }}
                                      title="Edit event details"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      className="icon-button icon-button-ghost"
                                      style={{ color: 'var(--danger)' }}
                                      onClick={() => handleArchiveEvent(event)}
                                      title="Archive event"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* ── Right Column: Financial Balance Sheet + Dispatch Feed ── */}
              <div className="ops-secondary-column">
                {/* Financial Ledger Snapshot */}
                <section className="ops-ledger-snapshot" aria-label="Semester Financial Status">
                  <div className="ops-section-head">
                    <div>
                      <p className="section-kicker">FINANCIAL DESK</p>
                      <h2>Semester Budget Status</h2>
                    </div>
                    <button
                      type="button"
                      className="button button-outline button-compact"
                      onClick={() => setActiveTab('expenses')}
                    >
                      Ledger <ArrowUpRight size={11} />
                    </button>
                  </div>

                  <div className="ops-ledger-body">
                    <div className="ops-balance-sheet">
                      <div className="ops-balance-row">
                        <span className="micro-label">APPROVED ALLOCATION</span>
                        <strong className="tnum">{formatINR(totalBudget)}</strong>
                      </div>
                      <div className="ops-balance-row">
                        <span className="micro-label">COMMITTED / EXPENDED</span>
                        <strong className="tnum" style={{ color: 'var(--text-primary)' }}>
                          {formatINR(totalExpended)}
                        </strong>
                      </div>
                      <div className="ops-balance-row ops-balance-row-highlight">
                        <span className="micro-label" style={{ color: 'var(--primary)' }}>UNCOMMITTED BALANCE</span>
                        <strong className="tnum" style={{ color: 'var(--primary)' }}>
                          {formatINR(remainingBudget)}
                        </strong>
                      </div>
                    </div>

                    {/* Proportional Category Distribution */}
                    {dashboard.categoryWiseSpending?.length > 0 && (
                      <div className="ops-spending-breakdown">
                        <span className="micro-label" style={{ marginBottom: '8px', display: 'block' }}>
                          EXPENDITURE BY CATEGORY
                        </span>
                        <div className="ops-category-list">
                          {dashboard.categoryWiseSpending.map((cat) => {
                            const catAmt = Number(cat.amount) || 0;
                            const catPct = totalExpended > 0 ? Math.round((catAmt / totalExpended) * 100) : 0;
                            return (
                              <div key={cat.category} className="ops-category-item">
                                <div className="ops-category-head">
                                  <span className="ops-category-name">{cat.category}</span>
                                  <span className="ops-category-amount tnum">{formatINR(catAmt)}</span>
                                </div>
                                <div className="ops-category-bar-track">
                                  <div
                                    className="ops-category-bar-fill"
                                    style={{ width: `${catPct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="ops-ledger-actions">
                      <button
                        type="button"
                        className="button button-secondary button-compact"
                        style={{ width: '100%' }}
                        onClick={handleOpenNewExpense}
                      >
                        <IndianRupee size={12} /> Log New Expenditure
                      </button>
                    </div>
                  </div>
                </section>

                {/* Audit Dispatch Feed */}
                <section className="ops-dispatch-section" aria-label="Recent Chapter Audit Dispatch">
                  <div className="ops-section-head">
                    <div>
                      <p className="section-kicker">AUDIT LOG</p>
                      <h2>Chronological Dispatch</h2>
                    </div>
                    <span className="micro-label">{dashboard.recentActivity?.length || 0} ENTRIES</span>
                  </div>

                  <div className="ops-dispatch-body">
                    <ActivityFeed entries={dashboard.recentActivity || []} />
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW 2: CONFLICT CENTER (COLLISION DECISION INTERFACE)
            ══════════════════════════════════════════════════════════ */}
        {dashboard && activeTab === 'conflicts' && (
          <section className="ops-conflict-center-wrap">
            <div className="ops-view-masthead">
              <div>
                <p className="section-kicker">SAFETY & SCHEDULING RADAR</p>
                <h2>Conflict Decision Interface</h2>
                <p className="dashboard-subtitle">
                  Automated campus collision detection flags venue concurrency, timeslot overlaps, and divided audience segments.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="button button-outline button-compact"
                  onClick={refreshAll}
                >
                  <RefreshCw size={13} /> Re-scan Matrix
                </button>
                <button
                  type="button"
                  className="button button-primary button-compact"
                  onClick={() => { setEditingEvent(null); setCreateEventOpen(true); }}
                >
                  <CalendarPlus size={13} /> Schedule New Event
                </button>
              </div>
            </div>

            <ConflictCenter
              conflicts={dashboard.detectedConflicts || []}
              role="CORE"
              onEditEvent={handleEditEventFromConflict}
              onResolveConflict={handleOpenResolve}
            />
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW 3: EXPENSES & BUDGETS (FINANCIAL LEDGER WORKSPACE)
            ══════════════════════════════════════════════════════════ */}
        {dashboard && activeTab === 'expenses' && (
          <section className="ops-finance-workspace">
            {/* Double-Entry Ledger Summary Bar */}
            <div className="ops-finance-summary-bar">
              <div className="ops-finance-statement">
                <span className="section-kicker">
                  <Wallet size={12} /> ACTIVE ALLOCATION STATUS
                </span>
                <h3>{dashboard.currentBudget?.name || 'ACM Chapter Semester Operational Fund'}</h3>
                <p>
                  {dashboard.currentBudget
                    ? `Period: ${dashboard.currentBudget.period} · Controlled expenditure tracking against authorized university allocation.`
                    : 'Establish a semester or event-specific budget to track chapter expenditures and prevent deficits.'}
                </p>
              </div>

              <div className="ops-finance-metrics">
                <div className="ops-finance-metric-cell">
                  <span className="micro-label">APPROVED FUND</span>
                  <strong className="tnum">{formatINR(dashboard.currentBudget?.totalAmount || 0)}</strong>
                </div>
                <div className="ops-finance-metric-cell">
                  <span className="micro-label">TOTAL EXPENDED</span>
                  <strong className="tnum">{formatINR(dashboard.totalExpenses || 0)}</strong>
                </div>
                <div className="ops-finance-metric-cell ops-finance-metric-highlight">
                  <span className="micro-label" style={{ color: 'var(--primary)' }}>AVAILABLE BALANCE</span>
                  <strong className="tnum" style={{ color: 'var(--primary)' }}>
                    {formatINR(dashboard.remainingBudget || 0)}
                  </strong>
                </div>
              </div>

              <div className="ops-finance-actions">
                <button
                  type="button"
                  className="button button-outline button-compact"
                  onClick={() => setBudgetModalOpen(true)}
                >
                  Adjust Allocation
                </button>
                <button
                  type="button"
                  className="button button-primary button-compact"
                  onClick={handleOpenNewExpense}
                >
                  <Plus size={13} /> Log Transaction
                </button>
              </div>
            </div>

            {/* Financial Ledger Records Table */}
            <div className="ops-ledger-container">
              <div className="ops-ledger-header">
                <div>
                  <p className="section-kicker">DOUBLE-ENTRY TRANSACTION LOG</p>
                  <h2>General Financial Ledger ({expenses.length} Records)</h2>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="button button-outline button-compact"
                    onClick={() => loadExpensesAndEvents()}
                    disabled={expensesLoading}
                  >
                    <RefreshCw size={12} /> {expensesLoading ? 'Syncing…' : 'Refresh Ledger'}
                  </button>
                  <button
                    type="button"
                    className="button button-primary button-compact"
                    onClick={handleOpenNewExpense}
                  >
                    <Plus size={12} /> New Record
                  </button>
                </div>
              </div>

              {expensesLoading && !expenses.length ? (
                <div style={{ padding: '32px' }}>
                  <LoadingState label="Reading transaction log" />
                </div>
              ) : (
                <ExpenseTable
                  expenses={expenses}
                  role="CORE"
                  onEdit={handleEditExpense}
                  onArchive={handleArchiveExpense}
                />
              )}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW 4: REPORTS & ANALYTICS (ANALYTICAL PUBLICATION)
            ══════════════════════════════════════════════════════════ */}
        {dashboard && activeTab === 'analytics' && (
          <section className="ops-analytics-section">
            <div className="ops-view-masthead">
              <div>
                <p className="section-kicker">EXECUTIVE ANALYTICS</p>
                <h2>Chapter Fiscal & Velocity Report</h2>
                <p className="dashboard-subtitle">
                  Comprehensive audit of semester allocation burn rate, category expenditures, and operational distribution.
                </p>
              </div>

              <button
                type="button"
                className="button button-outline button-compact"
                onClick={refreshAll}
              >
                <RefreshCw size={13} /> Refresh Report
              </button>
            </div>
            <AnalyticsReports dashboard={dashboard} />
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW 5: TEAM & EXECUTIVES MANAGEMENT
            ══════════════════════════════════════════════════════════ */}
        {activeTab === 'team' && (
          <TeamManagement
            users={teamUsers}
            currentUser={user}
            token={token}
            loading={teamLoading}
            onRefresh={() => loadTeamAndWork()}
            onAssignWork={(targetUser) => {
              setPresetAssignee(targetUser);
              setActiveTab('work');
            }}
          />
        )}

        {/* ══════════════════════════════════════════════════════════
            VIEW 6: WORK ASSIGNMENTS
            ══════════════════════════════════════════════════════════ */}
        {activeTab === 'work' && (
          <WorkAssignments
            assignments={workAssignments}
            executives={teamUsers.filter((u) => u.role === 'EXECUTIVE' && u.isActive)}
            events={eventsList}
            currentUser={user}
            token={token}
            loading={workLoading}
            presetAssignee={presetAssignee}
            onClearPresetAssignee={() => setPresetAssignee(null)}
            onRefresh={() => loadTeamAndWork()}
          />
        )}

        {/* ── Operational Footnote ── */}
        <div className="dashboard-footer-links">
          <Link href="/#events" className="text-link">
            <ArrowLeft size={13} /> Public Event Calendar
          </Link>
          <span className="tnum">
            ACM Chapter Console · {dashboard?.totalEvents ?? 0} total registered records in database · Engine Active
          </span>
        </div>
      </div>

      {/* ── Modals (Preserved Completely) ── */}
      <EventForm
        open={createEventOpen}
        event={editingEvent}
        role="CORE"
        onClose={() => { setCreateEventOpen(false); setEditingEvent(null); }}
        onSave={handleSaveEvent}
      />

      <EventResolveModal
        open={resolveModalOpen}
        event={resolvingItem?.title && !resolvingItem?.conflictingEventId ? resolvingItem : null}
        conflict={resolvingItem?.conflictingEventId ? resolvingItem : null}
        onClose={() => { setResolveModalOpen(false); setResolvingItem(null); }}
        onResolve={handleResolveEvent}
      />

      <ExpenseForm
        open={expenseModalOpen}
        expense={editingExpense}
        events={eventsList}
        onClose={() => { setExpenseModalOpen(false); setEditingExpense(null); }}
        onSave={handleSaveExpense}
      />

      <BudgetModal
        open={budgetModalOpen}
        budget={dashboard?.currentBudget}
        onClose={() => setBudgetModalOpen(false)}
        onSave={handleSaveBudget}
      />

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmTone={confirmModal.confirmTone}
        confirming={confirmModal.confirming}
        onClose={() => setConfirmModal((curr) => ({ ...curr, open: false }))}
        onConfirm={confirmModal.onConfirm}
      />

      <ChangePasswordModal
        open={passwordModalOpen || Boolean(user?.mustChangePassword)}
        isForced={Boolean(user?.mustChangePassword)}
        token={token}
        onClose={() => setPasswordModalOpen(false)}
        onPasswordChanged={() => {
          setPasswordModalOpen(false);
          refreshAll();
        }}
      />
    </main>
  );
}

export function CoreDashboard() {
  return (
    <ProtectedRoute role="CORE">
      <DashboardContent />
    </ProtectedRoute>
  );
}
