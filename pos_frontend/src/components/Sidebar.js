import React from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../assets/logo.svg';

/**
 * PUBLIC_INTERFACE
 * Sidebar - Vertical navigation for Fall Cafe POS with Ocean Professional styling.
 *
 * Features:
 * - App brand/logo area at the top.
 * - Nav links using react-router-dom NavLink to: /orders, /menu, /checkout, /sales, /settings.
 * - Active link styling via "active" class and inline styles using CSS variables.
 * - Keyboard accessible: role="navigation", aria-label, focus-visible outlines respected.
 * - Responsive: collapses brand text on medium widths (handled by App.css) and provides a compact mode via prop.
 *
 * Props:
 * - collapsed?: boolean - when true, renders icon-only labels (useful for <= 1024px compact column).
 * - onNavigate?: (path: string) => void - optional callback when a nav item is activated.
 */
function Sidebar({ collapsed = false, onNavigate }) {
  // Navigation items definition. Icons use emoji for zero-dependency UI.
  const items = [
    { to: '/orders', label: 'Orders', icon: '🧾' },
    { to: '/menu', label: 'Menu', icon: '🍽️' },
    { to: '/checkout', label: 'Checkout', icon: '💳' },
    { to: '/sales', label: 'Sales', icon: '📈' },
    { to: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  // Provide a11y labels for the nav group
  const navAriaLabel = 'Primary';

  // Common active/inactive styles leveraging CSS variables from index.css/App.css
  const linkBaseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.55rem 0.65rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid transparent',
    textDecoration: 'none',
    transition: 'background var(--transition), color var(--transition), border-color var(--transition)',
  };

  const activeStyle = {
    background: 'rgba(37,99,235,0.10)',
    color: 'var(--color-primary)',
    borderColor: 'rgba(37,99,235,0.20)',
  };

  const iconOnlyStyle = collapsed
    ? {
        justifyContent: 'center',
        padding: '0.6rem',
      }
    : undefined;

  // Handle Enter/Space key activation for links when focused
  const handleKeyActivate = (e, path) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onNavigate) onNavigate(path);
      // Let NavLink handle navigation via click simulation
      e.currentTarget.click();
    }
  };

  return (
    <aside className="sidebar" role="navigation" aria-label={`${navAriaLabel} navigation`}>
      <div className="brand" aria-label="Application">
        <img
          src={logo}
          alt="Fall Cafe POS"
          width="24"
          height="24"
          style={{ display: 'block' }}
          onLoad={(e) => {
            // If the logo loads fine, hide the emoji to avoid duplicate visuals
            const sib = e.currentTarget.nextElementSibling;
            if (sib && sib.getAttribute && sib.getAttribute('aria-label') === 'coffee mug') {
              sib.style.display = 'none';
            }
          }}
          onError={(e) => {
            // Hide the broken image and allow the emoji + text to be visible
            e.currentTarget.style.display = 'none';
          }}
        />
        <span role="img" aria-label="coffee mug" style={{ display: 'inline-block' }}>☕</span>
        {/* Brand text is auto-hidden on medium screens by App.css; also hide when collapsed */}
        {!collapsed && <span className="text">Fall Cafe POS</span>}
      </div>

      <nav className="nav" aria-label="Main">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            // NavLink v6: className and style accept function with isActive
            className={({ isActive }) => (isActive ? 'active' : undefined)}
            style={({ isActive }) => ({
              ...linkBaseStyle,
              ...(iconOnlyStyle || {}),
              ...(isActive ? activeStyle : {}),
            })}
            aria-label={collapsed ? item.label : undefined}
            onKeyDown={(e) => handleKeyActivate(e, item.to)}
          >
            <span aria-hidden="true">{item.icon}</span>
            {/* Visually hide text when collapsed for compact mode */}
            {!collapsed && <span className="nav-text">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
