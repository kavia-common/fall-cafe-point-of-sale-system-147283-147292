import { createClient } from '@supabase/supabase-js';

/**
 * PUBLIC_INTERFACE
 * isSupabaseConfigured indicates whether the Supabase client has been configured
 * with both the URL and API key from environment variables.
 *
 * Environment variables required:
 * - REACT_APP_SUPABASE_URL: The Supabase project URL
 * - REACT_APP_SUPABASE_KEY: The Supabase anon public API key
 */
export const isSupabaseConfigured = Boolean(
  process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_KEY
);

/**
 * Retrieve Supabase configuration from environment variables.
 * These must be prefixed with REACT_APP_ to be exposed to the browser build.
 */
const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_KEY;

// Provide a clear warning during development if configuration is missing.
// We still create the client with empty strings to avoid crashes during import,
// but consumers can check isSupabaseConfigured to guard feature usage.
if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_KEY. ' +
      'Supabase-backed features will be limited or disabled. ' +
      'Ensure both variables are set in your environment (e.g., .env file).'
  );
}

/**
 * PUBLIC_INTERFACE
 * supabase is the configured Supabase client for the application.
 * If configuration is missing, this will still be a valid client instance
 * created with empty strings to prevent crashes. Use isSupabaseConfigured to
 * determine whether to call Supabase-dependent features.
 *
 * Example:
 *   import { supabase, isSupabaseConfigured } from './supabaseClient';
 *   if (isSupabaseConfigured) {
 *     const { data, error } = await supabase.from('menu_items').select('*');
 *   } else {
 *     // fallback or show helpful message
 *   }
 */
export const supabase = createClient(url || '', key || '');
