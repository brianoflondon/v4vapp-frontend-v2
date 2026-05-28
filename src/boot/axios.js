import { boot } from "quasar/wrappers"
import axios from "axios"

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
// Don't change
let useLocal = false;

// Helper to check env vars that may be boolean or string (app-vite v2 auto-parses)
const envIsTrue = (val) => val === true || val === "true";
const envIsFalse = (val) => val === false || val === "false";

const isLocalhost =
  window.location.href.includes("localhost") ||
  window.location.href.includes("127.0") ||
  window.location.href.includes("192.168") ||
  window.location.href.includes("10.0")

if (envIsTrue(process.env.VUE_APP_LOCAL_API) || isLocalhost) {
  useLocal = !envIsFalse(process.env.VUE_APP_LOCAL_API)
}

const isDev = window.location.href.includes("dev.v4v.app")

const useDev = isDev || envIsTrue(process.env.VUE_APP_DEV_API)

const rootUrl = useDev ? "https://devapi.v4v.app/v1" : "https://api.v4v.app/v1"
const rootLoginUrl = useDev ? "https://devapi.v4v.app/" : "https://api.v4v.app/"

let apiURL = rootUrl
let apiLoginURL = rootLoginUrl

console.log("useLocal:", useLocal)
if (useLocal) {
  apiURL = "http://localhost:1818/v1"
  apiLoginURL = "http://localhost:1818/"
}

// Set dev accounts if useDev or useLocal is true
const useDevAccounts = useDev || useLocal

const serverHiveAccount = useDevAccounts ? "devser.v4vapp" : "v4vapp"
const serverHiveAccountTreasury = useDevAccounts
  ? "devtre.v4vapp"
  : "v4vapp.tre"

// Domain controls for lightning addresses / QR text
const lightningAddressDomainSuffix = "v4v.app"
const lightningAddressDomainPrefix = useDevAccounts ? "d" : ""

const api = axios.create({ baseURL: apiURL })
const apiLogin = axios.create({ baseURL: apiLoginURL })

// =====================================================
// DEBUG PATCH - REMOVE AFTER DIAGNOSIS
console.log("%c[AUTH-DEBUG] >>> NEW AXIOS BOOT FILE LOADED WITH REFRESH INTERCEPTOR <<<", "color: cyan; font-weight: bold; font-size: 13px")
// =====================================================

/**
 * Request interceptor — ensures Authorization header from the auth store is present.
 * Prepared for the full hardened auth solution (short-lived tokens + silent HttpOnly refresh).
 * TODO(Phase 2): add logic here or in response interceptor for silent refresh on 401.
 */
apiLogin.interceptors.request.use(
  (config) => {
    // Defensive: if the store has a current apiToken and the request doesn't already set one,
    // inject it. This reduces reliance on manual apiTokenSet() calls everywhere.
    // Note: accessing Pinia store here requires the store to be initialized.
    // For now we keep it lightweight; full integration happens with store refactor.

    // DEBUG
    if (config.url?.includes("/auth/")) {
      console.log("[AUTH-DEBUG] Outgoing auth-related request:", config.method?.toUpperCase(), config.url)
    }

    return config
  },
  (error) => Promise.reject(error),
)

/**
 * Response interceptor for auth failures.
 * Part of the full hardened auth solution (short-lived access + HttpOnly refresh cookie).
 *
 * On 401 from a protected endpoint:
 *   - Try to silently refresh using the HttpOnly refresh cookie (sent automatically by browser)
 *   - If successful, retry the original request with the new access token
 *   - If refresh fails, clear local session and let the caller handle re-login
 */
apiLogin.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      (error?.response?.status === 401 || error?.response?.status === 403) &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh" &&
      originalRequest.url !== "/auth/logout"
    ) {
      originalRequest._retry = true

      console.log("%c[AUTH-DEBUG] >>> 401/403 intercepted on:", "color: orange; font-weight: bold", originalRequest?.url)

      try {
        console.info("[auth] 401 received — attempting silent refresh via HttpOnly cookie")
        console.log("[AUTH-DEBUG] Calling POST /auth/refresh (relying on HttpOnly cookie)")

        const refreshResponse = await apiLogin.post("/auth/refresh")

        console.log("[AUTH-DEBUG] /auth/refresh response status:", refreshResponse?.status)
        console.log("[AUTH-DEBUG] /auth/refresh response data:", refreshResponse?.data)

        if (refreshResponse?.data?.access_token) {
          const newToken = refreshResponse.data.access_token

          console.log("%c[AUTH-DEBUG] Silent refresh SUCCESS — got new access token", "color: lime")

          // Update the default header for future requests
          apiLogin.defaults.headers.common["Authorization"] = `Bearer ${newToken}`

          // Also update the store if available (best effort)
          try {
            const { useStoreUser } = await import("src/stores/storeUser")
            const storeUser = useStoreUser()
            if (storeUser && typeof storeUser.setAccessToken === "function") {
              storeUser.setAccessToken(newToken)
            }
          } catch (e) {
            // store may not be initialized yet — not fatal
          }

          // Retry the original request with the new token
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`
          return apiLogin(originalRequest)
        } else {
          console.warn("[AUTH-DEBUG] /auth/refresh responded but no access_token in body")
        }
      } catch (refreshError) {
        console.warn("[auth] Silent refresh failed — user will need to re-authenticate")
        console.error("[AUTH-DEBUG] /auth/refresh FAILED. Error:", refreshError?.response?.status, refreshError?.response?.data || refreshError?.message)

        // Best effort: clear the in-memory token and local session so the app shows login UI naturally.
        try {
          const { useStoreUser } = await import("src/stores/storeUser")
          const storeUser = useStoreUser()
          if (storeUser) {
            // Use logoutAll or logout depending on desired UX. logoutAll is safest for full reset.
            if (typeof storeUser.logoutAll === "function") {
              await storeUser.logoutAll()
            } else if (typeof storeUser.logout === "function") {
              await storeUser.logout()
            }
          }
        } catch (e) {
          // non-fatal
        }
        // Let the original 401 bubble up so calling code can show appropriate UI.
      }
    }

    return Promise.reject(error)
  },
)

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
  myNodePubKey,
  serverHiveAccount,
  serverHiveAccountTreasury,
  lightningAddressDomainSuffix,
  lightningAddressDomainPrefix,
}
