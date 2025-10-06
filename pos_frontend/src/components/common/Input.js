import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Input component - Accessible text input with label and helper/error text.
 *
 * Props:
 * - label: string label shown above or beside the input
 * - id: string id for input (required for proper label association)
 * - type: input type (default 'text')
 * - value: controlled value
 * - onChange: change handler (event => void)
 * - placeholder: string
 * - required: boolean
 * - disabled: boolean
 * - helperText: string for additional guidance
 * - error: string for error message; when present, styles input and message
 * - className: additional class names for the container
 * - inputClassName: additional class names for the input element
 *
 * Notes:
 * - Uses .input CSS utility and global variables for theme.
 * - Applies aria-describedby to link to helper/error text.
 */
function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  disabled,
  helperText,
  error,
  className = '',
  inputClassName = '',
  ...rest
}) {
  const helperId = id ? `${id}-help` : undefined;
  const errorId = id ? `${id}-error` : undefined;
  const describedByIds = [error ? errorId : null, helperText ? helperId : null]
    .filter(Boolean)
    .join(' ') || undefined;

  const inputStyles = {};
  if (error) {
    inputStyles.borderColor = 'var(--color-error)';
    inputStyles.boxShadow = '0 0 0 3px rgba(239,68,68,0.2)';
  }

  return (
    <div className={['input-field', className].filter(Boolean).join(' ')} {...rest}>
      {label ? (
        <label
          htmlFor={id}
          style={{
            display: 'inline-block',
            marginBottom: 'var(--space-2)',
            fontWeight: 500,
          }}
        >
          {label}
          {required ? <span aria-hidden="true" style={{ color: 'var(--color-error)' }}> *</span> : null}
        </label>
      ) : null}

      <input
        id={id}
        type={type}
        className={['input', inputClassName].filter(Boolean).join(' ')}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedByIds}
        style={inputStyles}
      />

      {error ? (
        <div
          id={errorId}
          role="alert"
          style={{
            color: 'var(--color-error)',
            marginTop: 'var(--space-2)',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      ) : helperText ? (
        <div
          id={helperId}
          style={{
            color: 'var(--color-muted)',
            marginTop: 'var(--space-2)',
            fontSize: '0.9rem',
          }}
        >
          {helperText}
        </div>
      ) : null}
    </div>
  );
}

export default Input;
