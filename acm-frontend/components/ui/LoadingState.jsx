export function LoadingState({ label = 'Loading events', rows = 3 }) {
  return <div className="loading-state" role="status" aria-label={label}>{Array.from({ length: rows }, (_, index) => <div className="loading-row" key={index}><span /><div><i /><i /></div></div>)}</div>;
}
