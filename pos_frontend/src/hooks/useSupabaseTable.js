import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

/**
 * PUBLIC_INTERFACE
 * useSupabaseTable - Generic CRUD hook for a Supabase table.
 *
 * Parameters:
 * - options: {
 *     table: string,               // table name (required)
 *     select?: string = '*',       // select columns
 *     orderBy?: string,            // column to order by
 *     orderAsc?: boolean = true,   // order direction
 *     idColumn?: string = 'id',    // id column for update/remove
 *   }
 *
 * Returns:
 * {
 *   data,            // array of rows
 *   loading,         // boolean
 *   error,           // string | null
 *   list,            // () => Promise<void>
 *   create,          // (record: object) => Promise<{data, error}>
 *   update,          // (id: any, patch: object) => Promise<{data, error}>
 *   remove,          // (id: any) => Promise<{error}>
 *   refresh,         // alias of list
 *   isConfigured,    // boolean indicating Supabase config status
 * }
 *
 * Behavior:
 * - Uses supabaseClient.js and gracefully handles missing configuration.
 * - All functions are stable (useCallback) and reference latest options via refs to avoid stale closures.
 * - Exposes errors as strings to be surfaced by StatusBar.
 */
export default function useSupabaseTable(options) {
  const {
    table,
    select = '*',
    orderBy,
    orderAsc = true,
    idColumn = 'id',
  } = options || {};

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(Boolean(isSupabaseConfigured));
  const [error, setError] = useState(null);

  // Keep latest options in refs to avoid stale closures inside callbacks
  const tableRef = useRef(table);
  const selectRef = useRef(select);
  const orderByRef = useRef(orderBy);
  const orderAscRef = useRef(orderAsc);
  const idColumnRef = useRef(idColumn);

  useEffect(() => {
    tableRef.current = table;
    selectRef.current = select;
    orderByRef.current = orderBy;
    orderAscRef.current = orderAsc;
    idColumnRef.current = idColumn;
  }, [table, select, orderBy, orderAsc, idColumn]);

  const configErrorMessage =
    'Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.';

  const list = useCallback(async () => {
    if (!tableRef.current) {
      setError('Missing table name.');
      setData([]);
      return;
    }

    if (!isSupabaseConfigured) {
      // No-op fetch when not configured
      setLoading(false);
      setError(null);
      setData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(tableRef.current).select(selectRef.current);
      if (orderByRef.current) {
        query = query.order(orderByRef.current, { ascending: !!orderAscRef.current });
      }
      const { data: rows, error: qerr } = await query;
      if (qerr) {
        setError(qerr.message || 'Failed to fetch.');
        setData([]);
        return;
      }
      setData(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError(e?.message || 'Unexpected error during fetch.');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (record) => {
    if (!tableRef.current) {
      const msg = 'Missing table name.';
      setError(msg);
      return { data: null, error: msg };
    }

    if (!isSupabaseConfigured) {
      const msg = configErrorMessage;
      setError(msg);
      return { data: null, error: msg };
    }

    try {
      const { data: rows, error: cerr } = await supabase
        .from(tableRef.current)
        .insert(record)
        .select('*')
        .maybeSingle();

      if (cerr) {
        const emsg = cerr.message || 'Create failed.';
        setError(emsg);
        return { data: null, error: emsg };
      }

      // If .maybeSingle returns null (e.g., no returning), fallback to refresh list
      await list();
      return { data: rows, error: null };
    } catch (e) {
      const emsg = e?.message || 'Unexpected error during create.';
      setError(emsg);
      return { data: null, error: emsg };
    }
  }, [list]);

  const update = useCallback(async (id, patch) => {
    if (!tableRef.current) {
      const msg = 'Missing table name.';
      setError(msg);
      return { data: null, error: msg };
    }

    if (!isSupabaseConfigured) {
      const msg = configErrorMessage;
      setError(msg);
      return { data: null, error: msg };
    }

    const idCol = idColumnRef.current || 'id';
    try {
      const { data: rows, error: uerr } = await supabase
        .from(tableRef.current)
        .update(patch)
        .eq(idCol, id)
        .select('*')
        .maybeSingle();

      if (uerr) {
        const emsg = uerr.message || 'Update failed.';
        setError(emsg);
        return { data: null, error: emsg };
      }

      await list();
      return { data: rows, error: null };
    } catch (e) {
      const emsg = e?.message || 'Unexpected error during update.';
      setError(emsg);
      return { data: null, error: emsg };
    }
  }, [list]);

  const remove = useCallback(async (id) => {
    if (!tableRef.current) {
      const msg = 'Missing table name.';
      setError(msg);
      return { error: msg };
    }

    if (!isSupabaseConfigured) {
      const msg = configErrorMessage;
      setError(msg);
      return { error: msg };
    }

    const idCol = idColumnRef.current || 'id';
    try {
      const { error: derr } = await supabase
        .from(tableRef.current)
        .delete()
        .eq(idCol, id);

      if (derr) {
        const emsg = derr.message || 'Delete failed.';
        setError(emsg);
        return { error: emsg };
      }

      await list();
      return { error: null };
    } catch (e) {
      const emsg = e?.message || 'Unexpected error during delete.';
      setError(emsg);
      return { error: emsg };
    }
  }, [list]);

  // Auto-load on mount and whenever table/select/orderBy/orderAsc changes
  useEffect(() => {
    let active = true;
    (async () => {
      await list();
    })();
    return () => {
      active = false; // reserved for potential future cancellation
    };
  }, [list, table, select, orderBy, orderAsc]);

  const refresh = list;

  return useMemo(() => {
    return {
      data,
      loading,
      error,
      list,
      create,
      update,
      remove,
      refresh,
      isConfigured: isSupabaseConfigured,
    };
  }, [data, loading, error, list, create, update, remove, refresh]);
}
