import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../supabaseClient';
import { useCart } from '../../state/cartContext';
import { formatCurrencyFromCents } from '../../utils/format';
import { Card, Button, Input } from '../../components/common';

/**
 * PUBLIC_INTERFACE
 * CheckoutPanel - Handles tender selection and order submission to Supabase.
 *
 * Features:
 * - Tender type selection: 'cash', 'card', 'other'
 * - For 'cash', allows entering amount received and shows calculated change due
 * - Submits order to Supabase: inserts into 'orders' and 'order_items'
 *   orders fields: created_at (default), subtotal_cents, tax_cents, total_cents, tender_type
 *   order_items fields: order_id, item_id, name, unit_price_cents, quantity, notes
 * - Integrates with cartContext selectors for totals and items
 * - Clears cart upon successful submission
 * - Shows feedback via callbacks compatible with StatusBar (onStatus and onSupabaseError)
 * - Navigates to /orders after completion
 * - Handles missing Supabase configuration gracefully
 *
 * Props:
 * - onStatus?: (message: string, type: 'success' | 'error' | 'info') => void
 * - onSupabaseError?: (message: string | null) => void
 */
function CheckoutPanel({ onStatus, onSupabaseError }) {
  const navigate = useNavigate();
  const {
    items,
    subtotalCents,
    taxCents,
    totalCents,
    itemsCount,
    clear,
  } = useCart();

  const [tender, setTender] = useState('cash'); // 'cash' | 'card' | 'other'
  const [cashReceivedStr, setCashReceivedStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse cash received input (allow blanks gracefully)
  const cashReceivedCents = useMemo(() => {
    const trimmed = (cashReceivedStr || '').trim();
    if (trimmed.length === 0) return 0;
    // Accept both "." and "," as decimal separator
    const normalized = trimmed.replace(',', '.');
    const n = Number(normalized);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100);
  }, [cashReceivedStr]);

  const changeDueCents = useMemo(() => {
    if (tender !== 'cash') return 0;
    const due = cashReceivedCents - totalCents;
    return due > 0 ? due : 0;
  }, [tender, cashReceivedCents, totalCents]);

  const isCartEmpty = items.length === 0;

  const canSubmit = useMemo(() => {
    if (isCartEmpty) return false;
    if (!isSupabaseConfigured) return false;
    if (tender === 'cash') {
      // For cash, ensure received is at least total
      return cashReceivedCents >= totalCents && totalCents > 0;
    }
    // For card and other, total must be > 0
    return totalCents > 0;
  }, [isCartEmpty, tender, cashReceivedCents, totalCents]);

  const tenderOptions = [
    { value: 'cash', label: 'Cash', icon: '💵' },
    { value: 'card', label: 'Card', icon: '💳' },
    { value: 'other', label: 'Other', icon: '🧾' },
  ];

  const toolbarStyle = {
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 'var(--space-4)',
  };

  const tenderButtonStyle = (active) => ({
    padding: '0.5rem 0.9rem',
    borderRadius: '9999px',
    border: '1px solid var(--color-border)',
    background: active ? 'rgba(37,99,235,0.10)' : 'rgba(0,0,0,0.02)',
    color: active ? 'var(--color-primary)' : 'var(--color-text)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: active ? 'var(--shadow-sm)' : 'none',
  });

  const bannerStyle = {
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px dashed var(--color-border)',
    background: 'rgba(37,99,235,0.04)',
    color: 'var(--color-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    marginTop: 'var(--space-3)',
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
    marginTop: 'var(--space-3)',
  };

  const summaryGrid = {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '0.5rem',
    alignItems: 'center',
    fontSize: '0.975rem',
  };

  const summaryTotal = {
    fontWeight: 700,
    fontSize: '1.05rem',
  };

  // PUBLIC_INTERFACE
  async function handleSubmit() {
    /**
     * Attempts to submit the order and order_items to Supabase.
     * On success: clears cart, informs user, navigates back to /orders
     * On failure: shows error via callbacks
     */
    if (!canSubmit) {
      if (onStatus) onStatus('Cannot submit: check tender and totals.', 'error');
      return;
    }
    if (!isSupabaseConfigured) {
      if (onStatus) onStatus('Supabase not configured. Cannot submit order.', 'error');
      if (onSupabaseError) onSupabaseError('Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_KEY');
      return;
    }
    if (items.length === 0) {
      if (onStatus) onStatus('Cart is empty.', 'error');
      return;
    }

    setIsSubmitting(true);
    if (onSupabaseError) onSupabaseError(null);
    try {
      // Insert order
      const orderPayload = {
        subtotal_cents: subtotalCents,
        tax_cents: taxCents,
        total_cents: totalCents,
        tender_type: tender,
      };

      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select('id')
        .single();

      if (orderErr) {
        throw orderErr;
      }

      const orderId = orderData?.id;
      if (!orderId) {
        throw new Error('Order creation succeeded but no order ID returned.');
      }

      // Prepare order_items rows
      const itemsRows = items.map((it) => ({
        order_id: orderId,
        item_id: it.id,
        name: it.name,
        unit_price_cents: it.unit_price_cents || 0,
        quantity: it.quantity || 0,
        notes: it.notes || null,
      }));

      if (itemsRows.length > 0) {
        const { error: itemsErr } = await supabase.from('order_items').insert(itemsRows);
        if (itemsErr) {
          throw itemsErr;
        }
      }

      // Clear cart and notify
      clear();
      if (onStatus) onStatus('Order submitted successfully.', 'success');
      if (onSupabaseError) onSupabaseError(null);

      // Navigate to Orders page (e.g., to start a new order)
      navigate('/orders');
    } catch (err) {
      // Surface error in StatusBar via callbacks
      const msg = err?.message || 'Failed to submit order.';
      if (onStatus) onStatus('Failed to submit order.', 'error');
      if (onSupabaseError) onSupabaseError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div aria-label="Checkout panel">
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Checkout</span>
            <span className="muted" style={{ fontSize: '0.9rem' }}>
              {itemsCount} item{itemsCount === 1 ? '' : 's'}
            </span>
          </div>
        }
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'space-between', width: '100%' }}>
            <Button
              variant="ghost"
              onClick={() => navigate('/orders')}
              ariaLabel="Back to orders"
              disabled={isSubmitting}
            >
              ← Back to Orders
            </Button>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                onClick={handleSubmit}
                ariaLabel="Submit order"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? 'Submitting…' : '✅ Submit Order'}
              </Button>
            </div>
          </div>
        }
      >
        {/* Tender selection */}
        <div className="toolbar" style={toolbarStyle}>
          <div className="h3" style={{ marginRight: 'var(--space-2)' }}>Tender</div>
          <div role="group" aria-label="Select tender type" style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tenderOptions.map((opt) => {
              const active = tender === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className="btn ghost"
                  onClick={() => setTender(opt.value)}
                  style={tenderButtonStyle(active)}
                  aria-pressed={active}
                  aria-label={`Select ${opt.label} tender`}
                >
                  <span aria-hidden="true">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* For cash tender, show amount received and change due */}
        {tender === 'cash' && (
          <div className="grid" style={{ gap: 'var(--space-4)' }}>
            <div style={{ maxWidth: 280 }}>
              <Input
                id="cash-received"
                label="Cash received"
                placeholder="e.g. 20.00"
                value={cashReceivedStr}
                onChange={(e) => setCashReceivedStr(e.target.value)}
                helperText={`Must be at least ${formatCurrencyFromCents(totalCents)}`}
              />
            </div>
            <div aria-live="polite">
              <div className="muted">Change due</div>
              <div style={{ fontWeight: 600 }}>
                {formatCurrencyFromCents(changeDueCents)}
              </div>
            </div>
            {cashReceivedCents < totalCents && (
              <div style={errorStyle} role="alert">
                <span aria-hidden="true">⚠️</span>
                <span>Cash received is less than total due.</span>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="mt-4">
          <div className="h3" style={{ marginBottom: 'var(--space-2)' }}>
            Summary
          </div>
          <div style={summaryGrid} role="group" aria-label="Order summary">
            <div className="muted">Subtotal</div>
            <div aria-label={`Subtotal is ${formatCurrencyFromCents(subtotalCents)}`}>
              {formatCurrencyFromCents(subtotalCents)}
            </div>

            <div className="muted">Tax</div>
            <div aria-label={`Tax is ${formatCurrencyFromCents(taxCents)}`}>
              {formatCurrencyFromCents(taxCents)}
            </div>

            <div style={summaryTotal}>Total</div>
            <div style={summaryTotal} aria-label={`Total is ${formatCurrencyFromCents(totalCents)}`}>
              {formatCurrencyFromCents(totalCents)}
            </div>
          </div>

          {!isSupabaseConfigured && (
            <div role="note" aria-label="Supabase not configured" style={bannerStyle}>
              <span aria-hidden="true">ℹ️</span>
              <span>
                Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY to enable order submission.
              </span>
            </div>
          )}

          {isCartEmpty && (
            <div style={bannerStyle} role="note" aria-live="polite">
              <span aria-hidden="true">🧾</span>
              <span>Your cart is empty. Add items from the menu before checking out.</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default CheckoutPanel;
