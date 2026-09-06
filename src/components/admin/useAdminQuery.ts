import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ApiError } from '../../context/AuthContext';

interface State<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  // True whenever a request is in flight, including background refetches that
  // keep the previous `data` on screen (e.g. a filter/tab switch). Screens can
  // show a spinner over stale rows instead of letting them linger.
  fetching: boolean;
  error: string | null;
}

interface Options {
  // Re-run the fetch every time the screen regains focus (default true).
  refetchOnFocus?: boolean;
  // Poll every N ms while the screen is focused (default: off).
  pollMs?: number;
}

/**
 * Small data hook for the admin screens: `{ data, loading, error, refetch }`
 * plus a `refreshing` flag for pull-to-refresh. `fetcher` is memoised by the
 * caller (wrap args in useCallback) — this hook re-fetches whenever it changes.
 */
export function useAdminQuery<T>(fetcher: () => Promise<T>, opts: Options = {}) {
  const { refetchOnFocus = true, pollMs } = opts;
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: true,
    refreshing: false,
    fetching: true,
    error: null,
  });
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      setState((s) => ({
        ...s,
        loading: mode === 'initial' && s.data === null,
        refreshing: mode === 'refresh',
        fetching: true,
        error: null,
      }));
      try {
        const data = await fetcher();
        if (mounted.current)
          setState({ data, loading: false, refreshing: false, fetching: false, error: null });
      } catch (err) {
        if (!mounted.current) return;
        const message =
          err instanceof ApiError ? err.message : 'Could not load. Pull to retry.';
        setState((s) => ({ ...s, loading: false, refreshing: false, fetching: false, error: message }));
      }
    },
    [fetcher]
  );

  // First load: always fetch on mount. Subsequent focuses: re-fetch only when
  // refetchOnFocus is set. useFocusEffect runs on mount too, so a ref guards
  // against the initial double-fetch.
  const didInitial = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!didInitial.current) {
        didInitial.current = true;
        run('initial');
      } else if (refetchOnFocus) {
        run('initial');
      }
      if (!pollMs) return;
      const id = setInterval(() => run('refresh'), pollMs);
      return () => clearInterval(id);
    }, [refetchOnFocus, pollMs, run])
  );

  return {
    ...state,
    refetch: () => run('initial'),
    onRefresh: () => run('refresh'),
  };
}
