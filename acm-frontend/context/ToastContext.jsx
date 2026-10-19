'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Check, TriangleAlert, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, tone = 'success') => setToast({ id: Date.now(), message, tone }), []);
  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);
  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && <div className={`toast toast-${toast.tone}`} role="status" aria-live="polite">
        {toast.tone === 'error' ? <TriangleAlert size={16} /> : <Check size={16} />}
        <span>{toast.message}</span>
        <button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={15} /></button>
      </div>}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
