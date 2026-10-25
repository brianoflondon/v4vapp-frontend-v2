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
