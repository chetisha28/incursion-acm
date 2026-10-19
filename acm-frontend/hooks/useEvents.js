'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

export function useEvents(mode = 'list', filters = {}) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const queryKey = `${mode}|${filters.category || ''}|${filters.search || ''}`;
  const currentKey = useRef(queryKey);

  useEffect(() => {
    const queryChanged = currentKey.current !== queryKey;
    if (queryChanged) {
      currentKey.current = queryKey;
      setPage(1);
      setItems([]);
      setError(null);
    }
    const requestedPage = queryChanged ? 1 : page;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const now = new Date();
    const request = mode === 'past'
      ? api.pastEvents({ signal: controller.signal })
      : mode === 'upcoming'
        ? api.upcomingEvents({ signal: controller.signal })
        : api.listEvents({
          page: requestedPage,
          limit: 20,
          sortBy: 'startsAt',
          order: 'asc',
          from: now.toISOString(),
          category: filters.category,
          search: filters.search
        }, { signal: controller.signal });
    request.then((response) => {
      const results = response.data || [];
      setItems((previous) => mode === 'list' && requestedPage > 1 && !queryChanged ? [...previous, ...results] : results);
      setPagination(response.pagination || { page: 1, limit: results.length, total: results.length, totalPages: 1 });
    }).catch((requestError) => {
      if (requestError.name !== 'AbortError') setError(requestError);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [mode, filters.category, filters.search, queryKey, page, reloadKey]);

  const loadMore = useCallback(() => {
    if (!loading && page < pagination.totalPages) setPage((current) => current + 1);
  }, [loading, page, pagination.totalPages]);
  const retry = useCallback(() => setReloadKey((current) => current + 1), []);
  const refresh = useCallback(() => { setPage(1); setReloadKey((current) => current + 1); }, []);
  return { items, pagination, loading, error, hasMore: mode === 'list' && page < pagination.totalPages, loadMore, retry, refresh };
}
