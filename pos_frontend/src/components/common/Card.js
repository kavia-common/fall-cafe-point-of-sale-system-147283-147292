import React from 'react';

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
  const titleId = React.useId ? React.useId() : undefined; // React 18 has useId
  return (
    <section
      className={['card', className].filter(Boolean).join(' ')}
      aria-labelledby={title ? titleId : undefined}
      {...rest}
    >
      {title ? (
        <header
          id={titleId}
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
