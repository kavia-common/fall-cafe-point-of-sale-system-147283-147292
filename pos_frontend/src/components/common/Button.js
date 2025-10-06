import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Button component - Ocean Professional styled button.
 *
 * Props:
 * - children: React node content for the button
 * - onClick: function handler
 * - type: 'button' | 'submit' | 'reset' (default 'button')
 * - variant: 'primary' | 'secondary' | 'danger' | 'ghost' (default 'primary')
 * - size: 'sm' | 'md' | 'lg' (default 'md')
 * - disabled: boolean (default false)
 * - fullWidth: boolean (default false)
 * - ariaLabel: accessible label override (optional)
 * - className: additional class names (optional)
 *
 * Styling:
 * - Uses global CSS variables from index.css/App.css to stay consistent.
 * - Keeps minimal inline styles; relies on classNames for theming.
 */
function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  ariaLabel,
  className = '',
  ...rest
}) {
  // Base class uses the same baseline as .button/.btn utilities provided
  const base = 'button';
  const classes = [
    base,
    variant === 'secondary' ? 'secondary' : '',
    variant === 'danger' ? 'danger' : '',
    variant === 'ghost' ? 'ghost' : '',
    size === 'sm' ? 'btn-sm' : '',
    size === 'md' ? 'btn-md' : '',
    size === 'lg' ? 'btn-lg' : '',
    fullWidth ? 'w-full' : '',
    disabled ? 'is-disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Inline style minimal: map variants that are not defined in CSS utilities
  const dynamicStyle = {};
  if (variant === 'danger') {
    dynamicStyle.background = 'var(--color-error)';
    dynamicStyle.color = '#fff';
    dynamicStyle.border = '1px solid transparent';
  }
  if (fullWidth) {
    dynamicStyle.width = '100%';
  }

  // Accessible attributes
  const ariaProps = {
    'aria-disabled': disabled || undefined,
    'aria-label': ariaLabel || undefined,
  };

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      style={dynamicStyle}
      {...ariaProps}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
