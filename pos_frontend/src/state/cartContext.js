import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

/**
 * Cart item shape:
 * { id: string, name: string, unit_price_cents: number, quantity: number, notes?: string }
 *
 * All monetary math is done in integer cents to avoid floating point errors.
 */

/**
 * Storage keys and helpers
 */
const STORAGE_KEY = 'fc_pos_cart_v1';

function readCartFromSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCartToSession(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write failures (e.g., storage disabled)
  }
}

/**
 * Reducer and actions
 */
const initialState = {
  items: [], // Array of cart items
};

const ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  INCREMENT: 'INCREMENT',
  DECREMENT: 'DECREMENT',
  CLEAR: 'CLEAR',
  SET_NOTE: 'SET_NOTE',
};

function validateItem(item) {
  if (!item || typeof item !== 'object') return false;
  const hasId = typeof item.id === 'string' || typeof item.id === 'number';
  const hasName = typeof item.name === 'string';
  const hasPrice = Number.isInteger(item.unit_price_cents) && item.unit_price_cents >= 0;
  const hasQty = Number.isInteger(item.quantity) && item.quantity > 0;
  return hasId && hasName && hasPrice && hasQty;
}

function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_ITEM: {
      const incoming = action.payload;
      if (!validateItem(incoming)) return state;

      // If item already exists by id and same unit price, increment quantity
      const idx = state.items.findIndex((i) => String(i.id) === String(incoming.id));
      if (idx >= 0) {
        const existing = state.items[idx];
        // Merge notes only if provided; keep existing otherwise
        const mergedNotes =
          typeof incoming.notes === 'string' && incoming.notes.length > 0
            ? incoming.notes
            : existing.notes;
        const nextItems = state.items.slice();
        nextItems[idx] = {
          ...existing,
          quantity: existing.quantity + incoming.quantity,
          // If unit price differs, prefer the existing unit price to avoid surprises in cart
          unit_price_cents:
            Number.isInteger(incoming.unit_price_cents) && incoming.unit_price_cents >= 0
              ? existing.unit_price_cents
              : existing.unit_price_cents,
          notes: mergedNotes,
        };
        return { ...state, items: nextItems };
      }

      // New item
      return { ...state, items: [...state.items, { ...incoming }] };
    }

    case ACTIONS.REMOVE_ITEM: {
      const id = action.payload;
      const next = state.items.filter((i) => String(i.id) !== String(id));
      if (next.length === state.items.length) return state;
      return { ...state, items: next };
    }

    case ACTIONS.INCREMENT: {
      const id = action.payload;
      const idx = state.items.findIndex((i) => String(i.id) === String(id));
      if (idx < 0) return state;
      const nextItems = state.items.slice();
      nextItems[idx] = { ...nextItems[idx], quantity: nextItems[idx].quantity + 1 };
      return { ...state, items: nextItems };
    }

    case ACTIONS.DECREMENT: {
      const id = action.payload;
      const idx = state.items.findIndex((i) => String(i.id) === String(id));
      if (idx < 0) return state;
      const item = state.items[idx];
      if (item.quantity <= 1) {
        // Remove when dropping to zero
        const next = state.items.filter((i) => String(i.id) !== String(id));
        return { ...state, items: next };
      }
      const nextItems = state.items.slice();
      nextItems[idx] = { ...item, quantity: item.quantity - 1 };
      return { ...state, items: nextItems };
    }

    case ACTIONS.CLEAR: {
      if (state.items.length === 0) return state;
      return { ...state, items: [] };
    }

    case ACTIONS.SET_NOTE: {
      const { id, note } = action.payload || {};
      const idx = state.items.findIndex((i) => String(i.id) === String(id));
      if (idx < 0) return state;
      const nextItems = state.items.slice();
      nextItems[idx] = { ...nextItems[idx], notes: note || '' };
      return { ...state, items: nextItems };
    }

    default:
      return state;
  }
}

/**
 * Contexts
 */
const CartStateContext = createContext(undefined);
const CartDispatchContext = createContext(undefined);

/**
 * Helpers for cents math and tax
 */
function sumLineItemsCents(items) {
  // sum of unit_price_cents * quantity
  let total = 0;
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    const line = (it.unit_price_cents || 0) * (it.quantity || 0);
    total += line;
  }
  return total;
}

/**
 * Placeholder tax rate: 8.875% (NYC-like). All in cents to remain currency-agnostic.
 * Change this if a different tax applies; could be made configurable via env later.
 */
const DEFAULT_TAX_RATE_BPS = 887.5; // basis points with 1 decimal (8.875% -> 887.5)
const BPS_SCALE = 10000; // 10000 = 100.00%

function computeTaxCents(subtotalCents, rateBps = DEFAULT_TAX_RATE_BPS) {
  // Avoid floats by scaling. To support 1 decimal BPS, multiply by 10.
  // tax = round(subtotal * rate / 100) but we maintain cents scale.
  // Use Math.round for typical tax rounding.
  const scaledSubtotal = subtotalCents * 10;
  const taxTimes10 = Math.round((scaledSubtotal * rateBps) / BPS_SCALE);
  // Convert back from x10 to cents
  return Math.round(taxTimes10 / 10);
}

/**
 * PUBLIC_INTERFACE
 * CartProvider - React context provider managing the cart state and exposing
 * actions and selectors. Persists state in sessionStorage.
 *
 * Usage:
 *   <CartProvider>
 *     <App />
 *   </CartProvider>
 */
export function CartProvider({ children }) {
  // Initialize from sessionStorage once
  const didInitRef = useRef(false);
  const [state, dispatch] = useReducer(cartReducer, initialState, (base) => {
    const saved = readCartFromSession();
    return saved || base;
  });

  // Persist changes to sessionStorage
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
    }
    writeCartToSession(state);
  }, [state]);

  // Selectors computed with useMemo to avoid recalculation on unrelated renders
  const selectors = useMemo(() => {
    const items = state.items;

    const subtotalCents = sumLineItemsCents(items);
    const taxCents = computeTaxCents(subtotalCents, DEFAULT_TAX_RATE_BPS);
    const totalCents = subtotalCents + taxCents;

    return {
      items,
      subtotalCents,
      taxCents,
      totalCents,
      itemsCount: items.reduce((acc, it) => acc + (it.quantity || 0), 0),
      // Helper to get item by id
      getItemById: (id) => items.find((i) => String(i.id) === String(id)),
    };
  }, [state.items]);

  // Stable action creators using useMemo
  const actions = useMemo(() => {
    return {
      // PUBLIC_INTERFACE
      addItem: (item) => {
        /** Add an item to the cart. If item with same id exists, quantity is increased. */
        dispatch({ type: ACTIONS.ADD_ITEM, payload: item });
      },
      // PUBLIC_INTERFACE
      removeItem: (id) => {
        /** Remove an item from the cart by id. */
        dispatch({ type: ACTIONS.REMOVE_ITEM, payload: id });
      },
      // PUBLIC_INTERFACE
      increment: (id) => {
        /** Increase quantity for the given id by 1. */
        dispatch({ type: ACTIONS.INCREMENT, payload: id });
      },
      // PUBLIC_INTERFACE
      decrement: (id) => {
        /** Decrease quantity for the given id by 1. Removes item if quantity goes to 0. */
        dispatch({ type: ACTIONS.DECREMENT, payload: id });
      },
      // PUBLIC_INTERFACE
      clear: () => {
        /** Clear the entire cart. */
        dispatch({ type: ACTIONS.CLEAR });
      },
      // PUBLIC_INTERFACE
      setItemNote: (id, note) => {
        /** Set an optional note for a specific item by id. */
        dispatch({ type: ACTIONS.SET_NOTE, payload: { id, note } });
      },
    };
  }, []);

  // Memoize the combined value to reduce re-renders for consumers
  const contextValue = useMemo(
    () => ({
      ...selectors,
      ...actions,
    }),
    [selectors, actions]
  );

  return (
    <CartStateContext.Provider value={contextValue}>
      <CartDispatchContext.Provider value={dispatch}>
        {children}
      </CartDispatchContext.Provider>
    </CartStateContext.Provider>
  );
}

/**
 * PUBLIC_INTERFACE
 * useCart - Hook exposing cart selectors and action methods.
 */
export function useCart() {
  /**
   * This hook provides:
   * - items: array of cart items
   * - itemsCount: total quantity across items
   * - subtotalCents, taxCents, totalCents
   * - getItemById(id)
   * - addItem(item), removeItem(id), increment(id), decrement(id), clear(), setItemNote(id, note)
   */
  const ctx = useContext(CartStateContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

/**
 * PUBLIC_INTERFACE
 * useCartDispatch - Hook exposing the raw dispatch for advanced scenarios.
 */
export function useCartDispatch() {
  const ctx = useContext(CartDispatchContext);
  if (!ctx) {
    throw new Error('useCartDispatch must be used within a CartProvider');
  }
  return ctx;
}
