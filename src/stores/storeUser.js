import { defineStore } from "pinia"
import { useHiveDetails } from "../use/useHive.js"
import { useStorage, formatTimeAgo } from "@vueuse/core"
import { useStoreAPIStatus } from "./storeAPIStatus.js"
import { tidyNumber, generateUUID } from "src/use/useUtils.js"
import { apiLogin, api } from "src/boot/axios"
import { useKeepSats } from "src/use/useV4vapp"

const storeAPIStatus = useStoreAPIStatus()

export class HiveUser {
  constructor(
    hiveAccname,
    profileName,
    keySelected,
    timestamp = null,
    authKey = null,
    expire = null,
    token = null,
    apiToken = null
  ) {
    this.hiveAccname = hiveAccname
    this.profileName = profileName
    this.keySelected = keySelected
    this.authKey = authKey
    this.expire = expire
    this.token = token
    this.apiToken = apiToken
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
    pos: useStorage("pos", {}),
    clientId: useStorage("clientId", generateUUID()),
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
    user() {
      // Return the HiveUser object for the passed user hiveAccname
      if (!this.currentUser) return null
      return this.users[this.currentUser]
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
          temp.apiToken
        )
        return hiveUser
      }
    },
    // Return true if the user is logged in via Hive Keychain
    // Returns false if the user is logged in via HAS
    // Returns null if the user is not logged in
    getKeychain: (state) => {
      return (hiveAccname) => {
        const temp = state.users[hiveAccname]
        if (!temp) return null
        if (temp.authKey) return false
        return true
      }
    },
    hiveBalance() {
      if (!this.currentDetails) return "💰💰💰"
      const balNum = parseFloat(this.currentDetails.balance).toFixed(3)
      return tidyNumber(balNum)
    },
    savingsHiveBalance() {
      if (!this.currentDetails) return "💰💰💰"
      const balNum = parseFloat(this.currentDetails.savings_balance).toFixed(3)
      return tidyNumber(balNum)
    },
    hbdBalance() {
      if (!this.currentDetails) return "💰💰💰"
      const balNum = parseFloat(this.currentDetails.hbd_balance).toFixed(3)
      return tidyNumber(balNum)
    },
    savingsHbdBalance() {
      if (!this.currentDetails) return "💰💰💰"
      const balNum = parseFloat(
        this.currentDetails.savings_hbd_balance
      ).toFixed(3)
      return tidyNumber(balNum)
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
    keepSatsBalance() {
      if (this.currentKeepSats === null) {
        console.log("Need to reauthenticate to get keepSatsBalance")
        console.log("check if logged in with HAS or Keychain")
        return "💰💰💰"
      }
      return tidyNumber(this.currentKeepSats?.net_sats, 0)
      // return this.currentKeepSats
    },
    keepSatsBalanceNum() {
      if (this.currentKeepSats === null) {
        console.log("Need to reauthenticate to get keepSatsBalance")
        console.log("check if logged in with HAS or Keychain")
        return "💰💰💰"
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
    update() {
      const onOpen = async () => {
        if (this.currentUser === this.hiveDetails?.name) return
        this.currentDetails = await useHiveDetails(this.currentUser)
        this.currentProfile = this.currentDetails?.profile
        console.log("this.currentUser", this.currentUser)
        if (this.currentUser && this.apiToken) {
          this.currentKeepSats = await useKeepSats(
            this.currentUser,
            this.apiToken,
            this.token
          )
        }
      }
      this.apiTokenSet()
      this.expireCheck()
      onOpen()
    },
    /**
     * Logs in a user with the provided credentials.
     * @param {string} hiveAccname - The Hive account name.
     * @param {string} keySelected - The selected key.
     * @param {string|null} authKey - The authentication key (optional).
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
      apiToken = null
    ) {
      try {
        const hiveDetails = await useHiveDetails(hiveAccname)
        const profileName = hiveDetails?.profile?.name || hiveAccname
        if (hiveDetails) {
          const newUser = new HiveUser(
            hiveAccname,
            profileName,
            keySelected,
            Date.now(),
            authKey,
            expire,
            token,
            apiToken
          )
          if (apiToken) {
            apiLogin.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${apiToken}`
          }
          this.users[hiveAccname] = newUser
          this.currentUser = hiveAccname
          this.currentDetails = hiveDetails
          this.currentProfile = hiveDetails.profile
          this.update()
        }
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
        console.log("switchUser to ", hiveAccname, " from ", this.currentUser)
        if (hiveAccname in this.users) {
          this.currentUser = hiveAccname
          this.apiTokenSet(hiveAccname)
          this.expireCheck()
          this.update()
        }
      } catch (err) {
        console.log(err)
      }
    },
    /**
     * Sets the API token for a given hive account name.
     * @param {string} [hiveAccname=this.currentUser] - The hive account name.
     * @returns {boolean} - Returns true if the API token was set successfully, otherwise false.
     */
    apiTokenSet(hiveAccname = this.currentUser) {
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
        if (this.users[user].expire < Date.now()) {
          console.log("User expired", user)
          delete this.users[user]
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
        //http://localhost:1818/v1/lnurlp/bech32/v4vapp.dev?no_image=false&json=true&currency=sats
        const url = `/lnurlp/bech32/${this.currentUser}`
        try {
          const res = await api.get(url, { params })
          console.log(res.data)
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
