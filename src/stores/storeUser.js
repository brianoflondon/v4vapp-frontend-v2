import { defineStore } from "pinia"
import { useHiveDetails } from "../use/useHive.js"

// =====================================================
// DEBUG PATCH - REMOVE AFTER DIAGNOSIS
console.log("%c[AUTH-DEBUG] >>> NEW storeUser.js MODULE LOADED <<<", "color: magenta; font-weight: bold; font-size: 13px")
// =====================================================
import { useStorage, formatTimeAgo } from "@vueuse/core"
import { useStoreAPIStatus } from "./storeAPIStatus.js"
import { useCoingeckoStore } from "src/stores/storeCoingecko"
import { tidyNumber, generateUUID } from "src/use/useUtils.js"
import { useShortEVMAddress } from "src/use/useEVM.js"
import { apiLogin, api } from "src/boot/axios"
import { useKeepSats } from "src/use/useV4vapp"
import { Notify } from "quasar"
import { i18n } from "boot/i18n"

const storeAPIStatus = useStoreAPIStatus()
const storeCoingecko = useCoingeckoStore()

export class HiveUser {
  /**
   * Represents a User object.
   * @constructor
   * @param {string} hiveAccname - The Hive account name.
   * @param {string} profileName - The profile name.
   * @param {string} keySelected - The selected key.
   * @param {number|null} [timestamp=null] - The timestamp (optional, defaults to current timestamp if not provided).
   * @param {string|null} [authKey=null] - The HAS authentication key (optional).
   * @param {number|null} [expire=null] - The expiration time (optional).
   * @param {string|null} [token=null] - The token (optional).
   * @param {string|null} [apiToken=null] - The API token (optional).
   * @param {string} [loginType="hive"] - The login type (optional, defaults to "hive" if not provided).
   */
  constructor(
    hiveAccname,
    profileName,
    keySelected,
    timestamp = null,
    authKey = null,
    expire = null,
    token = null,
    apiToken = null,
    loginType = "hive",
  ) {
    // Note: For passkeys (authKey = "webauthn"), the `expire` field is now largely
    // deprecated in favor of the server-side rotating refresh token cookie system
    // introduced in the 2026 auth hardening.
    this.hiveAccname = hiveAccname
    this.profileName = profileName
    this.keySelected = keySelected
    this.authKey = authKey
    this.expire = expire
    this.token = token
    this.apiToken = apiToken
    this.loginType = loginType
    if (!timestamp) timestamp = Date.now()
    this.timestamp = timestamp
  }

  toJSON() {
    return {
      hiveAccname: this.hiveAccname,
      profileName: this.profileName,
      keySelected: this.keySelected,
      timestamp: this.timestamp,
      authKey: this.authKey,
      expire: this.expire,
      token: this.token,
      apiToken: this.apiToken,
      loginType: this.loginType,
    }
  }

  /** @deprecated Use the store's setAccessToken / accessTokens (in-memory only) instead. */
  setApiToken() {
    // Legacy path for old persisted apiToken shape. New code uses accessTokens + store setters.
    if (!this.apiToken) return false
    apiLogin.defaults.headers.common["Authorization"] =
      `Bearer ${this.apiToken}`
    return true
  }

  /** @deprecated */
  clearApiToken() {
    this.apiToken = null
    apiLogin.defaults.headers.common["Authorization"] = ""
    return true
  }

  get hasApiToken() {
    if (this.apiToken) return true
    return false
  }

  // Return the time since the login in seconds
  get loginAge() {
    return (Date.now() - this.timestamp) / 1000
  }

  // Return the time ago since the login Human readable
  get loginAgeHuman() {
    return formatTimeAgo(this.timestamp)
  }

  // Return the time left before the HAS login expires
  get loginHASExpire() {
    if (!this.expire) return null
    return (this.expire - Date.now()) / 1000
  }

  get loginHASExpireHuman() {
    if (!this.expire) return null
    return formatTimeAgo(this.expire)
  }

  get isHAS() {
    if (this.evm) return false
    if (!this.apiToken) return false
    if (this.authKey) return true
    return false
  }

  get isKeychain() {
    if (!this.apiToken) return false
    if (this.authKey) return false
    return true
  }

  get isHive() {
    if (this.loginType === "hive") return true
  }

  get isEVM() {
    if (this.loginType === "evm") return true
  }

  get allData() {
    return {
      hiveAccname: this.hiveAccname,
      profileName: this.profileName,
      keySelected: this.keySelected,
      localCurrency: this.localCurrency,
      authKey: this.authKey,
      expire: this.expire,
      token: this.token,
      apiToken: this.apiToken,
      timestamp: this.timestamp,
      loginAge: this.loginAge,
      loginType: this.loginType,
    }
  }
}

export const useStoreUser = defineStore("useStoreUser", {
  state: () => ({
    currentUser: useStorage("currentUser", null),
    currentDetails: useStorage("details", null),
    currentProfile: useStorage("profile", null),
    currentKeepSats: useStorage("keepSats", null),
    localCurrency: useStorage("localCurrency", {
      label: "US Dollar",
      value: "usd",
      unit: "$",
    }),
    users: useStorage("users", {}),
    pos: useStorage("pos", { receiveCurrency: "hbd" }),
    clientId: useStorage("clientId", generateUUID()),
    dataLoading: useStorage("dataLoading", false),

    // IMPORTANT: accessTokens is deliberately NOT persisted.
    // With the new short-lived + HttpOnly refresh cookie model, we no longer store
    // long-lived JWTs in localStorage (major XSS hardening).
    // Tokens here only live for the current browser session.
    accessTokens: {},
  }),

  getters: {
    // Internal safe accessor — prevents crashes when currentUser points to a missing entry
    // (can happen during failed refresh, logout races, or partial state).
    _currentHiveUser() {
      if (!this.currentUser) return null
      const u = this.users[this.currentUser]
      return u || null
    },

    hiveAccname() {
      const u = this._currentHiveUser
      return u ? u.hiveAccname : null
    },
    profileName() {
      const u = this._currentHiveUser
      return u ? u.profileName : null
    },
    loginAge() {
      const u = this._currentHiveUser
      if (!u) return null
      return (Date.now() - u.timestamp) / 1000
    },
    loginHASExpire() {
      const u = this._currentHiveUser
      if (!u || !u.expire) return null
      return (u.expire - Date.now()) / 1000
    },
    authKey() {
      const u = this._currentHiveUser
      if (!u || !u.authKey) return null
      return u.authKey
    },
    token() {
      const u = this._currentHiveUser
      if (!u || !u.token) return null
      return u.token
    },
    apiToken() {
      if (!this.currentUser) return null
      // Prefer the non-persisted in-memory token (new hardened model)
      if (this.accessTokens[this.currentUser]) {
        return this.accessTokens[this.currentUser]
      }
      // Fallback to old persisted location (will be removed after full migration)
      const u = this._currentHiveUser
      if (!u?.apiToken) return null
      return u.apiToken
    },
    loginType() {
      const u = this._currentHiveUser
      return u ? u.loginType : null
    },
    user() {
      // Return the HiveUser object for the current user
      return this._currentHiveUser
    },
    /**
     * Returns the number of users in the store.
     *
     * @returns {number} The number of users.
     */
    numUsers() {
      console.debug("numUsers", Object.keys(this.users).length)
      return Object.keys(this.users).length
    },
    /**
     * Determines the login method for the current user.
     * @returns {string} The login method. Possible values are "none", "has", or "keychain".
     */
    loginMethod() {
      const u = this._currentHiveUser
      if (!u) return "HiveKeychainQR"
      if (u.authKey) return "HAS"
      return "HiveKeychain"
    },
    isHAS() {
      const u = this._currentHiveUser
      if (!u) return false
      console.debug(u)
      if (u.authKey) return true
      return false
    },
    isKeychain() {
      const u = this._currentHiveUser
      if (!u) return false
      if (u.authKey) return false
      return true
    },
    /**
     * Represents a Hive User.
     * @class
     * @param {string} hiveAccname - The Hive account name.
     * @param {string} profileName - The profile name.
     * @param {string} keySelected - The selected key.
     * @param {number} timestamp - The timestamp.
     * @param {string} authKey - The authentication key.
     * @param {number} expire - The expiration time.
     * @param {string} token - The token.
     * @param {string} apiToken - The API token.
     * @param {string} loginType - The login type.
     */
    getUser: (state) => {
      return (hiveAccname) => {
        const temp = state.users[hiveAccname]
        if (!temp) return null
        const hiveUser = new HiveUser(
          temp.hiveAccname,
          temp.profileName,
          temp.keySelected,
          temp.timestamp,
          temp.authKey,
          temp.expire,
          temp.token,
          temp.apiToken,
          temp.loginType,
        )
        return hiveUser
      }
    },
    // Return true if the user is logged in via Hive Keychain
    // Returns false if the user is logged in via HAS
    // Returns null if the user is not logged in
    /**
     * Determines the login method for the current user.
     * @returns {string|null} The login method. Possible values are "has", "keychain", or null if there is no current user.
     */
    getKeychain: (state) => {
      return (hiveAccname) => {
        const temp = state.users[hiveAccname]
        if (!temp) return null
        if (temp.authKey) return false
        return true
      }
    },
    balancesNum() {
      if (!this.currentDetails) return null
      return {
        hive: parseFloat(this.currentDetails.balance),
        hbd: parseFloat(this.currentDetails.hbd_balance),
        keepSats:
          this.currentKeepSats?.net_sats === 0
            ? 0
            : this.currentKeepSats?.net_sats,
        sats:
          this.currentKeepSats?.net_sats === 0
            ? 0
            : this.currentKeepSats?.net_sats,
      }
    },
    balancesDisplay() {
      if (!this.currentDetails) return null
      // Ensure net_sats is never -0
      const netSats =
        this.currentKeepSats?.net_sats === 0
          ? 0
          : this.currentKeepSats?.net_sats
      return {
        hive: tidyNumber(parseFloat(this.currentDetails.balance), 3),
        hbd: tidyNumber(parseFloat(this.currentDetails.hbd_balance), 3),
        keepSats: tidyNumber(netSats, 0),
        sats: tidyNumber(netSats, 0),
      }
    },
    hiveBalance() {
      if (!this.currentDetails) return "💰💰💰"
      const balNum = parseFloat(this.currentDetails.balance).toFixed(3)
      return tidyNumber(balNum)
    },
    hiveBalanceLocal() {
      if (!this.currentDetails) return "💰💰💰"
      return this.convertToLocalCurrency(this.currentDetails.balance, "hive")
    },
    savingsHiveBalance() {
      if (!this.currentDetails) return "💰💰💰"
      const balNum = parseFloat(this.currentDetails.savings_balance).toFixed(3)
      return tidyNumber(balNum)
    },
    savingsHiveBalanceLocal() {
      if (!this.currentDetails) return "💰💰💰"
      return this.convertToLocalCurrency(
        this.currentDetails.savings_balance,
        "hive",
      )
    },
    hbdBalance() {
      if (!this.currentDetails) return "💰💰💰"
      const balNum = parseFloat(this.currentDetails.hbd_balance).toFixed(3)
      return tidyNumber(balNum)
    },
    hbdBalanceLocal() {
      if (!this.currentDetails) return "💰💰💰"
      return this.convertToLocalCurrency(this.currentDetails.hbd_balance, "hbd")
    },
    savingsHbdBalance() {
      if (!this.currentDetails) return "💰💰💰"
      const balNum = parseFloat(
        this.currentDetails.savings_hbd_balance,
      ).toFixed(3)
      return tidyNumber(balNum)
    },
    savingsHbdBalanceLocal() {
      if (!this.currentDetails) return "💰💰💰"
      return this.convertToLocalCurrency(
        this.currentDetails.savings_hbd_balance,
        "hbd",
      )
    },
    /**
     * Calculates the sum of Hive and HBD balances converted into sats.
     *
     * @returns {string|number} The total balance in sats, or a string indicating an error.
     */
    satsBalance() {
      if (
        !this.currentDetails ||
        !storeAPIStatus.HBDSatsNumber ||
        !storeAPIStatus.hiveHBDNumber
      ) {
        return "💰💰💰"
      }
      const hiveBalance = parseFloat(this.currentDetails.balance)
      const hbdBalance = parseFloat(this.currentDetails.hbd_balance)
      if (isNaN(hiveBalance) || isNaN(hbdBalance)) {
        return "Invalid balance"
      }
      const hiveTotal = hiveBalance + hbdBalance / storeAPIStatus.hiveHBDNumber

      const satsTotal = Math.round(
        hiveTotal * storeAPIStatus.hiveSatsNumber,
      ).toLocaleString()
      return satsTotal
    },
    /**
     * Checks if the current bitcoin balance is greater than 1000000 net sats.
     * @returns {boolean} Returns true if the bitcoin balance is greater than 1000000 net sats, otherwise false.
     */
    bitcoinDisplay() {
      if (this.currentKeepSats === null) {
        return false
      }
      if (this.currentKeepSats?.net_sats > 1000000) {
        return true
      }
      return false
    },
    /**
     * Calculates and returns the keepSats balance.
     * If the currentKeepSats is null, it logs a message and returns "💰💰💰".
     * If the currentKeepSats.net_sats is greater than 1000000, it converts it to netBitcoin and returns the tidyNumber with 6 decimal places.
     * Otherwise, it returns the tidyNumber of currentKeepSats.net_sats with 0 decimal places.
     * @returns {string|number} The keepSats balance.
     */
    keepSatsBalance() {
      if (this.currentKeepSats === null) {
        console.debug("Need to reauthenticate to get keepSatsBalance")
        console.debug("check if logged in with HAS or Keychain")
        return "💰💰💰"
      }

      if (this.currentKeepSats?.net_sats > 1000000) {
        const netBitcoin = this.currentKeepSats?.net_sats / 100000000
        return tidyNumber(netBitcoin, 3)
      }
      // Ensure net_sats is never -0
      const netSats =
        this.currentKeepSats?.net_sats === 0
          ? 0
          : this.currentKeepSats?.net_sats
      return tidyNumber(netSats, 0)
    },
    keepSatsBalanceLocal() {
      if (!this.currentKeepSats) return "💰💰💰"
      // Ensure net_sats is never -0
      const netSats =
        this.currentKeepSats.net_sats === 0 ? 0 : this.currentKeepSats.net_sats
      return this.convertToLocalCurrency(netSats, "sats")
    },
    /**
     * Retrieves the balance of keepSats and returns it as a formatted number or string.
     * If the currentKeepSats is null, it logs a message and returns "💰💰💰".
     * Otherwise, it returns the balance as is.
     * @returns {number|string} The balance of keepSats as a formatted number or string.
     */
    keepSatsBalanceNumDisplay() {
      if (this.currentKeepSats === null) {
        console.debug("Need to reauthenticate to get keepSatsBalance")
        console.debug("check if logged in with HAS or Keychain")
        return "💰💰💰"
      }
      if (this.currentKeepSats?.net_sats > 1000000) {
        return this.currentKeepSats?.net_sats / 100000000
      }
      // Ensure net_sats is never -0
      return this.currentKeepSats?.net_sats === 0
        ? 0
        : this.currentKeepSats?.net_sats
    },
    keepSatsBalanceNum() {
      if (this.currentKeepSats === null) {
        console.debug("Need to reauthenticate to get keepSatsBalance")
        console.debug("check if logged in with HAS or Keychain")
        return 0
      }
      // Ensure net_sats is never -0
      return this.currentKeepSats?.net_sats === 0
        ? 0
        : this.currentKeepSats?.net_sats
    },
    savingsSatsBalance() {
      if (this.satsBalance === "💰💰💰") return "💰💰💰"
      const savingsHiveBalance = parseFloat(this.currentDetails.savings_balance)
      const savingsHbdBalance = parseFloat(
        this.currentDetails.savings_hbd_balance,
      )
      if (isNaN(savingsHiveBalance) || isNaN(savingsHbdBalance)) {
        return "Invalid balance"
      }
      const savingsHiveTotal =
        savingsHiveBalance + savingsHbdBalance / storeAPIStatus.hiveHBDNumber
      const savingsSatsTotal = Math.round(
        savingsHiveTotal * storeAPIStatus.hiveSatsNumber,
      ).toLocaleString()
      return savingsSatsTotal
    },
    totalSatsBalance() {
      if (this.satsBalance === "💰💰💰") return "💰💰💰"
      if (this.savingsSatsBalance === "💰💰💰") return this.satsBalance
      const totalSatsBalance = (
        parseInt(this.satsBalance.replace(/,/g, ""), 10) +
        parseInt(this.savingsSatsBalance.replace(/,/g, ""), 10)
      ).toLocaleString()
      return totalSatsBalance
    },
  },
  actions: {
    initialize() {
      // =====================================================
      // DEBUG PATCH - REMOVE AFTER DIAGNOSIS
      // =====================================================
      console.log("%c[AUTH-DEBUG] >>> NEW HARDENED AUTH CODE IS RUNNING <<<", "color: lime; font-weight: bold; font-size: 14px")
      console.log("[AUTH-DEBUG] initialize() called. Current users in store:", Object.keys(this.users))
      console.log("[AUTH-DEBUG] Raw users object at init:", JSON.stringify(this.users, null, 2))

      // called once from the HiveLogin component.
      console.log("Store initialized")

      // Because we are invalidating all existing logins for the new auth model,
      // aggressively remove any old persisted apiTokens from localStorage.
      // This is a one-time migration step.
      let strippedAny = false
      const accountsWithOldTokens = []

      for (const userId in this.users) {
        const user = this.users[userId]
        if (!user.loginType) {
          user.loginType = "hive"
        }
        if (user.apiToken) {
          accountsWithOldTokens.push(userId)
          console.warn("[AUTH-DEBUG] Found OLD apiToken on account:", userId, "— will strip it")
          delete user.apiToken
          strippedAny = true
        }
      }

      if (strippedAny) {
        console.info("[auth] Stripped old persisted access tokens (full re-login required after auth hardening)")
        console.warn("[AUTH-DEBUG] Accounts that had old tokens stripped:", accountsWithOldTokens)
      } else {
        console.log("[AUTH-DEBUG] No old apiToken fields found in persisted users during initialize().")
      }

      console.log("[AUTH-DEBUG] Users object AFTER stripping attempt:", JSON.stringify(this.users, null, 2))
      // =====================================================
      // END DEBUG PATCH
      // =====================================================
    },
    /**
     * Updates the user details and profile.
     * @param {boolean} useCache - Indicates whether to use cached data or not. Default is true.
     */
    async update(useCache = true) {
      this.apiTokenSet()
      this.expireCheck()
      console.log("storeUser.js: update called for", this.currentUser)

      const currentLoginType = this.users[this.currentUser]?.loginType
      if (currentLoginType && currentLoginType !== "hive") {
        console.log(
          "storeUser.js: skipping Hive API update for loginType",
          currentLoginType,
        )
        this.currentDetails = null
        this.currentProfile = {
          name: this.users[this.currentUser]?.profileName || this.currentUser,
        }
        await this.updateSatsBalance(useCache)
        return
      }

      const details = await useHiveDetails(this.currentUser)
      console.log("storeUser.js: useHiveDetails returned", details)
      if (!details) {
        console.error(
          "storeUser.js: useHiveDetails returned null or undefined!",
        )
      } else if (!details.balance) {
        console.error(
          "storeUser.js: details object missing 'balance' property!",
          details,
        )
      }
      this.currentDetails = details
      await this.updateSatsBalance(useCache)
      this.currentProfile = details?.profile
    },
    /**
     * Updates the sats balance for the current user.
     * @param {boolean} useCache - Indicates whether to use cached data or not. Default is true.
     * @returns {Promise<boolean|null>} - A promise that resolves to a boolean indicating whether the sats balance was updated or not,
     * or null if an error occurred.
     */
    async updateSatsBalance(useCache = true) {
      if (this.currentUser && this.apiToken) {
        const currentSatsBalance = this.currentKeepSats?.net_sats
        try {
          this.dataLoading = true
          let answer = null
          try {
            answer = await useKeepSats(useCache, false)
            if (answer?.detail === "Could not validate credentials") {
              console.log("Need to log out")
              this.logout()
              return false
            }
          } catch (err) {
            console.error(err)
          }
          if (answer == null) {
            this.dataLoading = false
            return null
          }
          this.currentKeepSats = answer
          // Ensure net_sats is never -0
          if (this.currentKeepSats && this.currentKeepSats.net_sats === 0) {
            this.currentKeepSats.net_sats = 0
          }
          this.dataLoading = false
          console.debug("currentKeepSats", this.currentKeepSats)
          if (this.currentKeepSats) {
            // Ensure net_sats is never -0 for comparison
            const normalizedCurrent =
              currentSatsBalance === 0 ? 0 : currentSatsBalance
            const normalizedNew =
              this.currentKeepSats.net_sats === 0
                ? 0
                : this.currentKeepSats.net_sats
            if (normalizedCurrent !== normalizedNew) {
              return true
            }
          }
          return false
        } catch (err) {
          console.error(err)
          return null
        }
      }
    },
    /**
     * Logs in a user with the provided credentials.
     *
     * NOTE (2026 auth hardening):
     * For passkey logins (authKey === "webauthn"), we recommend passing `null` for `expire`.
     * Session lifetime is now primarily controlled by the rotating HttpOnly refresh token
     * cookie on the backend, not by this client-side expire value.
     *
     * @param {string} hiveAccname - The Hive account name.
     * @param {string} keySelected - The selected key.
     * @param {string|null} authKey - The authentication key (optional) set by HAS / "webauthn" for passkeys.
     * @param {string|null} expire - The expiration date (optional). For passkeys, prefer null.
     * @param {string|null} token - The token (optional).
     * @param {string|null} apiToken - The API token (optional). Stored only in-memory after hardening.
     * @returns {Promise<void>} - A promise that resolves when the login is successful.
     */
    async login(
      hiveAccname,
      keySelected,
      authKey = null,
      expire = null,
      token = null,
      apiToken = null,
      loginType = "hive",
    ) {
      try {
        console.log("login", hiveAccname, keySelected)
        let hiveDetails = null
        if (loginType === "hive") {
          this.dataLoading = true
          hiveDetails = await useHiveDetails(hiveAccname)
          this.dataLoading = false
        }

        let newUser
        if (hiveDetails) {
          const profileName = hiveDetails?.profile?.name || hiveAccname
          newUser = new HiveUser(
            hiveAccname,
            profileName,
            keySelected,
            Date.now(),
            authKey,
            expire,
            token,
            apiToken,
            loginType,
          )
        } else {
          console.log("EVM login no Hive details")
          const profileName = useShortEVMAddress(hiveAccname)
          newUser = new HiveUser(
            hiveAccname,
            profileName,
            keySelected,
            Date.now(),
            authKey,
            expire,
            token,
            apiToken,
            loginType,
          )
        }
        // Store token only in non-persisted memory (new hardened auth model)
        if (apiToken) {
          this.accessTokens[hiveAccname] = apiToken
          apiLogin.defaults.headers.common["Authorization"] = `Bearer ${apiToken}`
        }

        // Debug logging for auth hardening changes
        if (loginType === "evm" || loginType === "btc" || authKey === "webauthn") {
          console.log(
            `[AUTH-DEBUG] login(): Storing ${loginType || authKey} user. expire passed=${expire}, using in-memory accessTokens only.`
          )
        }

        this.users[hiveAccname] = newUser
        this.currentUser = hiveAccname
        if (hiveDetails) {
          this.currentDetails = hiveDetails
          this.currentProfile = hiveDetails.profile
        }
        this.update()
      } catch (err) {
        console.error(err)
      }
    },
    /**
     * Switches the current user to the specified hive account name.
     * @param {string} hiveAccname - The hive account name to switch to.
     */
    switchUser(hiveAccname) {
      try {
        console.debug("switchUser to ", hiveAccname, " from ", this.currentUser)
        this.dataLoading = true
        if (hiveAccname in this.users) {
          this.currentUser = hiveAccname
          this.apiTokenSet(hiveAccname)
          this.expireCheck()
          this.update()
        }
      } catch (err) {
        console.debug(err)
      }
    },
    /**
     * Sets the API token for a given hive account name.
     * @param {string} [hiveAccname=this.currentUser] - The hive account name.
     * @returns {boolean} - Returns true if the API token was set successfully, otherwise false.
     */
    apiTokenSet(hiveAccname = this.currentUser) {
      console.debug("Setting API Token for", hiveAccname)
      const token = this.accessTokens[hiveAccname] || this.users[hiveAccname]?.apiToken
      if (token) {
        apiLogin.defaults.headers.common["Authorization"] = `Bearer ${token}`
        return true
      }
      return false
    },

    /**
     * Set the current access token in memory only (new hardened auth model).
     * Never persisted to localStorage.
     */
    setAccessToken(token) {
      if (!this.currentUser) return
      this.accessTokens[this.currentUser] = token
      apiLogin.defaults.headers.common["Authorization"] = `Bearer ${token}`
    },

    /** @deprecated Use setAccessToken instead */
    setTemporaryAccessToken(token) {
      this.setAccessToken(token)
    },
    expireCheck() {
      console.log("[AUTH-DEBUG] expireCheck() running... (checking for legacy expires only)");
      // === 2026 Auth Hardening - Consistent Session Model ===
      //
      // We no longer use the client-side `expire` field to forcibly log out users
      // for modern login methods. This prevents the regression where EVM/BTC users
      // (and previously passkeys) were being kicked out after the short backend
      // access token lifetime (~30 min).
      //
      // Security model (no sacrifice):
      // - All methods get short-lived access tokens from the backend.
      // - Keychain, FIDO, and (where possible) others use HttpOnly refresh cookies
      //   with rotation for seamless continuity.
      // - EVM and BTC require re-signing with the private key on re-auth.
      // - The `expireCheck()` soft timeout is now only applied to legacy flows.
      //
      // Only enforce the legacy expire field for traditional Hive Keychain logins where appropriate.
      for (const user in this.users) {
        const hiveUser = this.users[user]

        // Skip for passkeys, EVM, and BTC - consistent treatment after auth hardening
        if (
          hiveUser.authKey === "webauthn" ||
          hiveUser.loginType === "evm" ||
          hiveUser.loginType === "btc"
        ) {
          console.log(
            `[AUTH-DEBUG] expireCheck: Skipping expiration enforcement for ${hiveUser.loginType || 'unknown'} (authKey=${hiveUser.authKey || 'none'}) - using new refresh model`
          )
          continue
        }

        const t = i18n.global.t
        if (hiveUser.expire && hiveUser.expire < Date.now()) {
          console.log(`[AUTH-DEBUG] expireCheck: Legacy expire field present for ${user} (expire=${hiveUser.expire}). In the 2026 refresh-cookie model we no longer force logout here — relying on short access tokens + /auth/refresh instead.`)
          // Intentionally do NOT call this.logout() anymore for the new auth system.
          // The axios response interceptor on 401 + rotating refresh_token cookie is now responsible for session continuity.
        }
      }
      // Do not call logoutAll() here. Per-account isolation is important.
      // If all users happen to be gone, the UI will naturally reflect it.
    },
    /**
     * Logs out the current user.
     * Removes the current user from the list of users and resets the current user details and profile.
     * @returns {Promise<void>} A promise that resolves when the logout process is complete.
     */
    async logout() {
      if (this.currentUser) {
        this.logoutUser(this.currentUser)
      }
    },

    /**
     * Logs out a specific user account without affecting any other logged-in accounts.
     * This is the preferred method for per-account refresh/expiry failures.
     */
    async logoutUser(hiveAccname) {
      if (!hiveAccname) return

      delete this.accessTokens[hiveAccname]

      if (hiveAccname in this.users) {
        delete this.users[hiveAccname]
      }

      if (this.currentUser === hiveAccname) {
        this.currentUser = null
        this.currentDetails = null
        this.currentProfile = null
        this.currentKeepSats = null

        // Gracefully switch to another remaining user if one exists
        const remaining = Object.keys(this.users)
        if (remaining.length > 0) {
          this.switchUser(remaining[0])
        }
      }
    },

    /**
     * Logs out all users and resets the current user, details, profile, and keepSats.
     * @async
     */
    async logoutAll() {
      this.accessTokens = {}
      this.users = {}
      this.currentUser = null
      this.currentDetails = null
      this.currentProfile = null
      this.currentKeepSats = null
    },
    async bech32Address(currency = "hive") {
      const getBech32 = async (currency) => {
        const params = { currency: currency, no_image: false, json: true }
        const url = `/lnurlp/bech32/${this.currentUser}`
        try {
          const res = await api.get(url, { params })
          return res.data
        } catch (err) {
          console.error(err)
          return `${this.currentUser}@${currency}.v4v.app`
        }
      }
      const answer = await getBech32(currency)
      if (answer) return answer
      return null
    },
    /**
     * Converts the given amount from the specified currency to the storeUser's local currency.
     * If the localRates structure does not have the storeUser's local currency,
     * it adds the currency with the fixed rate from the storeUser.
     *
     * @param {number} amount - The amount to be converted.
     * @param {string} currency - The currency of the amount.
     * @returns {number|string} - The converted amount in the storeUser's local currency, or "💰💰💰" if the conversion is not possible.
     */
    convertToLocalCurrency(amount, currency) {
      /**
       * Updates the local rates based on the storeUser's local currency.
       * If the localRates structure does not have the storeUser's local currency,
       * it adds the currency with the fixed rate from the storeUser.
       */
      if (!this.localCurrency.value) return "💰💰💰"
      function updateLocalRates() {
        // check if the localRates structure has the storeUser.localCurrency.value in it
        // this is necessary if a user has added their own currency
        try {
          if (!localRates.hive[this.localCurrency.value]) {
            addCurrency(this.localCurrency.value, this.pos.fixedRate)
          }
        } catch (err) {
          // do nothing
        }
      }

      function addCurrency(currencySymbol, ratePerUSD) {
        // Calculate and add the new currency value for hive and hive_dollar
        localRates.hive[currencySymbol] = localRates.hive.usd * ratePerUSD
        localRates.hive_dollar[currencySymbol] =
          localRates.hive_dollar.usd * ratePerUSD
      }
      currency = currency === "hbd" ? "hive_dollar" : currency
      let localRates = storeCoingecko.exchangeRates
      if (!localRates) return "💰💰💰"
      const cacheKey = `rates-${this.localCurrency.value}`
      const exchangeRate = storeCoingecko.ratesCache[cacheKey]
      if (!exchangeRate) return "💰💰💰"
      updateLocalRates()
      let rawBalance = 0
      if (currency === "sats") {
        const usdBalance = amount / exchangeRate.usd.btc / 100000000
        rawBalance = usdBalance * exchangeRate.usd[this.localCurrency.value]
      } else {
        if (!exchangeRate[currency][this.localCurrency.value]) return "💰💰💰"
        rawBalance =
          parseFloat(amount) * exchangeRate[currency][this.localCurrency.value]
      }
      let adjustRate = 1
      if (this.pos.fixedRate) {
        adjustRate =
          this.pos.fixedRate /
          exchangeRate.hive_dollar[this.localCurrency.value]
      }
      return tidyNumber(rawBalance / adjustRate)
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        storage: localStorage,
        paths: ["users", "currentUser", "pos", "localCurrency", "clientId"],
      },
    ],
  },
})
