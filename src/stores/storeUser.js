import { defineStore } from "pinia"
import { useHiveDetails } from "../use/useHive.js"
import { useStorage } from "@vueuse/core"
import { useStoreAPIStatus } from "./storeAPIStatus.js"
import { ref } from "vue"
import { tidyNumber } from "src/use/useUtils.js"
import { store } from "quasar/wrappers"

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

  get allData() {
    return {
      hiveAccname: this.hiveAccname,
      profileName: this.profileName,
      keySelected: this.keySelected,
      timestamp: this.timestamp,
      loginAge: this.getLoginAge(),
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
      // return a sumation of Hive and HBD in sats
      if (!this.currentDetails) return '💰💰💰'
      let hiveTotal = parseFloat(this.currentDetails.balance)
      console.log("hive", hiveTotal)
      hiveTotal *= storeAPIStatus.hiveHBDNumber
      hiveTotal += parseFloat(this.currentDetails.hbd_balance)
      console.log("HBD", hiveTotal)
      let satsTotal = hiveTotal * storeAPIStatus.HBDSatsNumber
      satsTotal = tidyNumber(satsTotal.toFixed(0))
      return satsTotal
    },
  },

  actions: {
    update() {
      const onOpen = async () => {
        console.log("onOpen in useStoreUser")
        this.currentDetails = await useHiveDetails(this.currentUser)
        this.currentProfile = this.currentDetails.profile
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
        }
      } catch (err) {
        console.log(err)
      }
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
