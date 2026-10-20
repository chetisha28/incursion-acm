'use client';

import { useState } from 'react';
import { Eye, EyeOff, KeyRound, LoaderCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';

export function ChangePasswordModal({ open, onClose, token, onPasswordChanged, isForced = false }) {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (currentPassword && currentPassword === newPassword) {
      setError('New password cannot be the same as your current temporary password.');
      return;
    }

    setSubmitting(true);
    try {
      await api.changePassword(
        {
          currentPassword,
          newPassword
        },
        token
      );
      toast('Your password has been successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onPasswordChanged?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Could not update password. Please verify your current password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={isForced ? undefined : onClose}
      eyebrow="SECURITY & ACCESS CONTROL"
      title={isForced ? 'Establish Personal Password' : 'Change Account Password'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {isForced && (
          <div
            style={{
              background: 'var(--warning-bg, rgba(230, 81, 0, 0.08))',
              border: '1px solid var(--warning-border, rgba(230, 81, 0, 0.2))',
              padding: '12px 14px',
              borderRadius: '4px',
              fontSize: '12px',
              color: 'var(--text-primary)',
              lineHeight: 1.4
            }}
          >
            <strong>First-Time Sign-In Requirement:</strong> For security compliance, please replace your temporary credentials with a secure personal password.
          </div>
        )}

        <label className="field">
          <span>Current / Temporary Password</span>
          <span className="password-input">
            <input
              type={showCurrent ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current or temporary password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </span>
        </label>

        <label className="field">
          <span>New Password (Min. 8 characters)</span>
          <span className="password-input">
            <input
              type={showNew ? 'text' : 'password'}
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Choose a strong personal password"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </span>
        </label>

        <label className="field">
          <span>Confirm New Password</span>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-type your new password"
          />
        </label>

        {error && (
          <p className="login-error" role="alert" style={{ margin: '4px 0 0 0' }}>
            <ShieldAlert size={14} />
            {error}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          {!isForced && (
            <button
              type="button"
              className="button button-outline button-compact"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="button button-primary button-compact"
            disabled={submitting}
          >
            {submitting ? 'Updating Password…' : 'Save New Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
