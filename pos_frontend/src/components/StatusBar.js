import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * StatusBar - Bottom application status display for Fall Cafe POS.
 *
 * Features:
 * - Shows internet connectivity (Online/Offline) by listening to window 'online'/'offline' events.
 * - Displays last operation result provided via props: statusMessage and statusType.
 * - Can surface Supabase errors via supabaseError prop.
 * - Ocean Professional styling using the existing CSS variables, minimal inline styling.
 * - Accessible: includes an ARIA live region for screen reader announcements.
 *
 * Props:
 * - statusMessage?: string - message describing the last operation result.
 * - statusType?: 'success' | 'error' | 'info' - style for the last operation result. Default 'info'.
 * - supabaseError?: string | null - optional error message from Supabase requests to show prominently.
 * - className?: string - additional class names for outer container.
 *
 * Usage:
 *   <StatusBar
 *     statusMessage={opMessage}
 *     statusType={opType}      // 'success' | 'error' | 'info'
 *     supabaseError={sbError}  // optional supabase error
 *   />
 */
function StatusBar({
  statusMessage,
  statusType = 'info',
  supabaseError = null,
  className = '',
}) {
  // Connectivity state
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Subscribe to online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // In case the event listener is attached after state becomes stale
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Compute display tokens
  const connectivity = useMemo(
    () => ({
      text: isOnline ? 'Online' : 'Offline',
      color: isOnline ? 'var(--color-primary)' : 'var(--color-error)',
      dotColor: isOnline ? 'var(--color-primary)' : 'var(--color-error)',
      title: isOnline
        ? 'Device is connected to the internet'
        : 'Device is offline - some actions may be unavailable',
    }),
    [isOnline]
  );

  const statusTone = useMemo(() => {
    switch (statusType) {
      case 'success':
        return {
          color: 'var(--color-secondary)',
          label: 'Success',
        };
      case 'error':
        return {
          color: 'var(--color-error)',
          label: 'Error',
        };
      default:
        return {
          color: 'var(--color-muted)',
          label: 'Info',
        };
    }
  }, [statusType]);

  // Announce changes for a11y (live region)
  const liveRegionRef = useRef(null);
  useEffect(() => {
    const parts = [];
    parts.push(`Connectivity: ${isOnline ? 'Online' : 'Offline'}`);
    if (statusMessage) {
      parts.push(`${statusTone.label}: ${statusMessage}`);
    }
    if (supabaseError) {
      parts.push(`Supabase error: ${supabaseError}`);
    }
    const announcement = parts.join('. ');
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = announcement;
    }
  }, [isOnline, statusMessage, statusTone.label, supabaseError]);

  // Basic styles using Ocean Professional variables
  const outerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: '0 var(--space-4)',
    background: 'var(--color-surface)',
    borderTop: '1px solid var(--color-border)',
    color: 'var(--color-muted)',
    minHeight: 'var(--app-status-height)',
    fontSize: '0.925rem',
  };

  const pillBase = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.3rem 0.55rem',
    borderRadius: '9999px',
    border: '1px solid var(--color-border)',
    background: 'rgba(0,0,0,0.02)',
  };

  const dotStyle = (color) => ({
    width: 8,
    height: 8,
    borderRadius: '9999px',
    background: color,
    boxShadow: color === 'var(--color-error)' ? '0 0 0 2px rgba(239,68,68,0.15)' : 'none',
  });

  const rightSideStyle = {
    marginLeft: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    color: 'var(--color-muted)',
  };

  const sbErrorStyle = {
    ...pillBase,
    borderColor: 'rgba(239,68,68,0.35)',
    background: 'rgba(239,68,68,0.08)',
    color: 'var(--color-error)',
  };

  const statusStyle = {
    ...pillBase,
    color: statusTone.color,
    borderColor:
      statusType === 'error'
        ? 'rgba(239,68,68,0.35)'
        : statusType === 'success'
        ? 'rgba(245,158,11,0.35)'
        : 'var(--color-border)',
    background:
      statusType === 'error'
        ? 'rgba(239,68,68,0.08)'
        : statusType === 'success'
        ? 'rgba(245,158,11,0.10)'
        : 'rgba(0,0,0,0.02)',
  };

  return (
    <div className={['statusbar', className].filter(Boolean).join(' ')} style={outerStyle}>
      {/* ARIA live region - visually hidden but present for announcements */}
      <span
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />

      {/* Connectivity indicator */}
      <div
        role="status"
        aria-label={`Connectivity status: ${connectivity.text}`}
        title={connectivity.title}
        style={pillBase}
      >
        <span aria-hidden="true" style={dotStyle(connectivity.dotColor)} />
        <span style={{ color: connectivity.color, fontWeight: 600 }}>
          {connectivity.text}
        </span>
      </div>

      {/* Operation status message */}
      {statusMessage ? (
        <div role="status" aria-label={`${statusTone.label}: ${statusMessage}`} style={statusStyle}>
          <span aria-hidden="true">
            {statusType === 'success' ? '✅' : statusType === 'error' ? '⚠️' : 'ℹ️'}
          </span>
          <span>{statusMessage}</span>
        </div>
      ) : null}

      {/* Right-aligned area for Supabase errors and theme signature */}
      <div style={rightSideStyle}>
        {supabaseError ? (
          <div role="alert" aria-label={`Supabase error: ${supabaseError}`} style={sbErrorStyle}>
            <span aria-hidden="true">🛑</span>
            <span>{supabaseError}</span>
          </div>
        ) : null}

        <span className="muted" aria-hidden="true">
          Ocean Professional Theme
        </span>
      </div>
    </div>
  );
}

export default StatusBar;
