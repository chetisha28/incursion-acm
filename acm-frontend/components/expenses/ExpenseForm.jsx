'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, IndianRupee, LoaderCircle, ReceiptText } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { toLocalInput, localInputToIso } from '@/lib/dates';

const DEFAULT_CATEGORIES = [
  'Food & Catering',
  'Logistics & Venue',
  'Speaker Honorarium',
  'Prizes & Swag',
  'Audio & Visual',
  'Marketing & Printing',
  'Workshop Supplies',
  'Miscellaneous'
];

export function ExpenseForm({ open, expense, events = [], onClose, onSave }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [transactionDate, setTransactionDate] = useState('');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (expense) {
      setAmount(expense.amount ? String(expense.amount) : '');
      setCategory(expense.category || DEFAULT_CATEGORIES[0]);
      setTransactionDate(expense.transactionDate ? toLocalInput(expense.transactionDate, 'UTC') : '');
      setDescription(expense.description || '');
      setEventId(expense.eventId || '');
      setReceiptUrl(expense.receiptUrl || '');
    } else {
      setAmount('');
      setCategory(DEFAULT_CATEGORIES[0]);
      setTransactionDate(toLocalInput(new Date().toISOString(), 'UTC'));
      setDescription('');
      setEventId('');
      setReceiptUrl('');
    }
  }, [open, expense]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanAmount = amount.trim();
    if (!cleanAmount || Number.isNaN(Number(cleanAmount)) || Number(cleanAmount) <= 0) {
      setError('Enter a valid positive amount.');
      return;
    }

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    if (receiptUrl.trim() && !receiptUrl.trim().startsWith('https://')) {
      setError('Receipt URL must start with https://');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        amount: cleanAmount,
        category: category.trim(),
        transactionDate: localInputToIso(transactionDate, 'UTC'),
        description: description.trim(),
        eventId: eventId ? eventId : null,
        receiptUrl: receiptUrl.trim() ? receiptUrl.trim() : null
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to submit expense.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={expense ? 'FINANCE / EDIT' : 'FINANCE / SUBMIT'}
      title={expense ? 'Update Expense Record' : 'Record Chapter Expense'}
      size="wide"
    >
      <form className="event-form" onSubmit={handleSubmit}>
        <div className="form-grid form-grid-two">
          <label className="field">
            <span>
              <IndianRupee size={13} />
              Amount (INR ₹) <b>*</b>
            </span>
            <input
              type="text"
              required
              placeholder="e.g. 2500.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Category <b>*</b></span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Transaction Date <b>*</b></span>
            <input
              type="datetime-local"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Associated Campus Event</span>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              <option value="">None / General Chapter Overhead</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.category})
                </option>
              ))}
            </select>
          </label>

          <label className="field field-wide">
            <span>
              <ReceiptText size={13} />
              Receipt / Bill URL (Optional)
            </span>
            <input
              type="url"
              placeholder="https://drive.google.com/... or https://res.cloudinary.com/..."
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
            />
          </label>

          <label className="field field-wide">
            <span>Description & Purpose <b>*</b></span>
            <textarea
              required
              rows={3}
              placeholder="Explain the purchase purpose, vendor name, or invoice reference..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
          <span>
            Fields marked <b>*</b> are required
          </span>
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
              {saving ? 'Saving…' : expense ? 'Update Record' : 'Record Expense'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
