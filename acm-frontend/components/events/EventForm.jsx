'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Info, LoaderCircle, MapPin, Tag, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ApiError } from '@/lib/api';
import { formatDate, formatRange, formatTime, localInputToIso, safeZone, toLocalInput } from '@/lib/dates';

const PRESET_CATEGORIES = [
  'WORKSHOP',
  'HACKATHON',
  'TALK',
  'SEMINAR',
  'COMPETITION',
  'SOCIAL',
  'GENERAL'
];

const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST · UTC+5:30)' },
  { value: 'UTC', label: 'UTC (Universal Coordinated Time)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT · UTC+8)' }
];

function blankForm() {
  return {
    title: '',
    description: '',
    category: 'WORKSHOP',
    customCategory: '',
    startsAt: '',
    endsAt: '',
    timezone: 'Asia/Kolkata',
    venue: '',
    expectedAudience: '',
    organizer: 'ACM Student Chapter',
    campusRelevant: false,
    status: 'PUBLISHED',
    resolutionNotes: ''
  };
}

function initialForm(event) {
  if (!event) return blankForm();
  const isCustom = !PRESET_CATEGORIES.includes(String(event.category || '').toUpperCase());
  return {
    title: event.title || '',
    description: event.description || '',
    category: isCustom ? 'OTHER' : String(event.category || 'WORKSHOP').toUpperCase(),
    customCategory: isCustom ? (event.category || '') : '',
    startsAt: toLocalInput(event.startsAt, event.timezone),
    endsAt: toLocalInput(event.endsAt, event.timezone),
    timezone: event.timezone || 'Asia/Kolkata',
    venue: event.venue || '',
    expectedAudience: event.expectedAudience || '',
    organizer: event.organizer || 'ACM Student Chapter',
    campusRelevant: Boolean(event.campusRelevant),
    status: event.status || 'PUBLISHED',
    resolutionNotes: event.resolutionNotes || ''
  };
}

export function EventForm({ open, event, role, onClose, onSave }) {
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [canOverride, setCanOverride] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm(event));
    setError(null);
    setFieldErrors({});
    setConflicts([]);
    setCanOverride(false);
    if (!event) {
      const clientZone = safeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      setForm((current) => ({
        ...current,
        timezone: clientZone || 'Asia/Kolkata'
      }));
    }
  }, [open, event]);

  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      errs.title = 'Event title is required.';
    } else if (trimmedTitle.length < 3) {
      errs.title = 'Event title must be at least 3 characters long.';
    } else if (/^[\d\s\W]+$/.test(trimmedTitle)) {
      errs.title = 'Event title must contain meaningful descriptive words, not just numbers or symbols.';
    }

    const trimmedDesc = form.description.trim();
    if (!trimmedDesc) {
      errs.description = 'Event description is required.';
    } else if (trimmedDesc.length < 10) {
      errs.description = 'Please provide a descriptive explanation (at least 10 characters).';
    }

    if (form.category === 'OTHER' && !form.customCategory.trim()) {
      errs.category = 'Please specify a category name.';
    }

    const trimmedVenue = form.venue.trim();
    if (!trimmedVenue) {
      errs.venue = 'Venue or location is required.';
    } else if (trimmedVenue.length < 2) {
      errs.venue = 'Venue name must be at least 2 characters.';
    }

    const trimmedOrg = form.organizer.trim();
    if (!trimmedOrg) {
      errs.organizer = 'Organizing team or division is required.';
    }

    const trimmedAudience = form.expectedAudience.trim();
    if (!trimmedAudience) {
      errs.expectedAudience = 'Please specify who this event is designed for.';
    }

    if (!form.startsAt) {
      errs.startsAt = 'Start date and time is required.';
    }

    if (!form.endsAt) {
      errs.endsAt = 'End date and time is required.';
    }

    if (form.startsAt && form.endsAt) {
      const start = new Date(form.startsAt);
      const end = new Date(form.endsAt);
      if (isNaN(start.getTime())) {
        errs.startsAt = 'Invalid start date format.';
      }
      if (isNaN(end.getTime())) {
        errs.endsAt = 'Invalid end date format.';
      }
      if (start && end && end <= start) {
        errs.endsAt = 'End time must be later than the start time.';
      }
      const diffMs = end.getTime() - start.getTime();
      if (diffMs > 14 * 24 * 60 * 60 * 1000) {
        errs.endsAt = 'Event duration cannot exceed 14 consecutive days.';
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (override = false) => {
    setError(null);
    setConflicts([]);
    if (!validate()) return;

    const finalCategory = form.category === 'OTHER'
      ? form.customCategory.trim().toUpperCase()
      : form.category;

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: finalCategory,
        startsAt: localInputToIso(form.startsAt, form.timezone),
        endsAt: localInputToIso(form.endsAt, form.timezone),
        timezone: form.timezone,
        venue: form.venue.trim(),
        expectedAudience: form.expectedAudience.trim(),
        organizer: form.organizer.trim(),
        campusRelevant: form.campusRelevant
      };

      if (role === 'CORE') {
        payload.status = form.status;
        if (form.resolutionNotes.trim()) {
          payload.resolutionNotes = form.resolutionNotes.trim();
        }
      }

      // Allow conflict override for both CORE and EXECUTIVE when confirmed
      if (override) {
        payload.allowConflict = true;
      }

      await onSave(payload);
      onClose();
    } catch (saveError) {
      setError({
        message: saveError?.message || 'The event could not be saved.',
        details: saveError?.details
      });

      if (saveError instanceof ApiError && saveError.code === 'SCHEDULING_CONFLICT') {
        setConflicts(Array.isArray(saveError.details) ? saveError.details : []);
        // Both Executive and Core are allowed to proceed after viewing the warning
        setCanOverride(true);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={event ? 'EVENT // EDIT' : 'EVENT // SUBMISSION'}
      title={event ? 'Update Scheduled Event' : 'Schedule Chapter Event'}
      size="wide"
    >
      <form
        className="event-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit(false);
        }}
        noValidate
      >
        <div className="form-grid form-grid-two">
          {/* Title */}
          <label className="field field-wide">
            <span>Event Title <b>*</b></span>
            <input
              required
              disabled={saving}
              maxLength={160}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. High Performance Rust & Concurrency Workshop"
              className={fieldErrors.title ? 'input-error' : ''}
            />
            {fieldErrors.title && <span className="field-error-text">{fieldErrors.title}</span>}
          </label>

          {/* Description */}
          <label className="field field-wide">
            <span>Description <b>*</b></span>
            <textarea
              required
              disabled={saving}
              maxLength={5000}
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Provide a detailed agenda, prerequisites, and learning takeaways..."
              className={fieldErrors.description ? 'input-error' : ''}
            />
            {fieldErrors.description && <span className="field-error-text">{fieldErrors.description}</span>}
          </label>

          {/* Category Dropdown */}
          <label className="field">
            <span>Category <b>*</b></span>
            <select
              disabled={saving}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              {PRESET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </option>
              ))}
              <option value="OTHER">Other (Custom Category)</option>
            </select>
          </label>

          {/* Custom Category input if 'OTHER' */}
          {form.category === 'OTHER' ? (
            <label className="field">
              <span>Specify Category Name <b>*</b></span>
              <input
                disabled={saving}
                maxLength={80}
                value={form.customCategory}
                onChange={(e) => set('customCategory', e.target.value)}
                placeholder="e.g. RESEARCH SYMPOSIUM"
                className={fieldErrors.category ? 'input-error' : ''}
              />
              {fieldErrors.category && <span className="field-error-text">{fieldErrors.category}</span>}
            </label>
          ) : (
            <label className="field">
              <span>Organizing SIG / Division <b>*</b></span>
              <input
                required
                disabled={saving}
                maxLength={160}
                value={form.organizer}
                onChange={(e) => set('organizer', e.target.value)}
                placeholder="ACM Student Chapter"
                className={fieldErrors.organizer ? 'input-error' : ''}
              />
              {fieldErrors.organizer && <span className="field-error-text">{fieldErrors.organizer}</span>}
            </label>
          )}

          {/* Venue */}
          <label className="field">
            <span>Venue / Room <b>*</b></span>
            <input
              required
              disabled={saving}
              maxLength={200}
              value={form.venue}
              onChange={(e) => set('venue', e.target.value)}
              placeholder="e.g. Engineering Hall 301, Lab 4"
              className={fieldErrors.venue ? 'input-error' : ''}
            />
            {fieldErrors.venue && <span className="field-error-text">{fieldErrors.venue}</span>}
          </label>

          {/* Expected Audience */}
          <label className="field">
            <span>Expected Audience <b>*</b></span>
            <input
              required
              disabled={saving}
              maxLength={300}
              value={form.expectedAudience}
              onChange={(e) => set('expectedAudience', e.target.value)}
              placeholder="e.g. Undergraduate CS, Open to all branches"
              className={fieldErrors.expectedAudience ? 'input-error' : ''}
            />
            {fieldErrors.expectedAudience && <span className="field-error-text">{fieldErrors.expectedAudience}</span>}
          </label>

          {/* Starts At */}
          <label className="field">
            <span>Start Date & Time <b>*</b></span>
            <input
              required
              disabled={saving}
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => set('startsAt', e.target.value)}
              className={fieldErrors.startsAt ? 'input-error' : ''}
            />
            {fieldErrors.startsAt && <span className="field-error-text">{fieldErrors.startsAt}</span>}
          </label>

          {/* Ends At */}
          <label className="field">
            <span>End Date & Time <b>*</b></span>
            <input
              required
              disabled={saving}
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => set('endsAt', e.target.value)}
              className={fieldErrors.endsAt ? 'input-error' : ''}
            />
            {fieldErrors.endsAt && <span className="field-error-text">{fieldErrors.endsAt}</span>}
          </label>

          {/* Timezone Dropdown */}
          <label className="field">
            <span>Timezone <b>*</b></span>
            <select
              disabled={saving}
              value={form.timezone}
              onChange={(e) => set('timezone', e.target.value)}
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </label>

          {/* If Category is not OTHER, organizer is in the first row. If Category is OTHER, show organizer here */}
          {form.category === 'OTHER' && (
            <label className="field">
              <span>Organizing SIG / Division <b>*</b></span>
              <input
                required
                disabled={saving}
                maxLength={160}
                value={form.organizer}
                onChange={(e) => set('organizer', e.target.value)}
                placeholder="ACM Student Chapter"
                className={fieldErrors.organizer ? 'input-error' : ''}
              />
              {fieldErrors.organizer && <span className="field-error-text">{fieldErrors.organizer}</span>}
            </label>
          )}

          {/* Core-Only Admin Controls */}
          {role === 'CORE' && (
            <label className="field">
              <span>Status Lifecycle</span>
              <select
                disabled={saving}
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
              >
                <option value="DRAFT">In Review (Draft Proposal)</option>
                <option value="PUBLISHED">Published (Active on Public Calendar)</option>
                <option value="CANCELLED">Cancelled / Archived</option>
              </select>
            </label>
          )}

          {role === 'CORE' && (
            <label className="field field-wide">
              <span>Resolution / Administrative Audit Notes</span>
              <input
                disabled={saving}
                maxLength={2000}
                value={form.resolutionNotes}
                onChange={(e) => set('resolutionNotes', e.target.value)}
                placeholder="e.g. Approved with co-host coordination or partition protocol"
              />
            </label>
          )}

          <label className="check-field field-wide">
            <input
              disabled={saving}
              type="checkbox"
              checked={form.campusRelevant}
              onChange={(e) => set('campusRelevant', e.target.checked)}
            />
            <span>
              <strong>Campus-Wide Relevance:</strong> Coordinate with central university timetable to avoid conflict with major academic schedules.
            </span>
          </label>
        </div>

        {role === 'EXECUTIVE' && !event && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', marginTop: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <Info size={14} style={{ color: 'var(--primary)' }} />
            <span>Executive proposals are saved as <strong>In Review</strong> for Core review and peer executive verification upvoting.</span>
          </div>
        )}

        {/* ── Scheduling Conflict Warning with Details (Requirement 1) ── */}
        {conflicts.length > 0 && (
          <div
            style={{
              marginTop: '16px',
              padding: '14px 16px',
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              borderLeft: '4px solid var(--warning)',
              color: 'var(--warning-text)',
              fontSize: '12px'
            }}
            role="alert"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
              <strong style={{ fontSize: '13px' }}>
                Scheduling Concurrency Detected ({conflicts.length} overlap{conflicts.length > 1 ? 's' : ''})
              </strong>
            </div>

            <p style={{ margin: '0 0 10px 0', opacity: 0.95, lineHeight: 1.5 }}>
              This proposed timeslot or venue overlaps with existing chapter activities.
              You may review the conflicting details below and proceed with submission. The proposal will remain in review for Core lead coordination.
            </p>

            <ul style={{ margin: '0 0 12px 18px', padding: 0 }}>
              {conflicts.map((c) => (
                <li key={c.eventId} style={{ marginBottom: '6px' }}>
                  <strong>“{c.title}”</strong> at <em>{c.venue}</em> · {formatTime(c.startsAt)} - {formatTime(c.endsAt)}
                  {c.reasons && c.reasons.length > 0 && (
                    <span style={{ display: 'block', fontSize: '11px', opacity: 0.85 }}>
                      Reasons: {c.reasons.join('; ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '6px', borderTop: '1px solid var(--warning-border)' }}>
              <button
                type="button"
                className="button button-warning button-compact"
                disabled={saving}
                onClick={() => submit(true)}
              >
                {saving && <LoaderCircle className="spin" size={13} />}
                Proceed With Submission (Acknowledge Overlap)
              </button>
              <span style={{ fontSize: '11px', opacity: 0.85 }}>
                Click above to proceed anyway, or adjust your start/end times or venue above.
              </span>
            </div>
          </div>
        )}

        {/* Generic Error message (when not conflict) */}
        {error && conflicts.length === 0 && (
          <div className="form-error" role="alert" style={{ marginTop: '16px' }}>
            <AlertCircle size={16} />
            <div>
              <strong>Couldn’t save this event</strong>
              <p>{error.message || error}</p>
              {Array.isArray(error.details) && (
                <ul style={{ marginTop: '6px' }}>
                  {error.details.map((detail, index) => (
                    <li key={`${detail.path}-${index}`}>
                      {detail.path}: {detail.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="form-footer" style={{ marginTop: '20px' }}>
          <span>Fields marked <b>*</b> are required</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {canOverride && conflicts.length > 0 && (
              <button
                className="button button-secondary"
                type="button"
                disabled={saving}
                onClick={() => submit(true)}
              >
                {saving ? 'Submitting…' : 'Proceed with Submission'}
              </button>
            )}
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving && <LoaderCircle className="spin" size={15} />}
              {saving
                ? 'Submitting…'
                : event
                ? 'Save Changes'
                : role === 'CORE'
                ? 'Create Event'
                : 'Submit for Review'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
