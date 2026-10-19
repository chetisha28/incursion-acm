const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR', details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(path, { token, signal, method = 'GET', body, headers = {} } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      signal,
      cache: 'no-store',
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError('Could not reach the events service. Check the backend connection and try again.');
  }

  let payload;
  try { payload = await response.json(); }
  catch { payload = null; }

  if (!response.ok || payload?.success === false) {
    const fallback = response.status === 401 ? 'Your session has expired. Please sign in again.'
      : response.status === 403 ? 'Your account does not have permission for that action.'
        : response.status === 409 ? 'This event conflicts with another scheduled event.'
          : response.status >= 500 ? 'The service had a problem. Please try again in a moment.'
            : 'The request could not be completed.';
    throw new ApiError(payload?.message || fallback, {
      status: response.status,
      code: payload?.code || 'REQUEST_FAILED',
      details: payload?.details
    });
  }
  return payload;
}

function queryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const value = search.toString();
  return value ? `?${value}` : '';
}

export const api = {
  login: (kind, credentials, options) => apiRequest(`/auth/${kind}/login`, { method: 'POST', body: credentials, ...options }),
  me: (token, options) => apiRequest('/auth/me', { token, ...options }),
  logout: (token, options) => apiRequest('/auth/logout', { method: 'POST', token, ...options }),
  listEvents: (params, token, options) => apiRequest(`/events${queryString(params)}`, { token, ...options }),
  upcomingEvents: (options) => apiRequest('/events/upcoming', options),
  pastEvents: (options) => apiRequest('/events/past', options),
  event: (id, token, options) => apiRequest(`/events/${encodeURIComponent(id)}`, { token, ...options }),
  createEvent: (data, token, options) => apiRequest('/events', { method: 'POST', body: data, token, ...options }),
  updateEvent: (id, data, token, options) => apiRequest(`/events/${encodeURIComponent(id)}`, { method: 'PATCH', body: data, token, ...options }),
  resolveEvent: (id, data, token, options) => apiRequest(`/events/${encodeURIComponent(id)}/resolve`, { method: 'POST', body: data, token, ...options }),
  archiveEvent: (id, token, options) => apiRequest(`/events/${encodeURIComponent(id)}`, { method: 'DELETE', token, ...options }),
  coreDashboard: (token, options) => apiRequest('/core/dashboard', { token, ...options }),
  coreDashboardSummary: (token, options) => apiRequest('/core/dashboard/summary', { token, ...options }),
  coreConflicts: (token, options) => apiRequest('/core/dashboard/conflicts', { token, ...options }),
  coreActivity: (token, options) => apiRequest('/core/dashboard/recent-activity', { token, ...options }),
  listExpenses: (params, token, options) => apiRequest(`/expenses${queryString(params)}`, { token, ...options }),
  getExpense: (id, token, options) => apiRequest(`/expenses/${encodeURIComponent(id)}`, { token, ...options }),
  createExpense: (data, token, options) => apiRequest('/expenses', { method: 'POST', body: data, token, ...options }),
  updateExpense: (id, data, token, options) => apiRequest(`/expenses/${encodeURIComponent(id)}`, { method: 'PATCH', body: data, token, ...options }),
  archiveExpense: (id, token, options) => apiRequest(`/expenses/${encodeURIComponent(id)}`, { method: 'DELETE', token, ...options }),
  listBudgets: (token, options) => apiRequest('/budgets', { token, ...options }),
  currentBudget: (token, options) => apiRequest('/budgets/current', { token, ...options }),
  createBudget: (data, token, options) => apiRequest('/budgets', { method: 'POST', body: data, token, ...options }),
  updateBudget: (id, data, token, options) => apiRequest(`/budgets/${encodeURIComponent(id)}`, { method: 'PATCH', body: data, token, ...options })
};

