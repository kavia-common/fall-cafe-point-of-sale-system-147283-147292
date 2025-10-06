import React, { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../supabaseClient';
import { Card, Button, Input } from '../../components/common';
import { formatCurrencyFromCents, formatDate } from '../../utils/format';

/**
 * PUBLIC_INTERFACE
 * SalesDashboard
 * 
 * Displays sales KPIs for a selected date range (default: today) by querying the 'orders' table.
 * KPIs:
 * - Total Subtotal, Total Tax, Total Sales (total_cents)
 * - Orders Count
 * - Average Order Value (AOV)
 * 
 * Visualization:
 * - Minimal CSS-based bar visualization for totals and AOV (no chart library)
 * - Ocean Professional styling (uses CSS variables)
 * 
 * Behavior:
 * - If Supabase is not configured, shows helpful banner and empty state.
 * - Date range filter via two date inputs (start and end inclusive).
 * - Debounced fetch on date changes.
 */
function SalesDashboard() {
  // Date range state: default to today for both start and end
  const todayIso = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(todayIso);

  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);

  // Build ISO timestamps for inclusive day range
  const startTs = useMemo(() => {
    if (!startDate) return null;
    return new Date(`${startDate}T00:00:00.000Z`).toISOString();
  }, [startDate]);

  const endTs = useMemo(() => {
    if (!endDate) return null;
    // Inclusive end of day: 23:59:59.999
    return new Date(`${endDate}T23:59:59.999Z`).toISOString();
  }, [endDate]);

  // Fetch orders inside selected date range
  useEffect(() => {
    let active = true;

    async function fetchOrders() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        setOrders([]);
        setError(null);
        return;
      }

      if (!startTs || !endTs) {
        setLoading(false);
        setOrders([]);
        setError('Please select a valid date range.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Assumes orders table with created_at, subtotal_cents, tax_cents, total_cents
        const { data, error: sbError } = await supabase
          .from('orders')
          .select('id, created_at, subtotal_cents, tax_cents, total_cents')
          .gte('created_at', startTs)
          .lte('created_at', endTs)
          .order('created_at', { ascending: true });

        if (sbError) throw sbError;
        if (!active) return;

        setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!active) return;
        setOrders([]);
        setError(e?.message || 'Failed to load sales data.');
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchOrders();
    return () => {
      active = false;
    };
  }, [startTs, endTs]);

  // Compute summaries
  const summaries = useMemo(() => {
    const sum = (arr, key) =>
      arr.reduce((acc, it) => acc + (Number.isFinite(it?.[key]) ? it[key] : 0), 0);

    const subtotal = sum(orders, 'subtotal_cents');
    const tax = sum(orders, 'tax_cents');
    const total = sum(orders, 'total_cents');
    const count = orders.length;
    const aov = count > 0 ? Math.round(total / count) : 0;

    return {
      subtotal,
      tax,
      total,
      count,
      aov,
    };
  }, [orders]);

  // Visualization bar calculations (pure CSS)
  const { subtotal, tax, total, count, aov } = summaries;

  // Determine max for proportional bars
  const barMax = useMemo(() => {
    // pick the largest among total and aov*something to make bars visible; default fallback
    return Math.max(total || 0, aov || 0, 10000); // ensure non-zero baseline (e.g., $100.00)
  }, [total, aov]);

  const barTrackStyle = {
    width: '100%',
    height: 12,
    background: 'rgba(0,0,0,0.06)',
    borderRadius: 9999,
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
  };

  const barFill = (value, colorVar) => ({
    width: `${Math.min(100, Math.round((value / barMax) * 100))}%`,
    height: '100%',
    background: `var(${colorVar})`,
    transition: 'width var(--transition)',
  });

  const cardGrid = {
    display: 'grid',
    gap: 'var(--space-4)',
    gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))',
  };

  const responsiveCss = `
    @media (max-width: 1200px) {
      .sales-cards { grid-template-columns: repeat(3, minmax(200px, 1fr)); }
    }
    @media (max-width: 900px) {
      .sales-cards { grid-template-columns: repeat(2, minmax(200px, 1fr)); }
    }
    @media (max-width: 640px) {
      .sales-cards { grid-template-columns: 1fr; }
    }
  `;

  const bannerStyle = {
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px dashed var(--color-border)',
    background: 'rgba(37,99,235,0.04)',
    color: 'var(--color-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  };

  const errorStyle = {
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(239,68,68,0.35)',
    background: 'rgba(239,68,68,0.08)',
    color: 'var(--color-error)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  };

  const toolbarStyle = {
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    marginBottom: 'var(--space-4)',
  };

  const dateField = (id, label, value, onChange) => (
    <div style={{ minWidth: 220 }}>
      <label
        htmlFor={id}
        style={{ display: 'inline-block', marginBottom: 'var(--space-2)', fontWeight: 500 }}
      >
        {label}
      </label>
      <input
        id={id}
        type="date"
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );

  return (
    <div>
      <style>{responsiveCss}</style>

      <div className="toolbar" style={toolbarStyle}>
        <div className="h2" style={{ marginRight: 'var(--space-4)' }}>
          Sales Dashboard
        </div>
        {dateField('sales-start', 'Start date', startDate, setStartDate)}
        {dateField('sales-end', 'End date', endDate, setEndDate)}

        {!isSupabaseConfigured && (
          <div role="note" aria-label="Supabase not configured" style={bannerStyle}>
            <span aria-hidden="true">ℹ️</span>
            <span>
              Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY to enable sales data.
            </span>
          </div>
        )}
      </div>

      {error ? (
        <div style={errorStyle} role="alert" aria-live="polite">
          <span aria-hidden="true">⚠️</span>
          <span>{error}</span>
        </div>
      ) : null}

      <div className="sales-cards" style={cardGrid}>
        <Card title="Total Sales (Gross)">
          <div className="h2" aria-label={`Total sales ${formatCurrencyFromCents(total)}`}>
            {formatCurrencyFromCents(total)}
          </div>
          <div className="muted" style={{ marginTop: 'var(--space-2)' }}>
            Date range: {formatDate(startDate)} → {formatDate(endDate)}
          </div>
          <div className="mt-4" style={barTrackStyle}>
            <div style={barFill(total, '--color-primary')} />
          </div>
        </Card>

        <Card title="Orders Count">
          <div className="h2" aria-label={`Order count ${count}`}>{count}</div>
          <div className="muted" style={{ marginTop: 'var(--space-2)' }}>
            Completed orders within range
          </div>
          <div className="mt-4" style={barTrackStyle}>
            <div style={barFill(count * (aov || 0), '--color-secondary')} />
          </div>
        </Card>

        <Card title="Average Order Value">
          <div className="h2" aria-label={`Average order value ${formatCurrencyFromCents(aov)}`}>
            {formatCurrencyFromCents(aov)}
          </div>
          <div className="muted" style={{ marginTop: 'var(--space-2)' }}>
            Total / Orders
          </div>
          <div className="mt-4" style={barTrackStyle}>
            <div style={barFill(aov, '--color-secondary')} />
          </div>
        </Card>

        <Card title="Tax Collected">
          <div className="h2" aria-label={`Tax collected ${formatCurrencyFromCents(tax)}`}>
            {formatCurrencyFromCents(tax)}
          </div>
          <div className="muted" style={{ marginTop: 'var(--space-2)' }}>
            Sum of tax across orders
          </div>
          <div className="mt-4" style={barTrackStyle}>
            <div style={barFill(tax, '--color-error')} />
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Breakdown">
          {loading ? (
            <div className="muted">Loading daily summaries…</div>
          ) : orders.length === 0 ? (
            <div className="muted">
              {isSupabaseConfigured
                ? 'No orders in this date range.'
                : 'Supabase is not configured; no data to show.'}
            </div>
          ) : (
            <div role="table" aria-label="Orders list" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th scope="col" style={thStyle}>Date/Time</th>
                    <th scope="col" style={thStyle}>Subtotal</th>
                    <th scope="col" style={thStyle}>Tax</th>
                    <th scope="col" style={thStyle}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td style={tdStyle}>
                        <span className="muted">{new Date(o.created_at).toLocaleString()}</span>
                      </td>
                      <td style={tdStyle}>{formatCurrencyFromCents(o.subtotal_cents)}</td>
                      <td style={tdStyle}>{formatCurrencyFromCents(o.tax_cents)}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        {formatCurrencyFromCents(o.total_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: 'left',
  padding: '0.6rem 0.75rem',
  borderBottom: '1px solid var(--color-border)',
  color: 'var(--color-muted)',
  fontWeight: 600,
};

const tdStyle = {
  padding: '0.6rem 0.75rem',
  borderBottom: '1px solid var(--color-border)',
  verticalAlign: 'middle',
};

export default SalesDashboard;
