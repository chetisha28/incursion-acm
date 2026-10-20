'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Mail,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { LoadingState } from '@/components/ui/LoadingState';

function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  let pwd = '';
  // ensure at least one upper, lower, digit, special
  pwd += 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)];
  pwd += 'abcdefghijkmnopqrstuvwxyz'[Math.floor(Math.random() * 24)];
  pwd += '23456789'[Math.floor(Math.random() * 8)];
  pwd += '!@#$%&*'[Math.floor(Math.random() * 7)];
  for (let i = 0; i < 8; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd.split('').sort(() => 0.5 - Math.random()).join('');
}

export function TeamManagement({
  users = [],
  currentUser,
  token,
  onRefresh,
  loading = false,
  onAssignWork
}) {
  const toast = useToast();

  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTargetRole, setCreateTargetRole] = useState('EXECUTIVE');
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    role: 'EXECUTIVE',
    title: '',
    department: 'Technical',
    password: '',
    autoGenerate: true,
    mustChangePassword: true
  });
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    title: '',
    department: '',
    isActive: true,
    newPassword: '',
    mustChangePassword: false
  });

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirming: false,
    onConfirm: null
  });

  const canManageCore = currentUser?.role === 'ADMIN' || currentUser?.role === 'CORE';

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (statusFilter === 'ACTIVE' && !u.isActive) return false;
      if (statusFilter === 'INACTIVE' && u.isActive) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = u.name?.toLowerCase().includes(query);
        const matchesEmail = u.email?.toLowerCase().includes(query);
        const matchesTitle = u.title?.toLowerCase().includes(query);
        const matchesDept = u.department?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesTitle && !matchesDept) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, search]);

  // Statistics
  const totalCount = users.length;
  const coreCount = users.filter((u) => u.role === 'CORE' || u.role === 'ADMIN').length;
  const execCount = users.filter((u) => u.role === 'EXECUTIVE').length;
  const pendingResetCount = users.filter((u) => u.mustChangePassword).length;

  const handleOpenCreate = (role = 'EXECUTIVE') => {
    const generated = generateRandomPassword();
    setCreateTargetRole(role);
    setCreateForm({
      name: '',
      email: '',
      role,
      title: role === 'CORE' ? 'Core Lead Coordinator' : 'Chapter Executive',
      department: 'Technical',
      password: generated,
      autoGenerate: true,
      mustChangePassword: true
    });
    setCreatedCredentials(null);
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: createForm.name.trim(),
        email: createForm.email.trim().toLowerCase(),
        role: createForm.role,
        title: createForm.title.trim() || undefined,
        department: createForm.department.trim() || undefined,
        password: createForm.password || generateRandomPassword(),
        mustChangePassword: Boolean(createForm.mustChangePassword)
      };

      const res = await api.createUser(payload, token);
      const generatedPwd = res.data.generatedPassword || payload.password;

      toast(`Account successfully created for ${createForm.name}.`);
      setCreatedCredentials({
        name: createForm.name,
        email: createForm.email,
        role: createForm.role,
        password: generatedPwd
      });
      onRefresh?.();
    } catch (err) {
      toast(err.message || 'Failed to create user account.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      title: user.title || '',
      department: user.department || '',
      isActive: user.isActive !== false,
      newPassword: '',
      mustChangePassword: Boolean(user.mustChangePassword)
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        title: editForm.title.trim() || null,
        department: editForm.department.trim() || null,
        isActive: Boolean(editForm.isActive),
        mustChangePassword: Boolean(editForm.mustChangePassword)
      };
      if (editForm.newPassword) {
        payload.password = editForm.newPassword;
      }

      await api.updateUser(editingUser.id, payload, token);
      toast(`Account profile updated for ${editForm.name}.`);
      setEditModalOpen(false);
      setEditingUser(null);
      onRefresh?.();
    } catch (err) {
      toast(err.message || 'Failed to update user profile.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = (user) => {
    const nextState = !user.isActive;
    const actionText = nextState ? 'activate' : 'deactivate';

    setConfirmModal({
      open: true,
      title: `${nextState ? 'Activate' : 'Deactivate'} ${user.name}?`,
      message: nextState
        ? `Re-activating ${user.name} will restore their login access and ability to coordinate chapter events.`
        : `Deactivating ${user.name} will immediately revoke their access and terminate any active sessions. Historical audit trails will remain preserved.`,
      confirmLabel: nextState ? 'Activate Account' : 'Deactivate Account',
      confirmTone: nextState ? 'primary' : 'danger',
      confirming: false,
      onConfirm: async () => {
        setConfirmModal((curr) => ({ ...curr, confirming: true }));
        try {
          await api.updateUser(user.id, { isActive: nextState }, token);
          toast(`Account ${user.name} was successfully ${actionText}d.`);
          setConfirmModal((curr) => ({ ...curr, open: false, confirming: false }));
          onRefresh?.();
        } catch (err) {
          toast(err.message || `Could not ${actionText} user account.`, 'error');
          setConfirmModal((curr) => ({ ...curr, confirming: false }));
        }
      }
    });
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `ACM Chapter Credentials:\nName: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nRole: ${createdCredentials.role}\nTemporary Password: ${createdCredentials.password}\nPortal: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast('Credentials copied to clipboard.');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <section className="ops-team-management" aria-label="Chapter Team and Executive Management">
      {/* ── View Masthead ── */}
      <div className="ops-view-masthead">
        <div>
          <p className="section-kicker">GOVERNANCE & DELEGATION // DIV. 01</p>
          <h2>Chapter Leadership & Executive Accounts</h2>
          <p className="dashboard-subtitle">
            Manage authorized Core administrators and create dedicated credentials for Chapter Executives to delegate work and event logistics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="button button-outline button-compact"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw size={12} className={loading ? 'spin' : ''} /> {loading ? 'Syncing…' : 'Sync Team'}
          </button>

          <button
            type="button"
            className="button button-secondary button-compact"
            onClick={() => handleOpenCreate('CORE')}
            title="Create an additional Core member account"
          >
            <ShieldCheck size={13} /> Add Core Member
          </button>

          <button
            type="button"
            className="button button-primary button-compact"
            onClick={() => handleOpenCreate('EXECUTIVE')}
            title="Create an Executive account with secure login credentials"
          >
            <UserPlus size={13} /> Add Executive
          </button>
        </div>
      </div>

      {/* ── Metric Ribbon ── */}
      <div className="ops-ticker-ribbon" style={{ marginBottom: '24px' }}>
        <div className="ops-ticker-cell">
          <span className="ops-ticker-label">01 // TOTAL ACCOUNTS</span>
          <div className="ops-ticker-data">
            <span className="ops-ticker-num">{totalCount}</span>
            <span className="ops-ticker-sub">Registered Staff</span>
          </div>
          <div className="ops-ticker-meta">
            <span>{coreCount} Core Admins</span>
            <span className="meta-sep">/</span>
            <span>{execCount} Executives</span>
          </div>
        </div>

        <div className="ops-ticker-cell">
          <span className="ops-ticker-label">02 // ACTIVE EXECUTIVES</span>
          <div className="ops-ticker-data">
            <span className="ops-ticker-num" style={{ color: 'var(--success-text)' }}>
              {users.filter((u) => u.role === 'EXECUTIVE' && u.isActive).length}
            </span>
            <span className="ops-ticker-sub">Operational Officers</span>
          </div>
          <div className="ops-ticker-meta">
            <span>Ready for work delegation</span>
          </div>
        </div>

        <div className="ops-ticker-cell">
          <span className="ops-ticker-label">03 // CORE MEMBERSHIP</span>
          <div className="ops-ticker-data">
            <span className="ops-ticker-num">{coreCount}</span>
            <span className="ops-ticker-sub">Multi-Core Enabled</span>
          </div>
          <div className="ops-ticker-meta">
            <span>Concurrent Desk Access</span>
          </div>
        </div>

        <div className="ops-ticker-cell">
          <span className="ops-ticker-label">04 // FIRST LOGIN AUDIT</span>
          <div className="ops-ticker-data">
            <span className="ops-ticker-num" style={{ color: pendingResetCount > 0 ? 'var(--warning-text)' : 'var(--text-muted)' }}>
              {pendingResetCount}
            </span>
            <span className="ops-ticker-sub">Password Changes Pending</span>
          </div>
          <div className="ops-ticker-meta">
            <span>{pendingResetCount === 0 ? 'All accounts secured' : 'Enforce initial password reset'}</span>
          </div>
        </div>
      </div>

      {/* ── Filter Controls ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`calendar-cat-btn ${roleFilter === 'ALL' ? 'calendar-cat-btn-active' : ''}`}
            onClick={() => setRoleFilter('ALL')}
          >
            ALL ROLES ({totalCount})
          </button>
          <button
            type="button"
            className={`calendar-cat-btn ${roleFilter === 'CORE' ? 'calendar-cat-btn-active' : ''}`}
            onClick={() => setRoleFilter('CORE')}
          >
            CORE MEMBERS ({coreCount})
          </button>
          <button
            type="button"
            className={`calendar-cat-btn ${roleFilter === 'EXECUTIVE' ? 'calendar-cat-btn-active' : ''}`}
            onClick={() => setRoleFilter('EXECUTIVE')}
          >
            EXECUTIVES ({execCount})
          </button>
          <span style={{ borderLeft: '1px solid var(--border-subtle)', margin: '0 4px' }} />
          <button
            type="button"
            className={`calendar-cat-btn ${statusFilter === 'ALL' ? 'calendar-cat-btn-active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            ALL STATUS
          </button>
          <button
            type="button"
            className={`calendar-cat-btn ${statusFilter === 'ACTIVE' ? 'calendar-cat-btn-active' : ''}`}
            onClick={() => setStatusFilter('ACTIVE')}
          >
            ACTIVE ONLY
          </button>
          <button
            type="button"
            className={`calendar-cat-btn ${statusFilter === 'INACTIVE' ? 'calendar-cat-btn-active' : ''}`}
            onClick={() => setStatusFilter('INACTIVE')}
          >
            INACTIVE ONLY
          </button>
        </div>

        <div style={{ minWidth: '240px' }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, department…"
            className="input"
            style={{ fontSize: '12px', padding: '6px 12px', width: '100%' }}
          />
        </div>
      </div>

      {/* ── Members Table ── */}
      <div className="ops-agenda-table-wrap">
        <table className="ops-agenda-table">
          <thead>
            <tr>
              <th style={{ width: '220px' }}>Member & Identification</th>
              <th style={{ width: '150px' }}>Designation & Role</th>
              <th style={{ width: '140px' }}>Department</th>
              <th style={{ width: '110px' }}>Work Items</th>
              <th style={{ width: '130px' }}>Security Status</th>
              <th style={{ width: '90px' }}>Status</th>
              <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px' }}>
                  <LoadingState label="Loading chapter team accounts…" />
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No chapter accounts matched your criteria. Use “Add Executive” or “Add Core Member” above to register staff.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isSelf = user.id === currentUser?.id;
                const assignedWorkCount = user._count?.assignedWork || user.assignedWork?.length || 0;
                const createdEventsCount = user._count?.createdEvents || 0;

                return (
                  <tr key={user.id} style={{ opacity: user.isActive ? 1 : 0.65 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          className="dashboard-user-avatar"
                          style={{
                            width: '32px',
                            height: '32px',
                            fontSize: '12px',
                            background: user.role === 'ADMIN' ? 'var(--primary)' : user.role === 'CORE' ? 'var(--text-primary)' : 'var(--bg-muted)',
                            color: user.role === 'ADMIN' || user.role === 'CORE' ? '#fff' : 'var(--text-primary)'
                          }}
                        >
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                        <div>
                          <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
                            {user.name}
                            {isSelf && (
                              <span className="badge badge-default" style={{ marginLeft: '6px', fontSize: '9px', padding: '1px 4px' }}>
                                YOU
                              </span>
                            )}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Mail size={11} /> {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>
                          {user.title || (user.role === 'CORE' ? 'Core Lead' : 'Chapter Officer')}
                        </span>
                        <span style={{ display: 'inline-flex' }}>
                          {user.role === 'ADMIN' ? (
                            <span className="badge badge-primary" style={{ fontSize: '9px' }}>
                              SYSTEM ADMIN
                            </span>
                          ) : user.role === 'CORE' ? (
                            <span className="badge badge-default" style={{ fontSize: '9px' }}>
                              CORE DESK
                            </span>
                          ) : (
                            <span className="badge badge-warning" style={{ fontSize: '9px' }}>
                              EXECUTIVE
                            </span>
                          )}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="micro-label" style={{ color: 'var(--text-secondary)' }}>
                        {user.department || 'General'}
                      </span>
                      {user.createdByAdmin && (
                        <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>
                          By: {user.createdByAdmin.name}
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontSize: '11px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Briefcase size={12} style={{ color: assignedWorkCount > 0 ? 'var(--primary)' : 'inherit' }} />
                          <strong>{assignedWorkCount}</strong> active tasks
                        </span>
                        {createdEventsCount > 0 && (
                          <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '10px' }}>
                            {createdEventsCount} proposed events
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      {user.mustChangePassword ? (
                        <span className="badge badge-warning" style={{ fontSize: '9px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <KeyRound size={9} /> Reset On First Login
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ fontSize: '9px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <ShieldCheck size={9} /> Password Active
                        </span>
                      )}
                    </td>

                    <td>
                      {user.isActive ? (
                        <span className="badge badge-success" style={{ fontSize: '9px' }}>ACTIVE</span>
                      ) : (
                        <span className="badge badge-danger" style={{ fontSize: '9px' }}>INACTIVE</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                        {user.role === 'EXECUTIVE' && user.isActive && onAssignWork && (
                          <button
                            type="button"
                            className="button button-compact button-secondary"
                            style={{ height: '24px', fontSize: '10px', padding: '0 6px', gap: '3px' }}
                            onClick={() => onAssignWork(user)}
                            title="Assign a work responsibility to this executive"
                          >
                            <Plus size={10} /> Assign Task
                          </button>
                        )}

                        <button
                          type="button"
                          className="icon-button icon-button-ghost"
                          onClick={() => handleOpenEdit(user)}
                          title="Edit officer details"
                        >
                          <Pencil size={12} />
                        </button>

                        {!isSelf && (
                          <button
                            type="button"
                            className="icon-button icon-button-ghost"
                            style={{ color: user.isActive ? 'var(--warning-text)' : 'var(--success-text)' }}
                            onClick={() => handleToggleActive(user)}
                            title={user.isActive ? 'Deactivate account' : 'Re-activate account'}
                          >
                            {user.isActive ? <UserX size={12} /> : <UserCheck size={12} />}
                          </button>
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

      {/* ── Modal: Create Account ── */}
      <Modal
        open={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setCreatedCredentials(null); }}
        eyebrow="ACCESS CONTROL & DELEGATION"
        title={createdCredentials ? 'Account Created Successfully' : `Register New ${createTargetRole === 'CORE' ? 'Core Member' : 'Chapter Executive'}`}
      >
        {createdCredentials ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                background: 'var(--success-bg, rgba(46, 125, 50, 0.08))',
                border: '1px solid var(--success-border, rgba(46, 125, 50, 0.2))',
                padding: '16px',
                borderRadius: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  Credentials generated for {createdCredentials.name}
                </strong>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Provide these login credentials to the user. On their first sign-in, the system will prompt them to securely establish their personal password.
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}
            >
              <div><strong>Role:</strong> {createdCredentials.role}</div>
              <div><strong>Email:</strong> {createdCredentials.email}</div>
              <div><strong>Temporary Password:</strong> <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{createdCredentials.password}</span></div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                type="button"
                className="button button-secondary button-compact"
                onClick={handleCopyCredentials}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
              </button>
              <button
                type="button"
                className="button button-primary button-compact"
                onClick={() => { setCreateModalOpen(false); setCreatedCredentials(null); }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label className="field">
              <span>Full Name</span>
              <input
                type="text"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="e.g. Alex Rivera"
              />
            </label>

            <label className="field">
              <span>Official Email Address</span>
              <input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="e.g. alex.rivera@acm.org"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label className="field">
                <span>Account Role</span>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  disabled={!canManageCore}
                >
                  <option value="EXECUTIVE">Executive Officer</option>
                  {canManageCore && <option value="CORE">Core Member Administrator</option>}
                </select>
              </label>

              <label className="field">
                <span>Department</span>
                <input
                  type="text"
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  placeholder="e.g. Technical, Logistics"
                />
              </label>
            </div>

            <label className="field">
              <span>Title / Official Designation</span>
              <input
                type="text"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="e.g. Lead Technical Coordinator"
              />
            </label>

            <label className="field">
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Initial Temporary Password</span>
                <button
                  type="button"
                  className="text-link"
                  style={{ fontSize: '11px' }}
                  onClick={() => setCreateForm({ ...createForm, password: generateRandomPassword() })}
                >
                  <Sparkles size={11} /> Regenerate
                </button>
              </span>
              <input
                type="text"
                required
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                style={{ fontFamily: 'monospace' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', marginTop: '4px' }}>
              <input
                type="checkbox"
                checked={createForm.mustChangePassword}
                onChange={(e) => setCreateForm({ ...createForm, mustChangePassword: e.target.checked })}
              />
              <span>Require password reset upon first sign-in (Recommended)</span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="button button-outline button-compact"
                onClick={() => setCreateModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button-primary button-compact"
                disabled={submitting}
              >
                {submitting ? 'Generating Account…' : 'Create Account'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Modal: Edit Account ── */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        eyebrow="PROFILE MANAGEMENT"
        title={`Edit Profile: ${editingUser?.name}`}
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label className="field">
            <span>Full Name</span>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label className="field">
              <span>Title / Designation</span>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Department</span>
              <input
                type="text"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              />
            </label>
          </div>

          <label className="field">
            <span>Reset Password (Optional)</span>
            <input
              type="password"
              placeholder="Leave blank to keep existing password"
              value={editForm.newPassword}
              onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              />
              <span>Account is Active and authorized to log in</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editForm.mustChangePassword}
                onChange={(e) => setEditForm({ ...editForm, mustChangePassword: e.target.checked })}
              />
              <span>Force password change on next login</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="button button-outline button-compact"
              onClick={() => setEditModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary button-compact"
              disabled={submitting}
            >
              {submitting ? 'Saving Changes…' : 'Save Changes'}
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
