'use client';

import { ExternalLink, FileText, Pencil, Trash2 } from 'lucide-react';
import { formatDate, formatINR } from '@/lib/dates';

export function ExpenseTable({ expenses = [], role, onEdit, onArchive }) {
  if (!expenses.length) {
    return (
      <div className="state-panel state-empty">
        <span className="state-index">FINANCIAL LEDGER // AUDIT LOG</span>
        <h3>Zero Recorded Transactions</h3>
        <p>No chapter expenditures or disbursements have been registered for this accounting cycle yet.</p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '80px' }}>Entry ID</th>
            <th style={{ width: '100px' }}>Date</th>
            <th style={{ width: '140px' }}>Category</th>
            <th>Description & Payee</th>
            <th style={{ width: '220px' }}>Cost Center / Event</th>
            <th style={{ width: '110px' }}>Receipt Doc</th>
            <th className="table-currency" style={{ width: '130px' }}>Amount (INR)</th>
            {role === 'CORE' && <th style={{ width: '80px', textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense, idx) => (
            <tr key={expense.id}>
              <td className="tnum" style={{ color: 'var(--text-faint)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                #{String(idx + 1).padStart(3, '0')}
              </td>
              <td className="tnum" style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                {formatDate(expense.transactionDate)}
              </td>
              <td>
                <span className="badge badge-default">
                  {expense.category}
                </span>
              </td>
              <td>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {expense.description}
                </span>
              </td>
              <td>
                {expense.event ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {expense.event.title}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    [OVERHEAD / GENERAL]
                  </span>
                )}
              </td>
              <td>
                {expense.receiptUrl ? (
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button-outline button-compact"
                    style={{ gap: '4px', fontSize: '10px', height: '24px', padding: '0 8px' }}
                  >
                    <FileText size={11} /> View Receipt <ExternalLink size={10} />
                  </a>
                ) : (
                  <span style={{ color: 'var(--text-faint)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>None</span>
                )}
              </td>
              <td className="table-currency tnum" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatINR(expense.amount)}
              </td>
              {role === 'CORE' && (
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="icon-button icon-button-ghost"
                      onClick={() => onEdit?.(expense)}
                      aria-label="Edit expense record"
                      title="Edit record"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      className="icon-button icon-button-ghost"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => onArchive?.(expense)}
                      aria-label="Archive expense record"
                      title="Archive record"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
