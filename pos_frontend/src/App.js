import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import './App.css';

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

// Simple placeholder components for routes
function Orders() {
  return (
    <div className="card">
      <div className="h2">Orders</div>
      <p className="muted">Create and manage current orders.</p>
    </div>
  );
}
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
    <div className="card">
      <div className="h2">Checkout</div>
      <p className="muted">Process payments and receipts.</p>
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

function StatusBarPlaceholder() {
  return (
    <div className="statusbar">
      <span className="muted">Status: Ready</span>
      <span className="muted" style={{ marginLeft: 'auto' }}>
        Ocean Professional Theme
      </span>
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
          <Route path="/orders" element={<Orders />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/settings" element={<Settings />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/orders" replace />} />
        </Routes>
      </main>

      {/* Bottom status bar */}
      <StatusBarPlaceholder />
    </div>
  );
}

export default App;
