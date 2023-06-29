import { defineStore } from "pinia"
import { useHiveDetails } from "../use/useHive.js"
import { useStorage } from "@vueuse/core"
import { useStoreAPIStatus } from "./storeAPIStatus.js"
import { tidyNumber } from "src/use/useUtils.js"
import { formatTimeAgo } from "@vueuse/core"

const storeAPIStatus = useStoreAPIStatus()

export class HiveUser {
  constructor(
    hiveAccname,
    profileName,
    keySelected,
    authKey = null,
    expire = null,
    timestamp = Date.now()
  ) {
    this.hiveAccname = hiveAccname
    this.profileName = profileName
    this.keySelected = keySelected
    this.authKey = authKey
    this.expire = expire
  }

  toJSON() {
    return {
      hiveAccname: this.hiveAccname,
      profileName: this.profileName,
      keySelected: this.keySelected,
      authKey: this.authKey,
      expire: this.expire,
      timestamp: this.timestamp,
    }
  }

  get loginAge() {
    return Date.now() - this.timestamp
  }

  get timeAgo() {
    const temp = formatTimeAgo(this.loginAge)
    return temp
  }

  get allData() {
    return {
      hiveAccname: this.hiveAccname,
      profileName: this.profileName,
      keySelected: this.keySelected,
      authKey: this.authKey,
      expire: this.expire,
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
    async login(hiveAccname, keySelected, authKey = null, expire = null) {
      try {
        const hiveDetails = await useHiveDetails(hiveAccname)
        const profileName = hiveDetails?.profile?.name || hiveAccname
        if (hiveDetails) {
          const newUser = new HiveUser(
            hiveAccname,
            profileName,
            keySelected,
            authKey,
            expire
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
        console.log("this.users", this.users)
        const nextUser = this.users[hiveAccname]
        console.log("nextUser", nextUser)
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
