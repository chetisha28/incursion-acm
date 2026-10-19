import { RotateCw } from 'lucide-react';

export function ErrorState({ title = 'We couldn’t reach the events service.', message, onRetry }) {
  return (
    <div className="state-panel state-error" role="alert">
      <span className="state-index">CONNECTION / INTERRUPTED</span>
      <h3>{title}</h3>
      <p>{message || 'The published event data is unavailable right now. Nothing has been filled in with sample content.'}</p>
      {onRetry && <button className="button button-secondary" type="button" onClick={onRetry}><RotateCw size={15} /> Retry</button>}
    </div>
  );
}
