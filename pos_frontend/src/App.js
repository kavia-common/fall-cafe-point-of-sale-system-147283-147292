import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import StatusBar from './components/StatusBar';
import MenuGrid from './features/orders/MenuGrid';
import CurrentOrder from './features/orders/CurrentOrder';
import CheckoutPanel from './features/checkout/CheckoutPanel';
import MenuManager from './features/menu/MenuManager';
import SalesDashboard from './features/sales/SalesDashboard';
import Settings from './features/settings/Settings';
import { CartProvider } from './state/cartContext';
import Sidebar from './components/Sidebar';
import logo from './assets/logo.svg';

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


function Checkout() {
  return (
    <div>
      <CheckoutPanel />
    </div>
  );
}
function Sales() {
  return <SalesDashboard />;
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
  const THEME_STORAGE_KEY = 'fc_theme';
  const getInitialTheme = () => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // ignore storage errors
    }
    return 'light';
  };
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  return (
    <CartProvider>
      <div className="app">
        {/* Sidebar region */}
        <Sidebar />

        {/* Header inside main content column */}
        <header className="header gradient">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <img
              src={logo}
              alt="Fall Cafe POS"
              width="28"
              height="28"
              style={{ display: 'block' }}
              onError={(e) => {
                // Graceful fallback: hide broken image and show text only
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="h3" style={{ margin: 0 }}>Fall Cafe POS</div>
          </div>
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
            <Route path="/menu" element={<MenuManager />} />
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
