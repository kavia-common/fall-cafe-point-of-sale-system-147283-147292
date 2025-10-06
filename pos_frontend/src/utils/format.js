//
// Formatting utilities for currency and date/time across the POS app.
// Uses Intl.* formatters and includes guards for null/undefined and invalid inputs.
//

/**
 * PUBLIC_INTERFACE
 * formatCurrencyFromCents formats an integer amount in minor units (cents) into
 * a localized currency string using Intl.NumberFormat.
 *
 * Examples:
 *   formatCurrencyFromCents(1250) -> "$12.50"
 *   formatCurrencyFromCents(0) -> "$0.00"
 *   formatCurrencyFromCents(null) -> ""
 *
 * @param {number|null|undefined} cents - Amount in minor units (e.g., cents).
 * @param {string} [locale='en-US'] - BCP 47 locale string.
 * @param {string} [currency='USD'] - ISO 4217 currency code.
 * @returns {string} - Formatted currency string or empty string on invalid input.
 */
export function formatCurrencyFromCents(cents, locale = 'en-US', currency = 'USD') {
  // Return empty string for nullish or non-finite values
  if (cents === null || cents === undefined) return '';
  const num = Number(cents);
  if (!Number.isFinite(num)) return '';

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    // Convert integer cents to major units
    return formatter.format(num / 100);
  } catch {
    // Fallback to simple formatting in case of Intl errors
    const major = (num / 100).toFixed(2);
    return `${currency} ${major}`;
  }
}

/**
 * Convert various date-like inputs into a valid Date or return null if invalid.
 * Accepts Date, timestamp number, or parseable date string.
 * @param {Date|string|number|null|undefined} dateLike
 * @returns {Date|null}
 */
function toValidDate(dateLike) {
  if (dateLike === null || dateLike === undefined) return null;

  let d;
  if (dateLike instanceof Date) {
    d = dateLike;
  } else if (typeof dateLike === 'number') {
    d = new Date(dateLike);
  } else if (typeof dateLike === 'string') {
    const trimmed = dateLike.trim();
    if (!trimmed) return null;
    d = new Date(trimmed);
  } else {
    return null;
  }

  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * PUBLIC_INTERFACE
 * formatDate returns a localized date string.
 *
 * @param {Date|string|number|null|undefined} dateLike
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatDate(dateLike, locale = 'en-US') {
  const d = toValidDate(dateLike);
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(d);
  } catch {
    // ISO-like fallback
    return d.toISOString().slice(0, 10);
  }
}

/**
 * PUBLIC_INTERFACE
 * formatTime returns a localized time string.
 *
 * @param {Date|string|number|null|undefined} dateLike
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatTime(dateLike, locale = 'en-US') {
  const d = toValidDate(dateLike);
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    // Basic HH:MM fallback
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}

/**
 * PUBLIC_INTERFACE
 * formatDateTime returns a localized date-time string.
 *
 * @param {Date|string|number|null|undefined} dateLike
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatDateTime(dateLike, locale = 'en-US') {
  const d = toValidDate(dateLike);
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    // Fallback combine date + time
    const date = d.toISOString().slice(0, 10);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${date} ${hh}:${mm}`;
  }
}

// Default export for convenient import style
const format = {
  formatCurrencyFromCents,
  formatDate,
  formatTime,
  formatDateTime,
};

export default format;
