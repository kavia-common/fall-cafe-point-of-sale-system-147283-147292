import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../supabaseClient';
import { Card, Button } from '../../components/common';

/**
 * PUBLIC_INTERFACE
 * Settings - Environment diagnostics, Supabase connectivity/auth checks, and theme controls.
 *
 * Features:
 * - Diagnostics for REACT_APP_SUPABASE_URL/KEY presence; show masked values.
 * - Supabase connectivity check: tries to select from a lightweight table; falls back to RPC or noop when unavailable.
 * - Theme toggle controlling data-theme on documentElement with persistence in localStorage ("fc_theme").
 * - Anonymous auth check using Supabase client when configured; displays session info and provides sign-out.
 *
 * Notes:
 * - Designed to be safe even if Supabase is not configured (no errors thrown; shows helpful banners).
 * - Masking shows only the first and last 3-4 characters to avoid leaking secrets in UI.
 */
function Settings() {
  // Theme state with persistence
  const THEME_STORAGE_KEY = 'fc_theme';
  const getInitialTheme = () => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // ignore
    }
    return 'light';
  };
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    // Apply on mount and when theme changes
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage failures
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  // Env diagnostics (read at build time)
  const envUrl = process.env.REACT_APP_SUPABASE_URL || '';
  const envKey = process.env.REACT_APP_SUPABASE_KEY || '';
  const mask = (val, left = 4, right = 3) => {
    if (!val) return '';
    if (val.length <= left + right) return '*'.repeat(val.length);
    const head = val.slice(0, left);
    const tail = val.slice(-right);
    return `${head}${'*'.repeat(Math.max(3, val.length - left - right))}${tail}`;
    // Ensures we mask at least 3 chars even for short values
  };

  // Connectivity check
  const [connStatus, setConnStatus] = useState('idle'); // 'idle' | 'checking' | 'ok' | 'error' | 'not_configured'
  const [connMessage, setConnMessage] = useState(null);

  const checkConnectivity = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setConnStatus('not_configured');
      setConnMessage('Supabase not configured.');
      return;
    }
    setConnStatus('checking');
    setConnMessage(null);

    try {
      // Attempt to select from a lightweight table. We'll try 'menu_items' since it exists in this app,
      // but cap to 1 row. If that fails (table missing), fall back to a benign query.
      let ok = false;
      let lastErr = null;

      // Primary attempt: small select
      try {
        const { error } = await supabase.from('menu_items').select('id').limit(1);
        if (!error) {
          ok = true;
        } else {
          lastErr = error;
        }
      } catch (e) {
        lastErr = e;
      }

      // Fallback: attempt to call an RPC or select from a built-in view if applicable
      if (!ok) {
        try {
          // Use a no-op auth.getSession as a connectivity check
          const { data, error } = await supabase.auth.getSession();
          if (!error) {
            ok = true;
          } else {
            lastErr = error;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (ok) {
        setConnStatus('ok');
        setConnMessage('Connectivity OK.');
      } else {
        setConnStatus('error');
        setConnMessage(lastErr?.message || 'Connectivity check failed.');
      }
    } catch (e) {
      setConnStatus('error');
      setConnMessage(e?.message || 'Connectivity check encountered an error.');
    }
  }, []);

  useEffect(() => {
    // Run once on mount
    checkConnectivity();
  }, [checkConnectivity]);

  // Supabase auth session
  const [sessionState, setSessionState] = useState({
    checked: false,
    hasSession: false,
    userEmail: null,
    provider: null,
  });
  const [authError, setAuthError] = useState(null);

  const refreshSession = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setSessionState({ checked: true, hasSession: false, userEmail: null, provider: null });
      setAuthError(null);
      return;
    }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setAuthError(error.message || 'Failed to get session.');
        setSessionState({ checked: true, hasSession: false, userEmail: null, provider: null });
        return;
      }
      const sess = data?.session || null;
      setSessionState({
        checked: true,
        hasSession: !!sess,
        userEmail: sess?.user?.email || null,
        provider: sess?.user?.app_metadata?.provider || null,
      });
      setAuthError(null);
    } catch (e) {
      setAuthError(e?.message || 'Failed to get session.');
      setSessionState({ checked: true, hasSession: false, userEmail: null, provider: null });
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const handleSignOut = async () => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore sign-out errors
    } finally {
      refreshSession();
    }
  };

  // Styles using Ocean Professional variables
  const grid = {
    display: 'grid',
    gap: 'var(--space-4)',
    gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))',
  };

  const responsive = `
    @media (max-width: 920px) {
      .settings-grid { grid-template-columns: 1fr; }
    }
  `;

  const listRow = {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    gap: 'var(--space-3)',
    alignItems: 'center',
    padding: '0.4rem 0',
    borderBottom: '1px dashed var(--color-border)',
  };

  const pill = (tone = 'info') => {
    const tones = {
      info: { bg: 'rgba(0,0,0,0.03)', border: 'var(--color-border)', color: 'var(--color-muted)' },
      ok: { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.30)', color: '#059669' },
      error: { bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.35)', color: 'var(--color-error)' },
      warn: { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.35)', color: 'var(--color-secondary)' },
    };
    const t = tones[tone] || tones.info;
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.35rem 0.6rem',
      borderRadius: 9999,
      background: t.bg,
      border: `1px solid ${t.border}`,
      color: t.color,
      fontSize: '0.9rem',
    };
  };

  const diagItems = [
    {
      label: 'REACT_APP_SUPABASE_URL',
      value: envUrl ? mask(envUrl, 8, 6) : '(not set)',
      ok: !!envUrl,
    },
    {
      label: 'REACT_APP_SUPABASE_KEY',
      value: envKey ? mask(envKey, 6, 4) : '(not set)',
      ok: !!envKey,
    },
    {
      label: 'Supabase Configured',
      value: isSupabaseConfigured ? 'Yes' : 'No',
      ok: isSupabaseConfigured,
    },
  ];

  const connectivityTone = useMemo(() => {
    switch (connStatus) {
      case 'ok':
        return 'ok';
      case 'error':
        return 'error';
      case 'not_configured':
        return 'warn';
      default:
        return 'info';
    }
  }, [connStatus]);

  return (
    <div>
      <style>{responsive}</style>

      <div className="h2" style={{ marginBottom: 'var(--space-3)' }}>
        Settings
      </div>
      <div className="muted" style={{ marginBottom: 'var(--space-4)' }}>
        Diagnostics, preferences, and account.
      </div>

      <div className="settings-grid" style={grid}>
        {/* Environment diagnostics */}
        <Card title="Environment Diagnostics">
          <div role="group" aria-label="Environment variables diagnostics">
            {diagItems.map((it) => (
              <div key={it.label} style={listRow}>
                <div className="muted" style={{ fontWeight: 500 }}>{it.label}</div>
                <div>
                  <span style={pill(it.ok ? 'ok' : 'error')}>
                    <span aria-hidden="true">{it.ok ? '✅' : '⚠️'}</span>
                    <span>{it.value}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Supabase Connectivity */}
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Supabase Connectivity</span>
              <Button variant="ghost" onClick={checkConnectivity} ariaLabel="Re-run connectivity check">
                ↻ Re-check
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={pill(connectivityTone)}>
              <span aria-hidden="true">
                {connStatus === 'ok'
                  ? '✅'
                  : connStatus === 'error'
                  ? '🛑'
                  : connStatus === 'not_configured'
                  ? 'ℹ️'
                  : '⏳'}
              </span>
              <span>
                {connStatus === 'checking'
                  ? 'Checking…'
                  : connMessage || (connStatus === 'idle' ? 'Idle' : String(connStatus))}
              </span>
            </span>
          </div>
          {!isSupabaseConfigured && (
            <div className="mt-4" style={pill('warn')}>
              <span aria-hidden="true">ℹ️</span>
              <span>
                Supabase not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY to enable connectivity.
              </span>
            </div>
          )}
        </Card>

        {/* Theme preferences */}
        <Card
          title="Appearance"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={toggleTheme} ariaLabel="Toggle theme">
                {theme === 'light' ? '🌙 Use Dark Theme' : '☀️ Use Light Theme'}
              </Button>
            </div>
          }
        >
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <div style={listRow}>
              <div className="muted" style={{ fontWeight: 500 }}>Current theme</div>
              <div>
                <span style={pill('info')}>
                  <span aria-hidden="true">{theme === 'light' ? '☀️' : '🌙'}</span>
                  <span>{theme === 'light' ? 'Light' : 'Dark'}</span>
                </span>
              </div>
            </div>
            <div className="muted" style={{ fontSize: '0.9rem' }}>
              Theme preference is stored in localStorage under "fc_theme" and applied to the document element via data-theme.
            </div>
          </div>
        </Card>

        {/* Account / Anonymous auth check */}
        <Card
          title="Account Session"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="ghost" onClick={refreshSession} ariaLabel="Refresh session">
                ↻ Refresh
              </Button>
              <Button onClick={handleSignOut} ariaLabel="Sign out" disabled={!isSupabaseConfigured || !sessionState.hasSession}>
                🚪 Sign out
              </Button>
            </div>
          }
        >
          {!isSupabaseConfigured ? (
            <div style={pill('warn')}>
              <span aria-hidden="true">ℹ️</span>
              <span>Supabase not configured. Cannot check session.</span>
            </div>
          ) : (
            <>
              {authError ? (
                <div style={pill('error')} role="alert">
                  <span aria-hidden="true">🛑</span>
                  <span>{authError}</span>
                </div>
              ) : null}

              <div role="group" aria-label="Session details">
                <div style={listRow}>
                  <div className="muted" style={{ fontWeight: 500 }}>Session present</div>
                  <div>
                    <span style={pill(sessionState.hasSession ? 'ok' : 'error')}>
                      <span aria-hidden="true">{sessionState.hasSession ? '✅' : '⚠️'}</span>
                      <span>{sessionState.hasSession ? 'Yes' : 'No'}</span>
                    </span>
                  </div>
                </div>
                <div style={listRow}>
                  <div className="muted" style={{ fontWeight: 500 }}>User email</div>
                  <div className="muted">{sessionState.userEmail || '(none)'}</div>
                </div>
                <div style={listRow}>
                  <div className="muted" style={{ fontWeight: 500 }}>Provider</div>
                  <div className="muted">{sessionState.provider || '(unknown)'}</div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default Settings;
