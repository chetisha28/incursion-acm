'use client';

export function EventTabs({ active, onChange, showProposals = false }) {
  const tabs = [
    { id: 'all', label: 'All events', countLabel: 'UP NEXT' },
    ...(showProposals ? [{ id: 'proposals', label: 'In Review', countLabel: 'PROPOSALS' }] : []),
    { id: 'calendar', label: 'Calendar', countLabel: 'BY DATE' },
    { id: 'past', label: 'Past events', countLabel: 'ARCHIVE' }
  ];

  const move = (event) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = tabs.findIndex((tab) => tab.id === active);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
        ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    onChange(tabs[next].id);
    document.getElementById(`tab-${tabs[next].id}`)?.focus();
  };

  return (
    <div className="event-tabs" role="tablist" aria-label="Event views" onKeyDown={move}>
      {tabs.map((tab, index) => (
        <button
          id={`tab-${tab.id}`}
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          aria-controls="event-tab-panel"
          tabIndex={active === tab.id ? 0 : -1}
          className={`event-tab${active === tab.id ? ' event-tab-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="event-tab-index">0{index + 1}</span>
          <span>{tab.label}</span>
          <small>{tab.countLabel}</small>
        </button>
      ))}
    </div>
  );
}
