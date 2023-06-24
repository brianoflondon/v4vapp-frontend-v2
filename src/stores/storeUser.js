import { defineStore } from "pinia"
import { useHiveDetails } from "../use/useHive.js"
import { useStorage } from "@vueuse/core"
import { useStoreAPIStatus } from "./storeAPIStatus.js"
import { tidyNumber } from "src/use/useUtils.js"
import { formatTimeAgo } from "@vueuse/core"

const storeAPIStatus = useStoreAPIStatus()

export class HiveUser {
  constructor(hiveAccname, profileName, keySelected, timestamp = Date.now()) {
    this.hiveAccname = hiveAccname
    this.profileName = profileName
    this.keySelected = keySelected
    this.timestamp = timestamp
  }

  toJSON() {
    return {
      hiveAccname: this.hiveAccname,
      profileName: this.profileName,
      keySelected: this.keySelected,
      timestamp: this.timestamp,
    }
  }

  get loginAge() {
    return Date.now() - this.timestamp
  }

  get timeAgo() {
    const temp = formatTimeAgo(this.loginAge)
    console.log("timeAgo", temp)
    return temp
  }

  get allData() {
    return {
      hiveAccname: this.hiveAccname,
      profileName: this.profileName,
      keySelected: this.keySelected,
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
      if (!this.currentDetails) {
        return "💰💰💰"
      }
      const hiveBalance = parseFloat(this.currentDetails.balance)
      const hbdBalance = parseFloat(this.currentDetails.hbd_balance)
      if (isNaN(hiveBalance) || isNaN(hbdBalance)) {
        return "Invalid balance"
      }
      const hiveTotal = hiveBalance * storeAPIStatus.hiveHBDNumber
      const satsTotal = Math.round(
        hiveTotal * storeAPIStatus.HBDSatsNumber
      ).toLocaleString()

      return satsTotal
    },
  },

  actions: {
    update() {
      const onOpen = async () => {
        console.log("onOpen in useStoreUser")
        this.currentDetails = await useHiveDetails(this.currentUser)
        this.currentProfile = this.currentDetails?.profile
      }
      onOpen()
    },
    async login(hiveAccname, keySelected) {
      console.log("login", hiveAccname, keySelected)
      try {
        const hiveDetails = await useHiveDetails(hiveAccname)
        console.log("looking up hiveDetails ", hiveDetails)
        const profileName = hiveDetails?.profile?.name || hiveAccname
        console.log("profileName", profileName)
        if (hiveDetails) {
          const newUser = new HiveUser(hiveAccname, profileName, keySelected)
          this.users[hiveAccname] = newUser
          this.currentUser = hiveAccname
          this.currentDetails = hiveDetails
          this.currentProfile = hiveDetails.profile
          this.update()
        }
      } catch (err) {
        console.log(err)
      }
    },
    switchUser(hiveAccname) {
      try {
        console.log("switchUser to ", hiveAccname," from ", this.currentUser)
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
