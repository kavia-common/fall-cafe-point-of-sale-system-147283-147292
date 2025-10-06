import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../state/cartContext';
import { formatCurrencyFromCents } from '../../utils/format';
import { Card, Button, Input } from '../../components/common';

/**
 * PUBLIC_INTERFACE
 * CurrentOrder - Renders the current cart with item rows, per-item notes, and a summary panel.
 *
 * Features:
 * - Item list with name, unit price, quantity controls (+/-), remove button, and per-item notes field.
 * - Summary with subtotal, tax (8.875%), and total derived via cartContext selectors.
 * - Actions to clear the entire cart or proceed to Checkout route (/checkout).
 * - Ocean Professional styling using CSS variables/utilities from the app.
 * - Accessible: aria labels, roles, and keyboard-friendly controls.
 */
function CurrentOrder() {
  const navigate = useNavigate();
  const {
    items,
    subtotalCents,
    taxCents,
    totalCents,
    itemsCount,
    increment,
    decrement,
    removeItem,
    clear,
    setItemNote,
  } = useCart();

  // Derive helpful booleans/text
  const isEmpty = items.length === 0;
  const headerText = useMemo(
    () => `Items in Order${itemsCount > 0 ? ` (${itemsCount})` : ''}`,
    [itemsCount]
  );

  const listStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  };

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto auto',
    gap: 'var(--space-3)',
    alignItems: 'center',
  };

  const namePriceStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  };

  const qtyControlsStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const noteAreaStyle = {
    marginTop: 'var(--space-2)',
  };

  const pill = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.2rem 0.5rem',
    borderRadius: '9999px',
    background: 'rgba(0,0,0,0.03)',
    border: '1px solid var(--color-border)',
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

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div aria-label="Current order panel">
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{headerText}</span>
            {!isEmpty ? (
              <span className="muted" style={{ fontSize: '0.9rem' }}>
                <span style={pill} aria-hidden="true">🧾</span>
                {items.length} line{items.length > 1 ? 's' : '' }
              </span>
            ) : null}
          </div>
        }
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'space-between', width: '100%' }}>
            <Button
              variant="ghost"
              onClick={clear}
              ariaLabel="Clear current order"
              disabled={isEmpty}
            >
              🗑️ Clear
            </Button>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                variant="secondary"
                onClick={handleCheckout}
                ariaLabel="Proceed to checkout"
                disabled={isEmpty}
              >
                💳 Checkout
              </Button>
            </div>
          </div>
        }
      >
        {isEmpty ? (
          <div className="muted" role="note" aria-live="polite">
            Your cart is empty. Add items from the menu to get started.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {/* Item list */}
            <div role="list" aria-label="Order items list" style={listStyle}>
              {items.map((it) => (
                <div
                  key={it.id}
                  role="listitem"
                  aria-label={`${it.name}, quantity ${it.quantity}`}
                  style={{ paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}
                >
                  <div style={rowStyle}>
                    <div style={namePriceStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 600 }}>{it.name}</span>
                        <span className="muted">{formatCurrencyFromCents(it.unit_price_cents)}</span>
                      </div>
                      <div className="muted" style={{ fontSize: '0.9rem' }}>
                        Line: {formatCurrencyFromCents((it.unit_price_cents || 0) * (it.quantity || 0))}
                      </div>
                    </div>

                    <div style={qtyControlsStyle} aria-label={`Quantity controls for ${it.name}`}>
                      <Button
                        variant="ghost"
                        ariaLabel={`Decrease quantity of ${it.name}`}
                        onClick={() => decrement(it.id)}
                      >
                        ➖
                      </Button>
                      <span aria-live="polite" aria-atomic="true" style={{ minWidth: 24, textAlign: 'center' }}>
                        {it.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        ariaLabel={`Increase quantity of ${it.name}`}
                        onClick={() => increment(it.id)}
                      >
                        ➕
                      </Button>
                    </div>

                    <div>
                      <Button
                        variant="ghost"
                        ariaLabel={`Remove ${it.name} from order`}
                        onClick={() => removeItem(it.id)}
                      >
                        ❌ Remove
                      </Button>
                    </div>

                    {/* Spacer for grid alignment */}
                    <div aria-hidden="true" />
                  </div>

                  {/* Notes */}
                  <div style={noteAreaStyle}>
                    <Input
                      id={`note-${it.id}`}
                      label="Item notes"
                      placeholder="Add preparation notes or modifiers"
                      value={it.notes || ''}
                      onChange={(e) => setItemNote(it.id, e.target.value)}
                      helperText="Optional notes for the barista"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Summary panel */}
            <div>
              <div className="h3" style={{ marginBottom: 'var(--space-2)' }}>
                Summary
              </div>
              <div style={summaryGrid} role="group" aria-label="Order summary">
                <div className="muted">Subtotal</div>
                <div aria-label={`Subtotal is ${formatCurrencyFromCents(subtotalCents)}`}>
                  {formatCurrencyFromCents(subtotalCents)}
                </div>

                <div className="muted">Tax (8.875%)</div>
                <div aria-label={`Tax is ${formatCurrencyFromCents(taxCents)}`}>
                  {formatCurrencyFromCents(taxCents)}
                </div>

                <div style={summaryTotal}>Total</div>
                <div style={summaryTotal} aria-label={`Total is ${formatCurrencyFromCents(totalCents)}`}>
                  {formatCurrencyFromCents(totalCents)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default CurrentOrder;
