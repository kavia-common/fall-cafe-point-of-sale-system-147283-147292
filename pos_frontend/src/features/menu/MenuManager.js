import React, { useEffect, useMemo, useState } from 'react';
import useSupabaseTable from '../../hooks/useSupabaseTable';
import { Card, Button, Input } from '../../components/common';
import { formatCurrencyFromCents } from '../../utils/format';

/**
 * PUBLIC_INTERFACE
 * MenuManager - Admin/manager UI to manage 'menu_items' with CRUD using useSupabaseTable.
 *
 * Table: menu_items
 * Columns: id, name, price_cents, category, active
 *
 * Features:
 * - List items with filters (category), search, and basic sorting.
 * - Create new item with validations.
 * - Inline edit for name, price_cents (integer >= 0), category, active (boolean).
 * - Delete item.
 * - Accessible labels, clear empty/error states, Ocean Professional styling.
 * - Works gracefully when Supabase is not configured (shows helpful banner, local-only UI).
 */
function MenuManager() {
  const { data, loading, error, create, update, remove, refresh, isConfigured } = useSupabaseTable({
    table: 'menu_items',
    select: 'id, name, price_cents, category, active',
    orderBy: 'name',
    orderAsc: true,
  });

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Local draft for creating a new item
  const [newItem, setNewItem] = useState({
    name: '',
    price_cents: '',
    category: '',
    active: true,
  });
  const [newErrors, setNewErrors] = useState({});

  // Inline edit state map: { [id]: {name, price_cents, category, active, errors?} }
  const [edits, setEdits] = useState({});

  useEffect(() => {
    // Reset edit states on reload
    setEdits({});
  }, [data]);

  const categories = useMemo(() => {
    const set = new Set();
    (data || []).forEach((i) => {
      if (i.category) set.add(String(i.category));
    });
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [data]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (data || []).filter((i) => {
      const matchesCategory =
        categoryFilter === 'all' || String(i.category || '') === String(categoryFilter);
      const matchesSearch =
        s.length === 0 ||
        String(i.name || '').toLowerCase().includes(s) ||
        String(i.category || '').toLowerCase().includes(s);
      return matchesCategory && matchesSearch;
    });
  }, [data, search, categoryFilter]);

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

  // Validation helpers
  const parsePriceCents = (value) => {
    // Accept integers only, treat empty as NaN
    if (value === '' || value === null || value === undefined) return NaN;
    const n = Number(value);
    if (!Number.isFinite(n)) return NaN;
    if (!Number.isInteger(n)) return NaN;
    return n;
  };
  const validateItemFields = (name, price_cents) => {
    const errs = {};
    if (!name || String(name).trim().length === 0) {
      errs.name = 'Name is required';
    }
    const cents = parsePriceCents(price_cents);
    if (!Number.isInteger(cents) || cents < 0) {
      errs.price_cents = 'Price must be an integer >= 0 (in cents)';
    }
    return errs;
  };

  // Create new item
  const handleCreate = async () => {
    const errs = validateItemFields(newItem.name, newItem.price_cents);
    setNewErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      name: String(newItem.name).trim(),
      price_cents: parsePriceCents(newItem.price_cents),
      category: newItem.category ? String(newItem.category).trim() : null,
      active: Boolean(newItem.active),
    };
    const { error: cerr } = await create(payload);
    if (!cerr) {
      setNewItem({ name: '', price_cents: '', category: '', active: true });
      setNewErrors({});
    }
  };

  // Start editing a row
  const startEdit = (row) => {
    setEdits((prev) => ({
      ...prev,
      [row.id]: {
        name: row.name || '',
        price_cents: String(Number.isFinite(row.price_cents) ? row.price_cents : ''),
        category: row.category || '',
        active: Boolean(row.active),
        errors: {},
      },
    }));
  };

  const cancelEdit = (id) => {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const applyEditChange = (id, field, value) => {
    setEdits((prev) => {
      const row = prev[id] || {};
      return {
        ...prev,
        [id]: { ...row, [field]: value },
      };
    });
  };

  const saveEdit = async (id) => {
    const row = edits[id];
    if (!row) return;
    const errs = validateItemFields(row.name, row.price_cents);
    setEdits((prev) => ({
      ...prev,
      [id]: { ...row, errors: errs },
    }));
    if (Object.keys(errs).length > 0) return;

    const payload = {
      name: String(row.name).trim(),
      price_cents: parsePriceCents(row.price_cents),
      category: row.category ? String(row.category).trim() : null,
      active: Boolean(row.active),
    };
    const { error: uerr } = await update(id, payload);
    if (!uerr) {
      cancelEdit(id);
    }
  };

  const handleDelete = async (id) => {
    // Simple confirm for safety
    // eslint-disable-next-line no-alert
    const ok = window.confirm('Delete this menu item? This cannot be undone.');
    if (!ok) return;
    await remove(id);
  };

  const toolbarStyle = {
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 'var(--space-4)',
  };

  // Table styles
  const tableStyle = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
  };
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

  return (
    <div>
      <div className="toolbar" style={toolbarStyle}>
        <div style={{ flex: '1 1 280px' }}>
          <Input
            id="menu-mgr-search"
            label="Search"
            placeholder="Search by name or category"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ width: 220 }}>
          <label
            htmlFor="menu-mgr-category"
            style={{ display: 'inline-block', marginBottom: 'var(--space-2)', fontWeight: 500 }}
          >
            Category
          </label>
          <select
            id="menu-mgr-category"
            className="select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: '100%' }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>

        {!isConfigured && (
          <div role="note" aria-label="Supabase not configured" style={bannerStyle}>
            <span aria-hidden="true">ℹ️</span>
            <span>
              Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY to
              manage menu items.
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

      {/* New Item Card */}
      <Card
        title="Add New Menu Item"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button onClick={handleCreate} ariaLabel="Create new menu item" disabled={!isConfigured}>
              ➕ Create Item
            </Button>
          </div>
        }
      >
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          <Input
            id="new-name"
            label="Name"
            value={newItem.name}
            onChange={(e) => setNewItem((s) => ({ ...s, name: e.target.value }))}
            error={newErrors.name}
            required
          />
          <Input
            id="new-price"
            label="Price (cents)"
            value={newItem.price_cents}
            onChange={(e) => {
              const val = e.target.value;
              // Only allow digits and empty
              if (/^\d*$/.test(val)) setNewItem((s) => ({ ...s, price_cents: val }));
            }}
            error={newErrors.price_cents}
            placeholder="e.g. 450 for $4.50"
            required
          />
          <Input
            id="new-category"
            label="Category"
            value={newItem.category}
            onChange={(e) => setNewItem((s) => ({ ...s, category: e.target.value }))}
            placeholder="e.g. Coffee"
          />
          <div>
            <label htmlFor="new-active" style={{ display: 'inline-block', marginBottom: 'var(--space-2)', fontWeight: 500 }}>
              Active
            </label>
            <div>
              <input
                id="new-active"
                type="checkbox"
                checked={newItem.active}
                onChange={(e) => setNewItem((s) => ({ ...s, active: e.target.checked }))}
              />{' '}
              <span className="muted">Available for ordering</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-4">
        <Card title="Menu Items">
          {loading ? (
            <div className="muted">Loading items…</div>
          ) : filtered.length === 0 ? (
            <div className="muted">
              {isConfigured ? 'No items found.' : 'Supabase is not configured; no data to show.'}
            </div>
          ) : (
            <div role="table" aria-label="Menu items table" style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th scope="col" style={thStyle}>Name</th>
                    <th scope="col" style={thStyle}>Price</th>
                    <th scope="col" style={thStyle}>Category</th>
                    <th scope="col" style={thStyle}>Active</th>
                    <th scope="col" style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const isEditing = !!edits[row.id];
                    const draft = edits[row.id] || {};
                    const errors = draft.errors || {};
                    return (
                      <tr key={row.id}>
                        <td style={tdStyle}>
                          {isEditing ? (
                            <Input
                              id={`edit-name-${row.id}`}
                              value={draft.name}
                              onChange={(e) => applyEditChange(row.id, 'name', e.target.value)}
                              error={errors.name}
                              placeholder="Name"
                            />
                          ) : (
                            <span style={{ fontWeight: 600 }}>{row.name}</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {isEditing ? (
                            <div>
                              <Input
                                id={`edit-price-${row.id}`}
                                value={draft.price_cents}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (/^\d*$/.test(val)) applyEditChange(row.id, 'price_cents', val);
                                }}
                                error={errors.price_cents}
                                placeholder="Price in cents"
                              />
                              <div className="muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                Preview: {formatCurrencyFromCents(parsePriceCents(draft.price_cents))}
                              </div>
                            </div>
                          ) : (
                            <span>{formatCurrencyFromCents(row.price_cents)}</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {isEditing ? (
                            <Input
                              id={`edit-cat-${row.id}`}
                              value={draft.category}
                              onChange={(e) => applyEditChange(row.id, 'category', e.target.value)}
                              placeholder="Category"
                            />
                          ) : (
                            <span className="muted">{row.category || 'Uncategorized'}</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {isEditing ? (
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="checkbox"
                                checked={!!draft.active}
                                onChange={(e) => applyEditChange(row.id, 'active', e.target.checked)}
                              />
                              <span className="muted">Active</span>
                            </label>
                          ) : (
                            <span aria-label={row.active ? 'Active' : 'Inactive'}>
                              {row.active ? '✅' : '⛔'}
                            </span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {isEditing ? (
                            <>
                              <Button
                                variant="secondary"
                                onClick={() => saveEdit(row.id)}
                                ariaLabel={`Save changes for ${row.name}`}
                                disabled={!isConfigured}
                              >
                                💾 Save
                              </Button>{' '}
                              <Button
                                variant="ghost"
                                onClick={() => cancelEdit(row.id)}
                                ariaLabel={`Cancel editing ${row.name}`}
                              >
                                ✖ Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                onClick={() => startEdit(row)}
                                ariaLabel={`Edit ${row.name}`}
                                disabled={!isConfigured}
                              >
                                ✏️ Edit
                              </Button>{' '}
                              <Button
                                variant="danger"
                                onClick={() => handleDelete(row.id)}
                                ariaLabel={`Delete ${row.name}`}
                                disabled={!isConfigured}
                              >
                                🗑️ Delete
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default MenuManager;
