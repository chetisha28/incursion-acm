'use client';

import { CircleDollarSign, FileSpreadsheet, PieChart, ShieldAlert, TrendingUp } from 'lucide-react';
import { formatINR, formatNumber } from '@/lib/dates';

export function AnalyticsReports({ dashboard }) {
  if (!dashboard) return null;

  const totalSpent = Number(dashboard.totalExpenses) || 0;
  const currentBudget = dashboard.currentBudget;
  const budgetAllocated = currentBudget ? Number(currentBudget.totalAmount) || 0 : 0;
  const budgetRemaining = currentBudget ? Number(currentBudget.remainingAmount) || 0 : 0;
  const utilizationPct = budgetAllocated > 0 ? Math.min(100, Math.round((totalSpent / budgetAllocated) * 100)) : 0;

  const categories = dashboard.categoryWiseSpending || [];
  const totalCategorySum = categories.reduce((acc, c) => acc + (Number(c.amount) || 0), 0) || 1;

  const totalEvents = dashboard.totalEvents || 0;
  const upcomingEvents = dashboard.upcomingEvents || 0;
  const pastEvents = dashboard.pastEvents || 0;
  const draftEvents = dashboard.draftEvents || 0;
  const cancelledEvents = dashboard.cancelledEvents || 0;
  const conflictCount = dashboard.detectedConflicts?.length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Document Publication Header ── */}
      <div
        style={{
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <span className="section-kicker">TECHNICAL REPORT // REF: ACM-AUDIT-2026-A</span>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {currentBudget?.name || 'ACM Chapter Semester Operational Fund'}
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <span className="micro-label">UTILIZATION STATUS</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong className="tnum" style={{ fontSize: '14px', color: utilizationPct > 85 ? 'var(--danger-text)' : 'var(--text-primary)' }}>
                {utilizationPct}% Burn Rate
              </strong>
              <span className={`badge ${utilizationPct > 85 ? 'badge-danger' : 'badge-primary'}`}>
                {utilizationPct > 85 ? 'CONSTRAINED' : 'NOMINAL'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Financial Statement Table ── */}
      <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
          <span className="micro-label">SECTION 01 // FISCAL SUMMARY STATEMENT</span>
        </div>
        <table className="ops-agenda-table">
          <thead>
            <tr>
              <th>Financial Parameter</th>
              <th style={{ width: '180px' }}>Fiscal Code</th>
              <th style={{ width: '160px', textAlign: 'right' }}>Accounting Value</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Percentage Share</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Authorized Chapter Allocation</strong></td>
              <td className="tnum" style={{ color: 'var(--text-muted)' }}>FUND-ALLOC-SEM</td>
              <td className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{formatINR(budgetAllocated)}</td>
              <td className="tnum" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>100.0%</td>
            </tr>
            <tr>
              <td><strong>Total Disbursements Expended to Date</strong></td>
              <td className="tnum" style={{ color: 'var(--text-muted)' }}>EXP-DISBURSED-ACTUAL</td>
              <td className="tnum" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{formatINR(totalSpent)}</td>
              <td className="tnum" style={{ textAlign: 'right' }}>{utilizationPct}%</td>
            </tr>
            <tr style={{ background: 'var(--bg-subtle)' }}>
              <td><strong>Uncommitted Liquid Reserve Available</strong></td>
              <td className="tnum" style={{ color: 'var(--text-muted)' }}>CAPITAL-RESERVE-NET</td>
              <td className="tnum" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatINR(budgetRemaining)}</td>
              <td className="tnum" style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 600 }}>{100 - utilizationPct}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Two-Column Breakdown: Categories & Velocity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px' }}>
        {/* Category Breakdown Table */}
        <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
            <span className="micro-label">SECTION 02 // CATEGORY DISBURSEMENT SCHEDULE</span>
          </div>

          {categories.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              No recorded expenses for category classification yet.
            </div>
          ) : (
            <table className="ops-agenda-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>Amount</th>
                  <th style={{ width: '60px', textAlign: 'right' }}>Share</th>
                  <th style={{ width: '120px' }}>Distribution</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((item) => {
                  const itemAmount = Number(item.amount) || 0;
                  const pct = Math.round((itemAmount / totalCategorySum) * 100);
                  return (
                    <tr key={item.category}>
                      <td><span style={{ fontWeight: 600 }}>{item.category}</span></td>
                      <td className="tnum" style={{ textAlign: 'right' }}>{formatINR(item.amount)}</td>
                      <td className="tnum" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{pct}%</td>
                      <td>
                        <div style={{ height: '5px', background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)' }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Operational Register Velocity */}
        <div style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
            <span className="micro-label">SECTION 03 // SCHEDULING REGISTER AUDIT</span>
          </div>

          <table className="ops-agenda-table">
            <thead>
              <tr>
                <th>Operational Metric</th>
                <th style={{ width: '80px', textAlign: 'right' }}>Count</th>
                <th style={{ width: '110px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Published Active Agenda</td>
                <td className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{upcomingEvents}</td>
                <td style={{ textAlign: 'right' }}><span className="badge badge-primary">ACTIVE</span></td>
              </tr>
              <tr>
                <td>Archived Historical Events</td>
                <td className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{pastEvents}</td>
                <td style={{ textAlign: 'right' }}><span className="badge badge-default">COMPLETED</span></td>
              </tr>
              <tr>
                <td>Submissions in Core Review</td>
                <td className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{draftEvents}</td>
                <td style={{ textAlign: 'right' }}><span className="badge badge-warning">PENDING</span></td>
              </tr>
              <tr>
                <td>Cancelled / Overridden</td>
                <td className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{cancelledEvents}</td>
                <td style={{ textAlign: 'right' }}><span className="badge badge-default">INACTIVE</span></td>
              </tr>
              <tr style={{ background: conflictCount > 0 ? '#fdf6f6' : 'var(--bg-subtle)' }}>
                <td>Active Scheduling Concurrency Clashes</td>
                <td className="tnum" style={{ textAlign: 'right', fontWeight: 700, color: conflictCount > 0 ? 'var(--danger-text)' : 'var(--success-text)' }}>
                  {conflictCount}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className={`badge ${conflictCount > 0 ? 'badge-danger' : 'badge-success'}`}>
                    {conflictCount > 0 ? 'COLLISION' : 'CLEARED'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
