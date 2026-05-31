/**
 * Dev-only verbose AUTH-DEBUG logging utility.
 *
 * Usage:
 *   import { authDebug, authWarn, authError } from 'src/utils/authDebug'
 *
 *   authDebug('initialize() called. Current users:', users)
 *   authWarn('Silent refresh failed', error)
 *   authError('Critical auth failure', err)
 *
 * In production or when verbose mode is off, authDebug() is a no-op.
 * Toggle verbose mode in dev with:  localStorage.setItem('verboseAuthDebug', '1')
 * Then hard refresh the page.
 */

// Key used in localStorage to enable verbose debug logging in development
const VERBOSE_AUTH_KEY = 'verboseAuthDebug'

/**
 * Returns true if we are in development AND the user has enabled verbose auth debug logging.
 */
export const isVerboseAuthDebug = () => {
  if (!import.meta.env.DEV) return false
  try {
    return localStorage.getItem(VERBOSE_AUTH_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Verbose debug logging.
 * Only outputs when running in dev AND verbose mode is enabled via localStorage.
 * Use this for noisy "normal operation" logs that you don't want in production or by default in dev.
 */
export function authDebug(...args) {
  if (isVerboseAuthDebug()) {
    console.debug('[AUTH-DEBUG]', ...args)
  }
}

/**
 * Warning level logging for auth-related issues.
 * Always visible (even when verbose mode is off).
 */
export function authWarn(...args) {
  console.warn('[AUTH]', ...args)
}

/**
 * Error level logging for auth-related failures.
 * Always visible.
 */
export function authError(...args) {
  console.error('[AUTH]', ...args)
}

// === Dev convenience: toggle from browser console ===
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.toggleAuthDebug = () => {
    const current = localStorage.getItem(VERBOSE_AUTH_KEY) === '1'
    const next = current ? '0' : '1'
    localStorage.setItem(VERBOSE_AUTH_KEY, next)

    const msg = next === '1'
      ? 'Verbose AUTH-DEBUG logging is now ON. Hard refresh to apply.'
      : 'Verbose AUTH-DEBUG logging is now OFF.'

    console.log(`%c[AUTH] ${msg}`, 'color:#888')
  }

  // Optional: one-time hint when verbose mode is active
  if (isVerboseAuthDebug()) {
    console.debug('%c[AUTH-DEBUG] Verbose auth logging enabled via localStorage', 'color:#4ade80')
  }
}

export default {
  authDebug,
  authWarn,
  authError,
  isVerboseAuthDebug,
}