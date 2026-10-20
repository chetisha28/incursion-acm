'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, eyebrow, children, size = 'normal' }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section className={`modal-panel modal-${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <div>{eyebrow && <p className="micro-label">{eyebrow}</p>}<h2 id="modal-title">{title}</h2></div>
          <button ref={closeRef} className="icon-button" type="button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}
