'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ApiError } from '@/lib/api';
import { localInputToIso, safeZone, toLocalInput } from '@/lib/dates';

function blankForm() {
  return {
    title: '',
    description: '',
    category: '',
    startsAt: '',
    endsAt: '',
    timezone: 'UTC',
    venue: '',
    expectedAudience: '',
    organizer: '',
    campusRelevant: false,
    status: 'PUBLISHED',
    resolutionNotes: ''
  };
}

function initialForm(event) {
  if (!event) return blankForm();
  return {
    title: event.title || '',
    description: event.description || '',
    category: event.category || '',
    startsAt: toLocalInput(event.startsAt, event.timezone),
    endsAt: toLocalInput(event.endsAt, event.timezone),
    timezone: event.timezone || 'UTC',
    venue: event.venue || '',
    expectedAudience: event.expectedAudience || '',
    organizer: event.organizer || '',
    campusRelevant: Boolean(event.campusRelevant),
    status: event.status || 'PUBLISHED',
    resolutionNotes: event.resolutionNotes || ''
  };
}

export function EventForm({ open, event, role, onClose, onSave }) {
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [canOverride, setCanOverride] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm(event));
    setError(null);
    setConflicts([]);
    setCanOverride(false);
    if (!event) {
      setForm((current) => ({
        ...current,
        timezone: safeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
      }));
    }
  }, [open, event]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (override = false) => {
    setError(null);
    setConflicts([]);
    if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
      setError('The end time must be later than the start time.');
      return;
    }
    let payload;
    setSaving(true);
    try {
      payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
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
      if (override && role === 'CORE') payload.allowConflict = true;
      await onSave(payload);
      onClose();
    } catch (saveError) {
      setError({ message: saveError?.message || 'The event could not be saved.', details: saveError?.details });
      if (saveError instanceof ApiError && saveError.code === 'SCHEDULING_CONFLICT') {
        setConflicts(Array.isArray(saveError.details) ? saveError.details : []);
        setCanOverride(role === 'CORE');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={event ? 'EVENT / EDIT' : 'EVENT / SUBMIT'}
      title={event ? 'Make a change' : 'Put it on the calendar'}
      size="wide"
    >
      <form
        className="event-form"
        onSubmit={(eventSubmit) => {
          eventSubmit.preventDefault();
          submit(false);
        }}
      >
        <div className="form-grid form-grid-two">
          <label className="field field-wide">
            <span>Event title <b>*</b></span>
            <input
              required
              maxLength={160}
              value={form.title}
              onChange={(eventChange) => set('title', eventChange.target.value)}
              placeholder="e.g. Building with computer vision"
            />
          </label>
          <label className="field field-wide">
            <span>Description <b>*</b></span>
            <textarea
              required
              maxLength={10000}
              rows={3}
              value={form.description}
              onChange={(eventChange) => set('description', eventChange.target.value)}
              placeholder="What will people learn or take part in?"
            />
          </label>
          <label className="field">
            <span>Category <b>*</b></span>
            <input
              required
              maxLength={80}
              value={form.category}
              onChange={(eventChange) => set('category', eventChange.target.value)}
              placeholder="Workshop"
            />
          </label>
          <label className="field">
            <span>Organizer <b>*</b></span>
            <input
              required
              maxLength={160}
              value={form.organizer}
              onChange={(eventChange) => set('organizer', eventChange.target.value)}
              placeholder="ACM Student Chapter"
            />
          </label>
          <label className="field">
            <span>Starts <b>*</b></span>
            <input
              required
              type="datetime-local"
              value={form.startsAt}
              onChange={(eventChange) => set('startsAt', eventChange.target.value)}
            />
          </label>
          <label className="field">
            <span>Ends <b>*</b></span>
            <input
              required
              type="datetime-local"
              value={form.endsAt}
              onChange={(eventChange) => set('endsAt', eventChange.target.value)}
            />
          </label>
          <label className="field">
            <span>Venue <b>*</b></span>
            <input
              required
              maxLength={200}
              value={form.venue}
              onChange={(eventChange) => set('venue', eventChange.target.value)}
              placeholder="Engineering building, room 204"
            />
          </label>
          <label className="field">
            <span>Expected audience <b>*</b></span>
            <input
              required
              maxLength={300}
              value={form.expectedAudience}
              onChange={(eventChange) => set('expectedAudience', eventChange.target.value)}
              placeholder="Students, ACM members"
            />
          </label>
          <label className="field">
            <span>Timezone <b>*</b></span>
            <input
              required
              maxLength={100}
              value={form.timezone}
              onChange={(eventChange) => set('timezone', eventChange.target.value)}
              placeholder="Asia/Kolkata"
            />
          </label>
          {role === 'CORE' && (
            <label className="field">
              <span>Visibility status</span>
              <select
                value={form.status}
                onChange={(eventChange) => set('status', eventChange.target.value)}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>
          )}
          {role === 'CORE' && (
            <label className="field field-wide">
              <span>Resolution / Administrative Notes</span>
              <input
                maxLength={2000}
                value={form.resolutionNotes}
                onChange={(eventChange) => set('resolutionNotes', eventChange.target.value)}
                placeholder="e.g. Approved with co-host coordination or hall partition protocol"
              />
            </label>
          )}
          <label className="check-field">
            <input
              type="checkbox"
              checked={form.campusRelevant}
              onChange={(eventChange) => set('campusRelevant', eventChange.target.checked)}
            />
            <span>Relevant to wider campus scheduling</span>
          </label>
        </div>
        {role === 'EXECUTIVE' && !event && (
          <p className="form-note">Executive submissions are saved as drafts for Core review.</p>
        )}
        {error && (
          <div className="form-error" role="alert">
            <AlertTriangle size={16} />
            <div>
              <strong>Couldn’t save this event</strong>
              <p>{error.message || error}</p>
              {conflicts.length > 0 && (
                <ul>
                  {conflicts.map((conflict) => (
                    <li key={conflict.eventId}>
                      {conflict.title} · {conflict.venue} · {(conflict.reasons || []).join('; ')}
                    </li>
                  ))}
                </ul>
              )}
              {Array.isArray(error.details) && (
                <ul>
                  {error.details.map((detail, index) => (
                    <li key={`${detail.path}-${index}`}>
                      {detail.path}: {detail.message}
                    </li>
                  ))}
                </ul>
              )}
              {canOverride && conflicts.length > 0 && (
                <p>Review these overlaps before proceeding.</p>
              )}
            </div>
          </div>
        )}
        <div className="form-footer">
          <span>Fields marked <b>*</b> are required</span>
          <div>
            {canOverride && conflicts.length > 0 && (
              <button
                className="button button-secondary"
                type="button"
                disabled={saving}
                onClick={() => submit(true)}
              >
                Proceed after review
              </button>
            )}
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving && <LoaderCircle className="spin" size={15} />}
              {saving
                ? 'Saving…'
                : event
                ? 'Save changes'
                : role === 'CORE'
                ? 'Create event'
                : 'Submit for review'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
