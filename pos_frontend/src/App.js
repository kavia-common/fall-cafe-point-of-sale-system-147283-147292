import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import StatusBar from './components/StatusBar';
import MenuGrid from './features/orders/MenuGrid';
import CurrentOrder from './features/orders/CurrentOrder';
import CheckoutPanel from './features/checkout/CheckoutPanel';
import { CartProvider } from './state/cartContext';

/**
 * Ocean Professional App Shell
 * - Left sidebar navigation
 * - Header within main content
 * - Main outlet area for routed content
 * - Bottom status bar
 * 
 * Note: Uses simple internal placeholders for now (no external components).
 * Avoids any Supabase usage to keep preview working without env vars.
 */

// Simple placeholder components for routes (kept for other routes)
function Menu() {
  return (
    <div className="card">
      <div className="h2">Menu</div>
      <p className="muted">Browse and maintain menu items.</p>
    </div>
  );
}
function Checkout() {
  return (
    <div>
      <CheckoutPanel />
    </div>
  );
}
function Sales() {
  return (
    <div className="card">
      <div className="h2">Sales</div>
      <p className="muted">Review reports and daily totals.</p>
    </div>
  );
}
function Settings() {
  return (
    <div className="card">
      <div className="h2">Settings</div>
      <p className="muted">Configure preferences and devices.</p>
    </div>
  );
}

// Sidebar and StatusBar placeholders to be replaced by real components later
function SidebarPlaceholder() {
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);
  return (
    <aside className="sidebar">
      <div className="brand">
        <span role="img" aria-label="coffee">☕</span>
        <span className="text">Fall Cafe POS</span>
      </div>
      <nav className="nav">
        <Link className={isActive('/orders') ? 'active' : ''} to="/orders">Orders</Link>
        <Link className={isActive('/menu') ? 'active' : ''} to="/menu">Menu</Link>
        <Link className={isActive('/checkout') ? 'active' : ''} to="/checkout">Checkout</Link>
        <Link className={isActive('/sales') ? 'active' : ''} to="/sales">Sales</Link>
        <Link className={isActive('/settings') ? 'active' : ''} to="/settings">Settings</Link>
      </nav>
    </aside>
  );
}

function OrdersPage() {
  // Two-column responsive layout: menu grid and current order placeholder
  const containerStyle = {
    display: 'grid',
    gap: 'var(--space-4)',
    gridTemplateColumns: '2fr 1fr',
  };
  const responsive = `
    @media (max-width: 1100px) {
      .orders-layout {
        grid-template-columns: 1fr;
      }
    }
  `;

  return (
    <div>
      <style>{responsive}</style>
      <div className="orders-layout" style={containerStyle}>
        <section>
          <div className="h3" style={{ marginBottom: 'var(--space-3)' }}>Menu</div>
          <MenuGrid />
        </section>

        <aside>
          <div className="h3" style={{ marginBottom: 'var(--space-3)' }}>Current Order</div>
          <CurrentOrder />
        </aside>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  // basic theme toggle without external dependencies
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  return (
    <CartProvider>
      <div className="app">
        {/* Sidebar region */}
        <SidebarPlaceholder />

        {/* Header inside main content column */}
        <header className="header gradient">
          <div className="h3">Fall Cafe POS</div>
          <div className="toolbar">
            <button
              className="button ghost"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </header>

        {/* Main outlet area */}
        <main className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/orders" replace />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/settings" element={<Settings />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/orders" replace />} />
          </Routes>
        </main>

        {/* Bottom status bar */}
        <StatusBar statusMessage="Ready" statusType="info" />
      </div>
    </CartProvider>
  );
}

export default App;
