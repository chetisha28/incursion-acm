'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

export function EventFilters({ categories, category, search, onChange }) {
  const [value, setValue] = useState(search);
  useEffect(() => { setValue(search); }, [search]);
  useEffect(() => {
    const timer = window.setTimeout(() => onChange({ search: value }), 280);
    return () => window.clearTimeout(timer);
  }, [value, onChange]);
  return (
    <div className="event-filters">
      <label className="search-field"><Search size={16} aria-hidden="true" /><span className="visually-hidden">Search events</span><input type="search" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Search events" /><kbd>↵</kbd>{value && <button type="button" aria-label="Clear search" onClick={() => setValue('')}><X size={14} /></button>}</label>
      <label className="category-filter"><span>SHOWING</span><select aria-label="Filter by category" value={category} onChange={(event) => onChange({ category: event.target.value })}><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    </div>
  );
}
