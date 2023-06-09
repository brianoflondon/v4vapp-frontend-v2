import { defineStore } from "pinia"
import { useHiveDetails } from "../use/useHive.js"
import { useStorage, formatTimeAgo } from "@vueuse/core"
import { useStoreAPIStatus } from "./storeAPIStatus.js"
import { tidyNumber } from "src/use/useUtils.js"

const storeAPIStatus = useStoreAPIStatus()

export class HiveUser {
  constructor(
    hiveAccname,
    profileName,
    keySelected,
    timestamp = null,
    authKey = null,
    expire = null,
    token = null
  ) {
    this.hiveAccname = hiveAccname
    this.profileName = profileName
    this.keySelected = keySelected
    this.authKey = authKey
    this.expire = expire
    this.token = token
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
    }
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
      authKey: this.authKey,
      expire: this.expire,
      token: this.token,
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
    users: useStorage("users", {}),
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
    user() {
      // Return the HiveUser object for the passed user hiveAccname
      if (!this.currentUser) return null
      return this.users[this.currentUser]
    },
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
          temp.token
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
    hbdBalance() {
      if (!this.currentDetails) return "💰💰💰"
      const balNum = parseFloat(this.currentDetails.hbd_balance).toFixed(3)
      return tidyNumber(balNum)
    },
    satsBalance() {
      // Return the sum of Hive and HBD in sats
      if (
        !this.currentDetails ||
        !storeAPIStatus.HBDSatsNumber ||
        !storeAPIStatus.hiveHBDNumber
      ) {
        return "💰💰💰"
      }
      const hiveBalance = parseFloat(this.currentDetails.balance)
      const hbdBalance = parseFloat(this.currentDetails.hbd_balance)
      // console.log("hiveBalance", hiveBalance, "hbdBalance", hbdBalance)
      if (isNaN(hiveBalance) || isNaN(hbdBalance)) {
        return "Invalid balance"
      }
      const hiveTotal = hiveBalance + hbdBalance / storeAPIStatus.hiveHBDNumber
      // console.log("hiveTotal", hiveTotal)
      // console.log("hbd in Hive", hbdBalance / storeAPIStatus.hiveHBDNumber)
      const satsTotal = Math.round(
        hiveTotal * storeAPIStatus.hiveSatsNumber
      ).toLocaleString()

      return satsTotal
    },
  },

  actions: {
    update() {
      const onOpen = async () => {
        if (this.currentUser === this.hiveDetails?.name) return
        this.currentDetails = await useHiveDetails(this.currentUser)
        this.currentProfile = this.currentDetails?.profile
      }
      onOpen()
    },
    async login(
      hiveAccname,
      keySelected,
      authKey = null,
      expire = null,
      token = null
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
            token
          )
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
    switchUser(hiveAccname) {
      try {
        console.log("switchUser to ", hiveAccname, " from ", this.currentUser)
        if (hiveAccname in this.users) {
          this.currentUser = hiveAccname
          // test if login is still valid
          this.update()
        }
      } catch (err) {
        console.log(err)
      }
    },
    async logout() {
      if (this.currentUser in this.users) {
        delete this.users[this.currentUser]
      }
      this.currentUser = null
      this.currentDetails = null
      this.currentProfile = null
    },
    async logoutAll() {
      this.users = {}
      this.currentUser = null
      this.currentDetails = null
      this.currentProfile = null
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        storage: localStorage,
        paths: ["users", "currentUser"],
      },
    ],
  },
})
