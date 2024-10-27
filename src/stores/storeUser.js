import { defineStore } from "pinia"
import { useHiveDetails } from "../use/useHive.js"
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
    loginType = "hive"
  ) {
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

  setApiToken() {
    // Set the token for the user
    if (!this.apiToken) return false
    apiLogin.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${this.apiToken}`
    // need to test if the API token is working
    return true
  }

  clearApiToken() {
    // Clear the token for the user
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
  }),

  getters: {
    hiveAccname() {
      if (!this.currentUser) return null
      return this.users[this.currentUser].hiveAccname
    },
    profileName() {
      if (!this.currentUser) return null
      return this.users[this.currentUser].profileName
    },
    loginAge() {
      if (!this.currentUser) return null
      const hiveUser = this.users[this.currentUser]
      return (Date.now() - hiveUser.timestamp) / 1000
    },
    loginHASExpire() {
      if (!this.currentUser) return null
      const hiveUser = this.users[this.currentUser]
      if (!hiveUser.expire) return null
      return (hiveUser.expire - Date.now()) / 1000
    },
    authKey() {
      if (!this.currentUser) return null
      const hiveUser = this.users[this.currentUser]
      if (!hiveUser.authKey) return null
      return hiveUser.authKey
    },
    token() {
      if (!this.currentUser) return null
      const hiveUser = this.users[this.currentUser]
      if (!hiveUser.token) return null
      return hiveUser.token
    },
    apiToken() {
      if (!this.currentUser) return null
      const hiveUser = this.users[this.currentUser]
      if (!hiveUser.apiToken) return null
      return hiveUser.apiToken
    },
    loginType() {
      if (!this.currentUser) return null
      const hiveUser = this.users[this.currentUser]
      return hiveUser.loginType
    },
    user() {
      // Return the HiveUser object for the passed user hiveAccname
      if (!this.currentUser) return null
      return this.users[this.currentUser]
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
      if (!this.currentUser) return "HiveKeychainQR"
      const hiveUser = this.users[this.currentUser]
      if (hiveUser.authKey) return "HAS"
      return "HiveKeychain"
    },
    isHAS() {
      if (!this.currentUser) return false
      const hiveUser = this.users[this.currentUser]
      console.debug(hiveUser)
      if (hiveUser.authKey) return true
      return false
    },
    isKeychain() {
      if (!this.currentUser) return false
      const hiveUser = this.users[this.currentUser]
      if (hiveUser.authKey) return false
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
          temp.loginType
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
        keepSats: this.currentKeepSats?.net_sats,
        sats: this.currentKeepSats?.net_sats,
      }
    },
    balancesDisplay() {
      if (!this.currentDetails) return null
      return {
        hive: tidyNumber(parseFloat(this.currentDetails.balance), 3),
        hbd: tidyNumber(parseFloat(this.currentDetails.hbd_balance), 3),
        keepSats: tidyNumber(this.currentKeepSats?.net_sats, 0),
        sats: tidyNumber(this.currentKeepSats?.net_sats, 0),
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
        "hive"
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
        this.currentDetails.savings_hbd_balance
      ).toFixed(3)
      return tidyNumber(balNum)
    },
    savingsHbdBalanceLocal() {
      if (!this.currentDetails) return "💰💰💰"
      return this.convertToLocalCurrency(
        this.currentDetails.savings_hbd_balance,
        "hbd"
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
        hiveTotal * storeAPIStatus.hiveSatsNumber
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
      return tidyNumber(this.currentKeepSats?.net_sats, 0)
    },
    keepSatsBalanceLocal() {
      if (!this.currentKeepSats) return "💰💰💰"
      return this.convertToLocalCurrency(this.currentKeepSats.net_sats, "sats")
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
      return this.currentKeepSats?.net_sats
    },
    keepSatsBalanceNum() {
      if (this.currentKeepSats === null) {
        console.debug("Need to reauthenticate to get keepSatsBalance")
        console.debug("check if logged in with HAS or Keychain")
        return 0
      }
      return this.currentKeepSats?.net_sats
    },
    savingsSatsBalance() {
      if (this.satsBalance === "💰💰💰") return "💰💰💰"
      const savingsHiveBalance = parseFloat(this.currentDetails.savings_balance)
      const savingsHbdBalance = parseFloat(
        this.currentDetails.savings_hbd_balance
      )
      if (isNaN(savingsHiveBalance) || isNaN(savingsHbdBalance)) {
        return "Invalid balance"
      }
      const savingsHiveTotal =
        savingsHiveBalance + savingsHbdBalance / storeAPIStatus.hiveHBDNumber
      const savingsSatsTotal = Math.round(
        savingsHiveTotal * storeAPIStatus.hiveSatsNumber
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
      // called once from the HiveLogin component. If we change any settings in the store,
      // we can update them here.
      console.log("Store initialized")
      // Iterate over users and set loginType to "hive" if not set change in v 1.19.0 and later
      for (const userId in this.users) {
        const user = this.users[userId]
        if (!user.loginType) {
          user.loginType = "hive"
        }
      }
    },
    /**
     * Updates the user details and profile.
     * @param {boolean} useCache - Indicates whether to use cached data or not. Default is true.
     */
    update(useCache = true) {
      const onOpen = async () => {
        if (this.currentUser === this.hiveDetails?.name) return
        this.currentDetails = await useHiveDetails(this.currentUser)
        await this.updateSatsBalance(useCache)
        this.currentProfile = this.currentDetails?.profile
      }
      this.apiTokenSet()
      this.expireCheck()
      onOpen()
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
          this.currentKeepSats = answer
          this.dataLoading = false
          console.debug("currentKeepSats", this.currentKeepSats)
          if (this.currentKeepSats) {
            if (currentSatsBalance !== this.currentKeepSats.net_sats) {
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
     * @param {string} hiveAccname - The Hive account name.
     * @param {string} keySelected - The selected key.
     * @param {string|null} authKey - The authentication key (optional) set by HAS.
     * @param {string|null} expire - The expiration date (optional).
     * @param {string|null} token - The token (optional).
     * @param {string|null} apiToken - The API token (optional).
     * @returns {Promise<void>} - A promise that resolves when the login is successful.
     */
    async login(
      hiveAccname,
      keySelected,
      authKey = null,
      expire = null,
      token = null,
      apiToken = null,
      loginType = "hive"
    ) {
      try {
        console.log("login", hiveAccname, keySelected)
        this.dataLoading = true
        const hiveDetails = await useHiveDetails(hiveAccname)
        this.dataLoading = false
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
            loginType
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
            loginType
          )
        }
        if (apiToken) {
          apiLogin.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${apiToken}`
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
      if (hiveAccname in this.users && this.users[hiveAccname].apiToken) {
        apiLogin.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${this.users[hiveAccname].apiToken}`
        // need to test if the API token is working
        return true
      }
      return false
    },
    expireCheck() {
      // loop through users and check the expire time and if they
      // have expired, log them out.
      for (const user in this.users) {
        const t = i18n.global.t
        if (this.users[user].expire < Date.now()) {
          Notify.create({
            message: t("expired_login") + " - " + t("need_to_logout_login"),
            color: "negative",
            position: "center",
            timeout: 0,
            actions: [
              {
                label: t("ok"),
                color: "white",
                handler: () => {},
              },
            ],
          })
          console.debug("User expired", user)
          delete this.logout()
        }
      }
      if (this.users.length === 0 || Object.keys(this.users).length === 0) {
        this.logoutAll()
      }
    },
    /**
     * Logs out the current user.
     * Removes the current user from the list of users and resets the current user details and profile.
     * @returns {Promise<void>} A promise that resolves when the logout process is complete.
     */
    async logout() {
      if (this.currentUser in this.users) {
        delete this.users[this.currentUser]
      }
      this.currentUser = null
      this.currentDetails = null
      this.currentProfile = null
      this.currentKeepSats = null
    },
    /**
     * Logs out all users and resets the current user, details, profile, and keepSats.
     * @async
     */
    async logoutAll() {
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
