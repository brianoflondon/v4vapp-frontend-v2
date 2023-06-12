import { defineStore } from "pinia"
import { useHiveDetails } from "../use/useHive.js"
import { useStorage } from "@vueuse/core"

export class HiveUser {
  constructor(hiveAccname, hiveDetails, keySelected, timestamp) {
    this.hiveAccname = hiveAccname
    this.hiveDetails = hiveDetails
    this.keySelected = keySelected
    this.timestamp = timestamp || Date.now()
  }

  get profile() {
    return this.hiveDetails.profile
  }

  toJSON() {
    return {
      hiveAccname: this.hiveAccname,
      // hiveDetails: this.hiveDetails,
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
      keySelected: this.keySelected,
      timestamp: this.timestamp,
      loginAge: this.getLoginAge(),
    }
  }
}

export const useStoreUser = defineStore("useStoreUser", {
  state: () => ({
    currentUser: useStorage("currentUser", null),
    users: useStorage("users", {}),
  }),

  getters: {
    currentUserData() {
      return this.users[this.currentUser]
    },
  },

  actions: {
    async login(hiveAccname, keySelected) {
      console.log("login", hiveAccname, keySelected)
      try {
        const hiveDetails = await useHiveDetails(hiveAccname)
        console.log(hiveDetails)
        if (hiveDetails) {
          const newUser = new HiveUser(hiveAccname, hiveDetails, keySelected)
          console.log("profile", newUser.profile)
          console.log("toJSON", newUser.toJSON())
          this.users[hiveAccname] = newUser
          this.currentUser = hiveAccname
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
