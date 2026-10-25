/**
 * Helpers for the multi-account refresh-cookie session.
 * The server list (allowed_users or session_users) is the only source of
 * session membership. Missing list means "not in this payload" — do not guess.
 */

/**
 * @param {unknown} payload JSON body or an axios response (`{ data }`).
 * @returns {string[]|null} Deduped account names, or null if the server sent no list.
 */
export function readAllowedUsers(payload) {
  if (!payload || typeof payload !== "object") return null

  const bodies = []
  if (payload.data && typeof payload.data === "object") bodies.push(payload.data)
  bodies.push(payload)

  for (const body of bodies) {
    if (Object.prototype.hasOwnProperty.call(body, "allowed_users")) {
      return normalizeAccountList(body.allowed_users)
    }
    if (Object.prototype.hasOwnProperty.call(body, "session_users")) {
      return normalizeAccountList(body.session_users)
    }
  }
  return null
}

function normalizeAccountList(raw) {
  if (!Array.isArray(raw)) return null
  const names = []
  for (const name of raw) {
    if (typeof name !== "string") continue
    const trimmed = name.trim()
    if (trimmed && !names.includes(trimmed)) names.push(trimmed)
  }
  return names
}

/**
 * Pick API bases.
 *
 * On v4v.app and dev.v4v.app the API is same-origin under `/api` (Traefik
 * strips that prefix). The refresh cookie is then host-only on the SPA.
 * A localhost page keeps talking to the API process, or to devapi when local
 * mode is off and the dev API flag is on.
 *
 * @param {{ href?: string, localApiEnv?: unknown, devApiEnv?: unknown }} input
 * @returns {{ apiURL: string, apiLoginURL: string, useLocal: boolean, useDev: boolean }}
 */
export function resolveApiBases({ href, localApiEnv, devApiEnv } = {}) {
  const page = String(href || "")
  const envIsTrue = (val) => val === true || val === "true"
  const envIsFalse = (val) => val === false || val === "false"
  const isLocalhost =
    page.includes("localhost") ||
    page.includes("127.0.") ||
    page.includes("192.168") ||
    page.includes("10.0")
  const useLocal = envIsFalse(localApiEnv)
    ? false
    : envIsTrue(localApiEnv) || isLocalhost
  const isDevHost = page.includes("dev.v4v.app")
  const useDev = isDevHost || envIsTrue(devApiEnv)
  const onSpaHost =
    page.includes("://dev.v4v.app") ||
    page.includes("://www.v4v.app") ||
    page.includes("://v4v.app")

  if (useLocal) {
    return {
      apiURL: "http://localhost:1818/v1",
      apiLoginURL: "http://localhost:1818/",
      useLocal,
      useDev,
    }
  }
  // Same-origin whenever the page is the SPA, and for a production build
  // that is not pointed at the dev API. Localhost + dev API stays absolute
  // because the Quasar dev server is not the Traefik `/api` route.
  if (onSpaHost || !useDev) {
    return {
      apiURL: "/api/v1",
      apiLoginURL: "/api/",
      useLocal,
      useDev,
    }
  }
  return {
    apiURL: "https://devapi.v4v.app/v1",
    apiLoginURL: "https://devapi.v4v.app/",
    useLocal,
    useDev,
  }
}

/**
 * Refresh 401 that means the cookie itself is missing, revoked, or expired.
 * "Requested account is not on this session" is a different, per-account case.
 * @param {unknown} detail
 */
export function refreshCookieIsDead(detail) {
  return detail === "Invalid or expired refresh token"
}

/**
 * Paths that must send the HttpOnly refresh cookie so a second login joins
 * the existing session instead of replacing it.
 */
const CREDENTIALED_AUTH_PATHS = new Set([
  "/token",
  "/authenticate/complete",
  "/auth/validate",
  "/auth/refresh",
  "/auth/logout",
])

export function requestSendsRefreshCookie(url) {
  const path = authPathname(url)
  return CREDENTIALED_AUTH_PATHS.has(path)
}

function authPathname(url) {
  if (!url || typeof url !== "string") return ""
  let path = url
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      path = new URL(path).pathname
    } catch {
      return ""
    }
  }
  path = path.split("?")[0]
  if (!path.startsWith("/")) path = `/${path}`
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1)
  return path
}
