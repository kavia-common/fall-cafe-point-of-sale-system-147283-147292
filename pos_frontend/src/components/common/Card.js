import React, { useId, useRef } from 'react';

/**
 * PUBLIC_INTERFACE
 * Card component - Ocean Professional styled surface container.
 *
 * Props:
 * - title: optional string or node for the header area
 * - children: main content
 * - footer: optional node for footer actions or info
 * - className: extra classes
 *
 * Notes:
 * - Uses .card class from CSS which is themed using CSS variables.
 * - Provides semantic regions with roles/aria when title is present.
 */
function Card({ title, children, footer, className = '', ...rest }) {
  // Call hooks unconditionally to satisfy rules-of-hooks
  const rid = useId();
  const fallbackIdRef = useRef(null);

  // Derive a stable id: prefer useId output; ensure a fallback exists for environments without deterministic ids
  if (fallbackIdRef.current === null) {
    fallbackIdRef.current = `card-title-${Math.random().toString(36).slice(2, 9)}`;
  }
  const generatedId = rid || fallbackIdRef.current;

  const labelledBy = title ? generatedId : undefined;

  return (
    <section
      className={['card', className].filter(Boolean).join(' ')}
      aria-labelledby={labelledBy}
      {...rest}
    >
      {title ? (
        <header
          id={generatedId}
          className="card-header"
          style={{
            marginBottom: 'var(--space-3)',
            fontWeight: 600,
            fontSize: '1.05rem',
          }}
        >
          {title}
        </header>
      ) : null}

      <div className="card-body">{children}</div>

      {footer ? (
        <footer
          className="card-footer"
          style={{
            marginTop: 'var(--space-4)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            gap: 'var(--space-2)',
            justifyContent: 'flex-end',
          }}
        >
          {footer}
        </footer>
      ) : null}
    </section>
  );
}

export default Card;
