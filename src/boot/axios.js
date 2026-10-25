import { defineBoot } from "#q-app"
import axios from "axios"
import { authDebug } from "src/utils/authDebug"
import {
  refreshCookieIsDead,
  requestSendsRefreshCookie,
  resolveApiBases,
} from "src/utils/authSession"

function isAuthSessionProbe(url) {
  if (!url || typeof url !== "string") return false
  const path = url.split("?")[0]
  return path === "/auth/session" || path.endsWith("/auth/session")
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)


// ---------------------------------------------------------------------------
// API base URL selection (build-time .env + runtime page host)
//
// VUE_APP_LOCAL_API (from .env; @quasar/app-vite may inject true/false as
// real booleans, not strings — always compare both forms).
// Read via import.meta.env (app-vite v3); clientPrefix includes VUE_APP_*:
//   true  → always http://localhost:1818
//   false → never local, even when the app is served from localhost/LAN
//   unset → local only if the page host looks like localhost/LAN
//
// VUE_APP_DEV_API:
//   true  → https://devapi.v4v.app when the page is not the SPA host
//   also auto-enabled when the page host contains "dev.v4v.app"
//
// v4v.app and dev.v4v.app use relative /api so the refresh cookie is
// first-party. Traefik strips /api and forwards to the API service.
// Priority: local :1818  >  SPA /api  >  devapi (localhost pointed at dev)
//
// Example (.env) to force remote dev API while developing on localhost:
//   VUE_APP_LOCAL_API=false
//   VUE_APP_DEV_API=true
// ---------------------------------------------------------------------------

const localApiEnv = import.meta.env.VUE_APP_LOCAL_API
const devApiEnv = import.meta.env.VUE_APP_DEV_API

const resolvedBases = resolveApiBases({
  href: window.location.href,
  localApiEnv,
  devApiEnv,
})
const { apiURL, apiLoginURL, useLocal, useDev } = resolvedBases
const isLocalhost =
  window.location.href.includes("localhost") ||
  window.location.href.includes("127.0") ||
  window.location.href.includes("192.168") ||
  window.location.href.includes("10.0")
const isDevHost = window.location.href.includes("dev.v4v.app")

authDebug("API URL selection:", {
  localApiEnv,
  devApiEnv,
  isLocalhost,
  isDevHost,
  useLocal,
  useDev,
  apiURL,
  apiLoginURL,
})

// Set dev accounts if useDev or useLocal is true
const useDevAccounts = useDev || useLocal

const serverHiveAccount = useDevAccounts ? "devser.v4vapp" : "v4vapp"
const serverHiveAccountTreasury = useDevAccounts
  ? "devtre.v4vapp"
  : "v4vapp.tre"

// Domain controls for lightning addresses / QR text
const lightningAddressDomainSuffix = "v4v.app"
const lightningAddressDomainPrefix = useDevAccounts ? "d" : ""

// API base path for v4vapp endpoints
const API_BASE = "/v2/v4vapp/"

const api = axios.create({ baseURL: apiURL })
const apiLogin = axios.create({
  baseURL: apiLoginURL,
  // withCredentials stays off by default. Credentialed requests cannot use
  // Access-Control-Allow-Origin: *, so the pre-login challenge (/auth/{name})
  // must not send the cookie. Login and session routes opt in below.
})

// One in-flight POST /auth/refresh per requested account, shared by
// ensureAccessToken and the 401 interceptor. A refresh for account A must
// not satisfy (or block) a refresh for account B.
const refreshFlights = new Map()

/**
 * POST /auth/refresh for one account. Callers share the promise while it is
 * in flight.
 *
 * @param {string|null} forUser Account to mint an access token for.
 * @returns {Promise<import("axios").AxiosResponse|null>}
 */
export function refreshAccessToken(forUser) {
  const key = forUser || ""
  const inflight = refreshFlights.get(key)
  if (inflight) return inflight

  const body = forUser ? { for_user: forUser } : null
  const flight = apiLogin
    .post("/auth/refresh", body, { withCredentials: true })
    .finally(() => {
      if (refreshFlights.get(key) === flight) refreshFlights.delete(key)
    })
  refreshFlights.set(key, flight)
  return flight
}

function attachRefreshCookie(config) {
  if (requestSendsRefreshCookie(config?.url)) {
    config.withCredentials = true
  }
  return config
}

// One-time loud boot message (only in verbose debug mode)
authDebug(">>> NEW AXIOS BOOT FILE LOADED WITH REFRESH INTERCEPTOR <<<")

/**
 * Request interceptor (currently only on apiLogin for auth routes).
 * The main refresh logic lives in the *response* interceptor attached to BOTH api and apiLogin.
 */
apiLogin.interceptors.request.use(
  (config) => {
    // Login and session routes must send the refresh cookie so a second
    // account joins allowed_users instead of starting a new session.
    attachRefreshCookie(config)

    if (config.url?.includes("/auth/") || requestSendsRefreshCookie(config.url)) {
      authDebug(
        "Outgoing auth-related request:",
        config.method?.toUpperCase(),
        config.url,
      )
    }

    return config
  },
  (error) => Promise.reject(error),
)

// Also attach to the main `api` instance for consistent auth-related request logging.
api.interceptors.request.use(
  (config) => {
    attachRefreshCookie(config)
    if (config.url?.includes("/auth/") || requestSendsRefreshCookie(config.url)) {
      authDebug(
        "Outgoing auth-related request:",
        config.method?.toUpperCase(),
        config.url,
      )
    }
    return config
  },
  (error) => Promise.reject(error),
)

/**
 * Response interceptor for auth failures.
 * Part of the full hardened auth solution (short-lived access + HttpOnly refresh cookie).
 *
 * DESIGN RULE (multi-account safety):
 *   This interceptor MUST NEVER call logoutAll() or logoutUser().
 *   A refused refresh marks that account reauthNeeded and drops it from
 *   sessionAccounts. The account stays in `users` so the card can offer
 *   re-add. Further /auth/refresh calls for that account are skipped until
 *   a successful login clears the flag. Only an explicit user logout
 *   removes the account.
 *
 * On 401 from a protected endpoint:
 *   - Try one silent refresh for the current account (shared in-flight promise)
 *   - If successful, retry the original request
 *   - If refresh is refused, keep the account and ask the user to re-add it
 *
 * 403 is a permission answer, not an expired token. Do not refresh.
 */
// Attach the refresh interceptor to BOTH instances so that a 401 on any
// authenticated call (whether through `api` or `apiLogin`) can trigger the
// silent refresh using the HttpOnly cookie.
export const refreshInterceptor = async (error) => {
  authDebug("=== Response ERROR intercepted ===", {
    url: error?.config?.url,
    status: error?.response?.status,
    base: error?.config?.baseURL,
  })

  const originalRequest = error.config

  if (
    error?.response?.status === 401 &&
    originalRequest &&
    !originalRequest._retry &&
    originalRequest.url !== "/auth/refresh" &&
    originalRequest.url !== "/auth/logout" &&
    !isAuthSessionProbe(originalRequest.url)
  ) {
    originalRequest._retry = true

    authDebug(">>> 401 intercepted on:", originalRequest?.url)

    try {
      const { useStoreUser } = await import("src/stores/storeUser")
      let storeUser = null
      try {
        storeUser = useStoreUser()
      } catch {
        // store not ready
      }
      const intendedUser = storeUser?.currentUser || null

      // A refused refresh stays refused. Do not post /auth/refresh again
      // until the user re-adds the account (login clears reauthNeeded).
      if (intendedUser && storeUser?.reauthNeeded?.[intendedUser]) {
        authDebug(
          "401 while this account already needs re-add — not refreshing again",
          intendedUser,
        )
        return Promise.reject(error)
      }

      authDebug(
        "401 received — attempting silent refresh via HttpOnly cookie for",
        intendedUser || "(session primary)",
      )

      const refreshResponse = await refreshAccessToken(intendedUser)

      authDebug("/auth/refresh response status:", refreshResponse?.status)
      authDebug(
        "/auth/refresh has access token:",
        Boolean(refreshResponse?.data?.access_token),
      )

      if (refreshResponse?.data?.access_token) {
        const newToken = refreshResponse.data.access_token

        authDebug("Silent refresh SUCCESS — got new access token")

        // Decode to learn the *real* owner of this token. Do not log the token.
        let tokenOwner = null
        try {
          const payload = JSON.parse(atob(newToken.split(".")[1]))
          if (payload?.username) tokenOwner = payload.username
        } catch {
          // non-fatal
        }
        if (tokenOwner) {
          authDebug("Silent refresh token owner (from JWT):", tokenOwner)
        }

        // Only stomp the global Authorization header if the token we just got
        // is for the *current* user in the UI. Otherwise we would send one
        // account's token on calls the UI thinks are for another account.
        const shouldSetGlobalHeader =
          !tokenOwner || tokenOwner === storeUser?.currentUser

        if (shouldSetGlobalHeader) {
          api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`
          apiLogin.defaults.headers.common["Authorization"] =
            `Bearer ${newToken}`
        }

        try {
          if (storeUser && typeof storeUser.applyServerSession === "function") {
            storeUser.applyServerSession(refreshResponse.data)
          }
          if (storeUser && typeof storeUser.setAccessToken === "function") {
            storeUser.setAccessToken(newToken, tokenOwner)
          }
          if (storeUser && tokenOwner) {
            storeUser.clearReauthNeeded(tokenOwner)
          }
        } catch {
          // non-fatal
        }

        if (!originalRequest.headers) originalRequest.headers = {}
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`
        return axios(originalRequest)
      } else if (refreshResponse) {
        authDebug("/auth/refresh responded but no access_token in body")
      }
    } catch (refreshError) {
      authDebug(
        "Silent refresh failed — account stays; user can re-add it",
        refreshError?.response?.status || refreshError?.message,
      )

      // Never logoutAll / logoutUser from a refused refresh.
      // A dead cookie marks every account once. One account missing from
      // an otherwise valid session is marked on its own.
      let affectedUser = null
      try {
        const { useStoreUser } = await import("src/stores/storeUser")
        const storeUser = useStoreUser()

        if (
          storeUser &&
          refreshCookieIsDead(refreshError?.response?.data?.detail) &&
          typeof storeUser.noteRefreshCookieDead === "function"
        ) {
          storeUser.noteRefreshCookieDead()
          return Promise.reject(error)
        }

        const authHeader =
          originalRequest?.headers?.Authorization ||
          originalRequest?.headers?.authorization
        if (authHeader && typeof authHeader === "string") {
          const token = authHeader.replace(/^Bearer\s+/i, "")
          const payload = JSON.parse(atob(token.split(".")[1]))
          if (payload?.username) affectedUser = payload.username
        }
        if (!affectedUser) affectedUser = storeUser?.currentUser

        if (storeUser && affectedUser) {
          const affectedUserObj = storeUser.users?.[affectedUser]
          const isPureKeychain = affectedUserObj && !affectedUserObj.authKey

          if (isPureKeychain) {
            // Keychain has no refresh cookie. Keep the account. Clear only the
            // short-lived token and let the card offer a new signature.
            authDebug(
              "Refresh failed for pure keychain account — not logging out. Account remains in list.",
              affectedUser,
            )
            if (storeUser.accessTokens) {
              delete storeUser.accessTokens[affectedUser]
            }
            storeUser.markReauthNeeded(affectedUser)
          } else if (typeof storeUser.noteRefreshRefused === "function") {
            authDebug(
              "Refresh refused for HAS/passkey account — reauth needed, account kept",
              affectedUser,
            )
            storeUser.noteRefreshRefused(affectedUser)
          }
        }
      } catch {
        // non-fatal
      }
    }
  }

  return Promise.reject(error)
}

api.interceptors.response.use((response) => response, refreshInterceptor)
apiLogin.interceptors.response.use((response) => response, refreshInterceptor)

export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API

  app.config.globalProperties.$apiLogin = apiLogin
})

export {
  axios,
  api,
  apiLogin,
  apiURL,
  API_BASE,
  serverHiveAccount,
  serverHiveAccountTreasury,
  lightningAddressDomainSuffix,
  lightningAddressDomainPrefix,
}
