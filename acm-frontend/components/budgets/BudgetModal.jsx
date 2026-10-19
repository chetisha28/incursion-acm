'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, IndianRupee, LoaderCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { localInputToIso, toLocalInput } from '@/lib/dates';

export function BudgetModal({ open, budget, onClose, onSave }) {
  const [name, setName] = useState('');
  const [period, setPeriod] = useState('SEMESTER');
  const [totalAmount, setTotalAmount] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (budget) {
      setName(budget.name || '');
      setPeriod(budget.period || 'SEMESTER');
      setTotalAmount(budget.totalAmount ? String(budget.totalAmount) : '');
      setStartsAt(budget.startsAt ? toLocalInput(budget.startsAt, 'UTC') : '');
      setEndsAt(budget.endsAt ? toLocalInput(budget.endsAt, 'UTC') : '');
    } else {
      const now = new Date();
      const sixMonths = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
      setName('ACM 2026-27 Semester Budget');
      setPeriod('SEMESTER');
      setTotalAmount('75000.00');
      setStartsAt(toLocalInput(now.toISOString(), 'UTC'));
      setEndsAt(toLocalInput(sixMonths.toISOString(), 'UTC'));
    }
  }, [open, budget]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanAmount = totalAmount.trim();
    if (!cleanAmount || Number.isNaN(Number(cleanAmount)) || Number(cleanAmount) <= 0) {
      setError('Enter a valid positive budget amount.');
      return;
    }

    if (new Date(endsAt) <= new Date(startsAt)) {
      setError('Budget end date must be after the start date.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        period,
        totalAmount: cleanAmount,
        startsAt: localInputToIso(startsAt, 'UTC'),
        endsAt: localInputToIso(endsAt, 'UTC')
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save budget.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={budget ? 'BUDGET / UPDATE' : 'BUDGET / ALLOCATION'}
      title={budget ? 'Update Budget Allocation' : 'Establish Chapter Budget'}
      size="wide"
    >
      <form className="event-form" onSubmit={handleSubmit}>
        <div className="form-grid form-grid-two">
          <label className="field field-wide">
            <span>Budget Plan Name <b>*</b></span>
            <input
              type="text"
              required
              placeholder="e.g. ACM Spring Semester Operational Fund"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Period Type <b>*</b></span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="SEMESTER">Semester Budget</option>
              <option value="MONTHLY">Monthly Budget</option>
            </select>
          </label>

          <label className="field">
            <span>
              <IndianRupee size={13} />
              Total Allocation (INR ₹) <b>*</b>
            </span>
            <input
              type="text"
              required
              placeholder="e.g. 100000.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Effective Start Date <b>*</b></span>
            <input
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Effective End Date <b>*</b></span>
            <input
              type="datetime-local"
              required
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </label>
        </div>

        {error && (
          <div className="form-error" role="alert">
            <AlertTriangle size={16} />
            <div>
              <strong>Validation Error</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="form-footer">
          <span>Fields marked <b>*</b> are required</span>
          <div>
            <button
              className="button button-secondary"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="button button-primary"
              type="submit"
              disabled={saving}
            >
              {saving && <LoaderCircle className="spin" size={15} />}
              {saving ? 'Saving…' : budget ? 'Update Budget' : 'Activate Budget'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
