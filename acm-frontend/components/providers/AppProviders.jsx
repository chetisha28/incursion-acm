'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

export function AppProviders({ children }) {
  return <AuthProvider><ToastProvider>{children}</ToastProvider></AuthProvider>;
}
