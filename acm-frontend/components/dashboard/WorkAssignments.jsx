'use client';

import { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Briefcase,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Tag,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { formatDate, formatTime } from '@/lib/dates';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { LoadingState } from '@/components/ui/LoadingState';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', badgeClass: 'badge-warning' },
  { value: 'IN_PROGRESS', label: 'In Progress', badgeClass: 'badge-primary' },
  { value: 'COMPLETED', label: 'Completed', badgeClass: 'badge-success' },
  { value: 'CANCELLED', label: 'Cancelled', badgeClass: 'badge-default' }
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', badgeClass: 'badge-default' },
  { value: 'MEDIUM', label: 'Medium', badgeClass: 'badge-primary' },
  { value: 'HIGH', label: 'High', badgeClass: 'badge-warning' },
  { value: 'URGENT', label: 'Urgent', badgeClass: 'badge-danger' }
];

export function WorkAssignments({
  assignments = [],
  executives = [],
  events = [],
  currentUser,
  token,
  onRefresh,
  loading = false,
  presetAssignee = null,
  onClearPresetAssignee
}) {
  const toast = useToast();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState(presetAssignee?.id || 'ALL');
  const [search, setSearch] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(Boolean(presetAssignee));
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assigneeId: presetAssignee?.id || '',
    eventId: ''
  });

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirming: false,
    onConfirm: null
  });

  const isCoreOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'CORE';

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;
      if (assigneeFilter !== 'ALL' && item.assigneeId !== assigneeFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(query);
        const matchDesc = item.description?.toLowerCase().includes(query);
        const matchAssignee = item.assignee?.name?.toLowerCase().includes(query);
        const matchEvent = item.event?.title?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchAssignee && !matchEvent) return false;
      }
      return true;
    });
  }, [assignments, statusFilter, priorityFilter, assigneeFilter, search]);

  // Statistics
  const pendingCount = assignments.filter((a) => a.status === 'PENDING').length;
  const inProgressCount = assignments.filter((a) => a.status === 'IN_PROGRESS').length;
  const completedCount = assignments.filter((a) => a.status === 'COMPLETED').length;

  const handleOpenCreate = (targetAssigneeId) => {
    setEditingAssignment(null);
    setForm({
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: '',
      assigneeId: targetAssigneeId || executives[0]?.id || '',
      eventId: ''
    });
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (assignment) => {
    setEditingAssignment(assignment);
    setForm({
      title: assignment.title || '',
      description: assignment.description || '',
      priority: assignment.priority || 'MEDIUM',
      dueDate: assignment.dueDate ? assignment.dueDate.slice(0, 10) : '',
      assigneeId: assignment.assigneeId || '',
      eventId: assignment.eventId || ''
    });
    setCreateModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        assigneeId: form.assigneeId,
        eventId: form.eventId || undefined
      };

      if (editingAssignment) {
        await api.updateWorkAssignment(editingAssignment.id, payload, token);
        toast(`Work assignment “${form.title}” updated.`);
      } else {
        await api.createWorkAssignment(payload, token);
        toast(`Task assigned to executive successfully.`);
      }

      setCreateModalOpen(false);
      setEditingAssignment(null);
      onClearPresetAssignee?.();
      onRefresh?.();
    } catch (err) {
      toast(err.message || 'Failed to save work assignment.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (assignment, newStatus) => {
    try {
      await api.updateWorkAssignment(assignment.id, { status: newStatus }, token);
      toast(`Task marked as ${newStatus.replace('_', ' ').toLowerCase()}.`);
      onRefresh?.();
    } catch (err) {
      toast(err.message || 'Could not update task status.', 'error');
    }
  };

  const handleDelete = (assignment) => {
    setConfirmModal({
      open: true,
      title: `Delete Task “${assignment.title}”?`,
      message: `Are you sure you want to remove this assigned task? This action will permanently remove it from the executive’s dashboard.`,
      confirmLabel: 'Delete Task',
      confirmTone: 'danger',
      confirming: false,
      onConfirm: async () => {
        setConfirmModal((curr) => ({ ...curr, confirming: true }));
        try {
          await api.deleteWorkAssignment(assignment.id, token);
          toast(`Task “${assignment.title}” removed.`);
          setConfirmModal((curr) => ({ ...curr, open: false, confirming: false }));
          onRefresh?.();
        } catch (err) {
          toast(err.message || 'Failed to delete task.', 'error');
          setConfirmModal((curr) => ({ ...curr, confirming: false }));
        }
      }
    });
  };

  return (
    <section className="ops-work-assignments" aria-label="Executive Work Assignments">
      {/* ── View Masthead ── */}
      <div className="ops-view-masthead">
        <div>
          <p className="section-kicker">WORK DELEGATION // OPERATIONAL RESPONSIBILITY</p>
          <h2>Executive Work Assignments</h2>
          <p className="dashboard-subtitle">
            Assign, coordinate, and track operational responsibilities delegated to chapter executives for upcoming events and workshops.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="button button-outline button-compact"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw size={12} className={loading ? 'spin' : ''} /> {loading ? 'Syncing…' : 'Sync Tasks'}
          </button>

          {isCoreOrAdmin && (
            <button
              type="button"
              className="button button-primary button-compact"
              onClick={() => handleOpenCreate()}
              disabled={executives.length === 0}
              title={executives.length === 0 ? 'Register an Executive account first' : 'Assign work to an executive'}
            >
              <Plus size={13} /> Assign New Work
            </button>
          )}
        </div>
      </div>

      {/* ── Metric Ribbon ── */}
      <div className="ops-ticker-ribbon" style={{ marginBottom: '24px' }}>
        <div className="ops-ticker-cell">
          <span className="ops-ticker-label">01 // TOTAL TASKS</span>
          <div className="ops-ticker-data">
            <span className="ops-ticker-num">{assignments.length}</span>
            <span className="ops-ticker-sub">Delegated Items</span>
          </div>
          <div className="ops-ticker-meta">
            <span>Across all active chapters</span>
          </div>
        </div>

        <div className="ops-ticker-cell">
          <span className="ops-ticker-label">02 // PENDING QUEUE</span>
          <div className="ops-ticker-data">
            <span className="ops-ticker-num" style={{ color: pendingCount > 0 ? 'var(--warning-text)' : 'inherit' }}>
              {pendingCount}
            </span>
            <span className="ops-ticker-sub">Awaiting Action</span>
          </div>
          <div className="ops-ticker-meta">
            <span>Requires executive pickup</span>
          </div>
        </div>

        <div className="ops-ticker-cell">
          <span className="ops-ticker-label">03 // IN PROGRESS</span>
          <div className="ops-ticker-data">
            <span className="ops-ticker-num" style={{ color: 'var(--primary)' }}>
              {inProgressCount}
            </span>
            <span className="ops-ticker-sub">Active Execution</span>
          </div>
          <div className="ops-ticker-meta">
            <span>Underway by chapter officers</span>
          </div>
        </div>

        <div className="ops-ticker-cell">
          <span className="ops-ticker-label">04 // COMPLETED</span>
          <div className="ops-ticker-data">
            <span className="ops-ticker-num" style={{ color: 'var(--success-text)' }}>
              {completedCount}
            </span>
            <span className="ops-ticker-sub">Resolved Duties</span>
          </div>
          <div className="ops-ticker-meta">
            <span>{assignments.length > 0 ? `${Math.round((completedCount / assignments.length) * 100)}% completion rate` : '0%'}</span>
          </div>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`calendar-cat-btn ${statusFilter === 'ALL' ? 'calendar-cat-btn-active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            ALL ({assignments.length})
          </button>
          <button
            type="button"
            className={`calendar-cat-btn ${statusFilter === 'PENDING' ? 'calendar-cat-btn-active' : ''}`}
            onClick={() => setStatusFilter('PENDING')}
          >
            PENDING ({pendingCount})
          </button>
          <button
            type="button"
            className={`calendar-cat-btn ${statusFilter === 'IN_PROGRESS' ? 'calendar-cat-btn-active' : ''}`}
            onClick={() => setStatusFilter('IN_PROGRESS')}
          >
            IN PROGRESS ({inProgressCount})
          </button>
          <button
            type="button"
            className={`calendar-cat-btn ${statusFilter === 'COMPLETED' ? 'calendar-cat-btn-active' : ''}`}
            onClick={() => setStatusFilter('COMPLETED')}
          >
            COMPLETED ({completedCount})
          </button>

          <span style={{ borderLeft: '1px solid var(--border-subtle)', margin: '0 4px' }} />

          {executives.length > 0 && (
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="calendar-cat-btn"
              style={{ padding: '4px 8px', fontSize: '11px', outline: 'none' }}
            >
              <option value="ALL">ALL EXECUTIVES</option>
              {executives.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name} ({ex.title || 'Executive'})</option>
              ))}
            </select>
          )}
        </div>

        <div style={{ minWidth: '220px' }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search work assignments…"
            className="input"
            style={{ fontSize: '12px', padding: '6px 12px', width: '100%' }}
          />
        </div>
      </div>

      {/* ── Table of Work Assignments ── */}
      <div className="ops-agenda-table-wrap">
        <table className="ops-agenda-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Priority</th>
              <th style={{ width: '240px' }}>Task Title & Description</th>
              <th style={{ width: '180px' }}>Assignee & Officer</th>
              <th style={{ width: '160px' }}>Linked Event</th>
              <th style={{ width: '100px' }}>Due Date</th>
              <th style={{ width: '130px' }}>Status</th>
              <th style={{ width: '110px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && assignments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px' }}>
                  <LoadingState label="Loading work assignments…" />
                </td>
              </tr>
            ) : filteredAssignments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No work assignments match the selected filters. Click “Assign New Work” to delegate tasks.
                </td>
              </tr>
            ) : (
              filteredAssignments.map((item) => {
                const priorityOpt = PRIORITY_OPTIONS.find((p) => p.value === item.priority) || PRIORITY_OPTIONS[1];
                const statusOpt = STATUS_OPTIONS.find((s) => s.value === item.status) || STATUS_OPTIONS[0];
                const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'COMPLETED';

                return (
                  <tr key={item.id}>
                    <td>
                      <span className={`badge ${priorityOpt.badgeClass}`} style={{ fontSize: '9px' }}>
                        {priorityOpt.label.toUpperCase()}
                      </span>
                    </td>

                    <td>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                        {item.title}
                      </strong>
                      {item.description && (
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '3px 0 0 0', lineHeight: 1.3 }}>
                          {item.description}
                        </p>
                      )}
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                        Delegated by: {item.assigner?.name || 'Core Member'}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          className="dashboard-user-avatar"
                          style={{ width: '26px', height: '26px', fontSize: '10px' }}
                        >
                          {item.assignee?.name?.charAt(0)?.toUpperCase() || 'E'}
                        </span>
                        <div>
                          <strong style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'block' }}>
                            {item.assignee?.name}
                          </strong>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {item.assignee?.title || item.assignee?.department || 'Executive'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {item.event ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.event.title}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Calendar size={10} /> {formatDate(item.event.startsAt)}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Chapter General Duty
                        </span>
                      )}
                    </td>

                    <td className="tnum" style={{ fontSize: '11px' }}>
                      {item.dueDate ? (
                        <span style={{ color: isOverdue ? 'var(--danger-text)' : 'inherit', fontWeight: isOverdue ? 600 : 'normal' }}>
                          {formatDate(item.dueDate)}
                          {isOverdue && <span style={{ display: 'block', fontSize: '9px', color: 'var(--danger-text)' }}>OVERDUE</span>}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>No Due Date</span>
                      )}
                    </td>

                    <td>
                      <select
                        value={item.status}
                        onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                        className={`badge ${statusOpt.badgeClass}`}
                        style={{
                          fontSize: '10px',
                          cursor: 'pointer',
                          border: 'none',
                          padding: '3px 6px',
                          outline: 'none'
                        }}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                        {isCoreOrAdmin && (
                          <>
                            <button
                              type="button"
                              className="icon-button icon-button-ghost"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit work assignment"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              className="icon-button icon-button-ghost"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleDelete(item)}
                              title="Delete work assignment"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: Assign / Edit Work ── */}
      <Modal
        open={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setEditingAssignment(null); onClearPresetAssignee?.(); }}
        eyebrow="OPERATIONAL DELEGATION"
        title={editingAssignment ? `Edit Assignment: ${editingAssignment.title}` : 'Delegate Work Responsibility'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label className="field">
            <span>Assignment Title</span>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Venue sound system setup & speaker microphones"
            />
          </label>

          <label className="field">
            <span>Detailed Instructions & Scope</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detail specific deliverables, timing, or university contacts…"
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label className="field">
              <span>Assign To Executive</span>
              <select
                required
                value={form.assigneeId}
                onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
              >
                <option value="">Select executive officer…</option>
                {executives.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.title || ex.department || 'Executive'})
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Priority Level</span>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent / Critical</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label className="field">
              <span>Linked Chapter Event (Optional)</span>
              <select
                value={form.eventId}
                onChange={(e) => setForm({ ...form, eventId: e.target.value })}
              >
                <option value="">None (General Chapter Duty)</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({formatDate(ev.startsAt)})
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Target Completion Date</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="button button-outline button-compact"
              onClick={() => { setCreateModalOpen(false); setEditingAssignment(null); onClearPresetAssignee?.(); }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary button-compact"
              disabled={submitting}
            >
              {submitting ? 'Saving Task…' : editingAssignment ? 'Save Changes' : 'Assign Responsibility'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Modal ── */}
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
    </section>
  );
}
