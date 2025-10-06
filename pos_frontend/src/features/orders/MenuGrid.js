import React, { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../supabaseClient';
import { useCart } from '../../state/cartContext';
import { formatCurrencyFromCents } from '../../utils/format';
import { Card, Button, Input } from '../../components/common';

/**
 * PUBLIC_INTERFACE
 * MenuGrid - Displays POS menu items in a responsive grid with search and category filter.
 *
 * Data source:
 * - Supabase table 'menu_items' with fields: id, name, price_cents, category, active
 * - Only items where active = true are fetched
 *
 * Behavior:
 * - On mount (and when reload triggered), if Supabase is configured, fetches menu_items
 * - Provides text input for search and select for category (derived from loaded items)
 * - Displays items using Ocean Professional styling, formatted price using formatCurrencyFromCents
 * - Each item includes an "Add" button that adds to cart via addItem from cartContext
 * - Shows loading and error states
 * - If Supabase is not configured, shows a non-blocking banner in the grid area indicating missing config
 */
function MenuGrid() {
  const { addItem } = useCart();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured); // loading only if we attempt fetch
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  // Fetch items from Supabase when configured
  useEffect(() => {
    let isMounted = true;

    async function fetchItems() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        setItems([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data, error: sbError } = await supabase
          .from('menu_items')
          .select('id, name, price_cents, category, active')
          .eq('active', true);

        if (sbError) throw sbError;

        if (isMounted) {
          setItems(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (e) {
        if (isMounted) {
          setError(e?.message || 'Failed to load menu items.');
          setItems([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchItems();

    return () => {
      isMounted = false;
    };
  }, []);

  // Derive categories dynamically from items
  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return ['all', ...Array.from(set).sort((a, b) => String(a).localeCompare(String(b)))];
  }, [items]);

  // Apply search and category filter
  const visibleItems = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter((i) => {
      const matchesCategory = category === 'all' || String(i.category) === String(category);
      const matchesSearch =
        s.length === 0 ||
        String(i.name || '').toLowerCase().includes(s) ||
        String(i.category || '').toLowerCase().includes(s);
      return matchesCategory && matchesSearch;
    });
  }, [items, search, category]);

  // Styles aligned with Ocean Professional
  const toolbarStyle = {
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 'var(--space-4)',
  };

  const gridStyle = {
    display: 'grid',
    gap: 'var(--space-4)',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  };

  const gridStyleMd = '@media (max-width: 1200px)';
  const gridStyleSm = '@media (max-width: 900px)';
  const gridStyleXs = '@media (max-width: 640px)';

  // Inline responsive via injected style tag (keep dependencies minimal)
  const responsiveCss = `
    .menu-grid {
      display: grid;
      gap: var(--space-4);
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    ${gridStyleMd} {
      .menu-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    ${gridStyleSm} {
      .menu-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    ${gridStyleXs} {
      .menu-grid { grid-template-columns: 1fr; }
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

  const handleAdd = (item) => {
    addItem({
      id: item.id,
      name: item.name,
      unit_price_cents: Number.isFinite(item.price_cents) ? item.price_cents : 0,
      quantity: 1,
    });
  };

  return (
    <div>
      <style>{responsiveCss}</style>

      <div className="toolbar" style={toolbarStyle}>
        <div style={{ flex: '1 1 260px' }}>
          <Input
            id="menu-search"
            label="Search"
            placeholder="Search by name or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ width: 220 }}>
          <label htmlFor="menu-category" style={{ display: 'inline-block', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
            Category
          </label>
          <select
            id="menu-category"
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: '100%' }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>

        {!isSupabaseConfigured && (
          <div role="note" aria-label="Supabase not configured" style={bannerStyle}>
            <span aria-hidden="true">ℹ️</span>
            <span>
              Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY to load menu items.
            </span>
          </div>
        )}
      </div>

      {loading && (
        <Card>
          <div className="muted">Loading menu items…</div>
        </Card>
      )}

      {!loading && error && (
        <div style={errorStyle} role="alert" aria-live="polite">
          <span aria-hidden="true">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {visibleItems.length === 0 ? (
            <Card>
              <div className="muted">
                {isSupabaseConfigured
                  ? 'No items match your filters.'
                  : 'Supabase is not configured. Provide environment variables to load menu.'}
              </div>
            </Card>
          ) : (
            <div className="menu-grid">
              {visibleItems.map((item) => (
                <Card
                  key={item.id}
                  className="shadow-sm"
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                      <span className="muted">{formatCurrencyFromCents(item.price_cents)}</span>
                    </div>
                  }
                  footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button onClick={() => handleAdd(item)} ariaLabel={`Add ${item.name} to order`}>
                        ➕ Add
                      </Button>
                    </div>
                  }
                >
                  <div className="muted" style={{ fontSize: '0.9rem' }}>
                    {item.category || 'Uncategorized'}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MenuGrid;
