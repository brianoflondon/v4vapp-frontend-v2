import { boot } from "quasar/wrappers"
import axios from "axios"
import { authDebug, authWarn, authError } from "src/utils/authDebug"

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)

// My Lightning Node address to prevent self-payment
const myNodePubKey =
  "0266ad2656c7a19a219d37e82b280046660f4d7f3ae0c00b64a1629de4ea567668"

// const myNodePubKey = ""

// ---------------------------------------------------------------------------
// API base URL selection (build-time .env + runtime page host)
//
// VUE_APP_LOCAL_API (from .env; @quasar/app-vite may inject true/false as
// real booleans, not strings — always compare both forms):
//   true  → always http://localhost:1818
//   false → never local, even when the app is served from localhost/LAN
//   unset → local only if the page host looks like localhost/LAN
//
// VUE_APP_DEV_API:
//   true  → https://devapi.v4v.app (unless local wins)
//   also auto-enabled when the page host contains "dev.v4v.app"
//
// Priority: local :1818  >  devapi  >  production api
//
// Example (.env) to force remote dev API while developing on localhost:
//   VUE_APP_LOCAL_API=false
//   VUE_APP_DEV_API=true
// ---------------------------------------------------------------------------

// Helper: app-vite v2 injects "true"/"false" env values as bare booleans
const envIsTrue = (val) => val === true || val === "true"
const envIsFalse = (val) => val === false || val === "false"

const localApiEnv = process.env.VUE_APP_LOCAL_API
const devApiEnv = process.env.VUE_APP_DEV_API

const isLocalhost =
  window.location.href.includes("localhost") ||
  window.location.href.includes("127.0") ||
  window.location.href.includes("192.168") ||
  window.location.href.includes("10.0")

// Explicit false must win over isLocalhost (do not use `!== "false"` alone —
// when Quasar injects boolean false, `false !== "false"` is true and would
// incorrectly keep localhost).
const useLocal = envIsFalse(localApiEnv)
  ? false
  : envIsTrue(localApiEnv) || isLocalhost

const isDevHost = window.location.href.includes("dev.v4v.app")
const useDev = isDevHost || envIsTrue(devApiEnv)

const rootUrl = useDev ? "https://devapi.v4v.app/v1" : "https://api.v4v.app/v1"
const rootLoginUrl = useDev ? "https://devapi.v4v.app/" : "https://api.v4v.app/"

let apiURL = rootUrl
let apiLoginURL = rootLoginUrl

if (useLocal) {
  apiURL = "http://localhost:1818/v1"
  apiLoginURL = "http://localhost:1818/"
}

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
  // NOTE: withCredentials is NOT set by default here anymore.
  // We set it explicitly (to true) only on calls that need the HttpOnly refresh cookie:
  //   - /auth/refresh (to send cookie and receive rotated one)
  //   - /auth/validate (to receive the Set-Cookie after successful login)
  //   - /auth/logout (to send the cookie for revocation)
  // Pre-login calls like /auth/{name} (challenge) use withCredentials: false to avoid
  // the strict CORS rule that forbids ACAO: '*' on credentialed requests.
  // This makes login flows more tolerant while the backend is updated.
})

// One-time loud boot message (only in verbose debug mode)
authDebug(">>> NEW AXIOS BOOT FILE LOADED WITH REFRESH INTERCEPTOR <<<")

/**
 * Request interceptor (currently only on apiLogin for auth routes).
 * The main refresh logic lives in the *response* interceptor attached to BOTH api and apiLogin.
 */
apiLogin.interceptors.request.use(
  (config) => {
    // Defensive: if the store has a current apiToken and the request doesn't already set one,
    // inject it. This reduces reliance on manual apiTokenSet() calls everywhere.
    // Note: accessing Pinia store here requires the store to be initialized.
    // For now we keep it lightweight; full integration happens with store refactor.

    if (config.url?.includes("/auth/")) {
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
    if (config.url?.includes("/auth/")) {
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
 *   This interceptor MUST NEVER call logoutAll().
 *   Failures are always scoped to the specific affected account via logoutUser().
 *   Global logout (logoutAll) is only allowed from explicit user UI actions.
 *
 * On 401 from a protected endpoint:
 *   - Try to silently refresh using the HttpOnly refresh cookie
 *   - If successful, retry the original request
 *   - If refresh fails for one account, only log that account out
 */
// Attach the refresh interceptor to BOTH instances so that 401/403 on any authenticated call
// (whether through `api` or `apiLogin`) can trigger the silent refresh using the HttpOnly cookie.
const refreshInterceptor = async (error) => {
  authDebug("=== Response ERROR intercepted ===", {
    url: error?.config?.url,
    status: error?.response?.status,
    base: error?.config?.baseURL,
  })

  const originalRequest = error.config

  if (
    (error?.response?.status === 401 || error?.response?.status === 403) &&
    !originalRequest._retry &&
    originalRequest.url !== "/auth/refresh" &&
    originalRequest.url !== "/auth/logout"
  ) {
    originalRequest._retry = true

    authDebug(">>> 401/403 intercepted on:", originalRequest?.url)

    try {
      authDebug("401 received — attempting silent refresh via HttpOnly cookie")
      authDebug("Calling POST /auth/refresh (relying on HttpOnly cookie)")

      // In the multi-user session model, try to request a token for the
      // specific user we were trying to act as when the 401 happened.
      const { useStoreUser } = await import("src/stores/storeUser")
      let storeUserForRefresh = null
      try {
        storeUserForRefresh = useStoreUser()
      } catch {}
      const intendedUser = storeUserForRefresh?.currentUser || null
      const refreshBody = intendedUser ? { for_user: intendedUser } : null

      const refreshResponse = await apiLogin.post(
        "/auth/refresh",
        refreshBody,
        { withCredentials: true },
      )

      authDebug("/auth/refresh response status:", refreshResponse?.status)
      authDebug("/auth/refresh response data:", refreshResponse?.data)

      if (refreshResponse?.data?.access_token) {
        const newToken = refreshResponse.data.access_token

        authDebug("Silent refresh SUCCESS — got new access token")

        // Decode to learn the *real* owner of this token
        let tokenOwner = null
        try {
          const payload = JSON.parse(atob(newToken.split(".")[1]))
          if (payload?.username) tokenOwner = payload.username
        } catch (e) {
          // non-fatal
        }
        if (tokenOwner) {
          authDebug("Silent refresh token owner (from JWT):", tokenOwner)
        }

        // Only stomp the global Authorization header if the token we just got
        // is for the *current* user in the UI. Otherwise we would send
        // brianoflondon's token on calls that the UI thinks are for v4vapp-test.
        const { useStoreUser } = await import("src/stores/storeUser")
        let storeUser = null
        try {
          storeUser = useStoreUser()
        } catch {}

        const shouldSetGlobalHeader =
          !tokenOwner || tokenOwner === storeUser?.currentUser

        if (shouldSetGlobalHeader) {
          api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`
          apiLogin.defaults.headers.common["Authorization"] =
            `Bearer ${newToken}`
        }

        // Always store the token under the correct owner in the map.
        try {
          if (storeUser && typeof storeUser.setAccessToken === "function") {
            storeUser.setAccessToken(newToken, tokenOwner)
          }
          if (storeUser && tokenOwner) {
            storeUser.clearReauthNeeded(tokenOwner)
          }
        } catch (e) {
          // non-fatal
        }

        // Retry original request (global axios works because we patched the header on the request)
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`
        return axios(originalRequest)
      } else {
        authDebug("/auth/refresh responded but no access_token in body")
      }
    } catch (refreshError) {
      authDebug("Silent refresh failed — user will need to re-authenticate")
      authDebug(
        "/auth/refresh FAILED:",
        refreshError?.response?.status,
        refreshError?.response?.data || refreshError?.message,
      )

      // Per-account only. The interceptor MUST NEVER call logoutAll().
      // Identify the affected user from the original failing request if possible.
      let affectedUser = null
      try {
        const { useStoreUser } = await import("src/stores/storeUser")
        const storeUser = useStoreUser()

        // Try to extract username from the JWT that was on the failing request
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
            // For pure keychain accounts, a failed refresh (expired short token) should
            // not remove the account from the user's list. Just clear the in-memory token.
            // The user can re-trigger keychain when they need a fresh session.
            authDebug(
              "Refresh failed for pure keychain account — not logging out (short token simply expired). Account remains in list.",
              affectedUser,
            )
            if (storeUser.accessTokens) {
              delete storeUser.accessTokens[affectedUser]
            }
            storeUser.markReauthNeeded(affectedUser)
          } else if (typeof storeUser.logoutUser === "function") {
            storeUser.markReauthNeeded(affectedUser)
            await storeUser.logoutUser(affectedUser)
          } else if (typeof storeUser.logout === "function") {
            // Fallback: only logout current if we can't do better
            if (affectedUser === storeUser.currentUser) {
              await storeUser.logout()
            }
          }
        }
      } catch (e) {
        // non-fatal
      }
    }
  }

  return Promise.reject(error)
}

api.interceptors.response.use((response) => response, refreshInterceptor)
apiLogin.interceptors.response.use((response) => response, refreshInterceptor)

export default boot(({ app }) => {
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
  myNodePubKey,
  serverHiveAccount,
  serverHiveAccountTreasury,
  lightningAddressDomainSuffix,
  lightningAddressDomainPrefix,
}
