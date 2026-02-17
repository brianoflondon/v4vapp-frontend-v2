import { defineStore } from "pinia"
import { api } from "boot/axios"
import { KeychainSDK } from "keychain-sdk"
import { tidyNumber } from "src/use/useUtils"
import { useDateFormat } from "@vueuse/core"

const keychain = new KeychainSDK(window)

export const useStoreAPIStatus = defineStore("storeAPIStatus", {
  state: () => ({
    // count: 0, // for testing
    fetchTimestamp: null,
    apiStatus: null,
    apiError: null,
    statusDisp: "⚡️",
    isKeychainIn: false,
  }),

  getters: {
    bitcoin: (state) => {
      return state.apiStatus ? state.apiStatus.crypto.fmt.bitcoin : "💰💰💰"
    },
    hive: (state) => {
      return state.apiStatus ? state.apiStatus.crypto.fmt.hive : "💰💰"
    },
    hbd: (state) => {
      return state.apiStatus ? state.apiStatus.crypto.fmt.hbd : "💰💰"
    },
    hiveSats: (state) => {
      if (!state.apiStatus) return "💰💰💰"
      return tidyNumber(
        (state.apiStatus.crypto.hive.btc * 100000000).toFixed(0),
        0,
      )
    },
    hiveHBDNumber: (state) => {
      return state.apiStatus
        ? state.apiStatus.crypto.v4vapp.Hive_HBD.toFixed(5)
        : null
    },
    hiveSatsNumber: (state) => {
      return state.apiStatus
        ? state.apiStatus.crypto.hive.btc * 100000000
        : null
    },
    HBDSatsNumber: (state) => {
      return state.apiStatus
        ? state.apiStatus.crypto.hive_dollar.btc * 100000000
        : null
    },
    hiveFeeNumber: (state) => {
      return state.apiStatus ? state.hiveSatsNumber * state.conv_fee_sats : null
    },
    HBDFeeNumber: (state) => {
      return state.apiStatus ? state.HBDSatsNumber * state.conv_fee_sats : null
    },
    hiveBTCNumber: (state) => {
      return state.apiStatus ? state.apiStatus.crypto.hive.btc : null
    },
    prices: (state) => {
      return state.apiStatus ? state.apiStatus.crypto : "fetching prices"
    },
    minMax(state) {
      if (!state.apiStatus) return null
      const ans = {
        HIVE: {
          min: state.apiStatus.config.min_max.min.HIVE,
          max: state.apiStatus.config.min_max.max.HIVE,
        },
        HBD: {
          min: state.apiStatus.config.min_max.min.HBD,
          max: state.apiStatus.config.min_max.max.HBD,
        },
        USD: {
          min: state.apiStatus.config.min_max.min.USD,
          max: state.apiStatus.config.min_max.max.USD,
        },
        sats: {
          min: state.apiStatus.config.min_max.min.sats,
          max: state.apiStatus.config.min_max.max.sats,
        },
      }
      return ans
    },
    hiveMinMax: (state) => {
      return state.apiStatus
        ? {
            min: state.apiStatus.config.min_max.min.HIVE,
            max: state.apiStatus.config.min_max.max.HIVE,
          }
        : null
    },
    HBDMinMax: (state) => {
      return state.apiStatus
        ? {
            min: state.apiStatus.config.min_max.min.HBD,
            max: state.apiStatus.config.min_max.max.HBD,
          }
        : null
    },
    textBar() {
      // autocompletion ✨
      return `Bitcoin <strong>${this.bitcoin}<strong> ▪️ Hive <strong>${this.hive}<strong> ▪️ HBD<strong>${this.hbd}<strong> ▪️ ${this.statusDisp}`
    },
    lastFetch: (state) => {
      if (!state.fetchTimestamp) return null
      return state.fetchTimestamp
    },
    lastFetchTime: (state) => {
      if (!state.fetchTimestamp) return null
      return useDateFormat(state.lastFetch, "HH:mm:ss")
    },
  },

  actions: {
    update() {
      console.log("Updating API status...")
      const onDownload = async () => {
        try {
          const res = await api.get("", {
            params: { get_crypto: true },
          })
          this.fetchTimestamp = Date.now()
          this.apiStatus = res.data
          this.apiError = null
          this.apiStatus.crypto = prettyPrices(this.apiStatus.crypto)
          this.statusDisp = "🟢"
          console.log("API status updated:", this.apiStatus)
        } catch (err) {
          let age = (Date.now() - this.fetchTimestamp) / 1000
          if (age > 5 && this.apiStatus) {
            this.apiStatus = null
          }
          this.apiError = err
          this.statusDisp = "🟥"
        }
      }
      const checkKeychain = async () => {
        try {
          this.isKeychainIn = await keychain.isKeychainInstalled()
        } catch (error) {
          console.error({ error })
        }
      }
      onDownload()
      checkKeychain()
    },
  },
  persist: {
    enabled: true,
  },
})

function prettyPrices(prices) {
  //
  const bitcoin = tidyNumber(prices.bitcoin.usd.toFixed(0), 0)
  const hive = tidyNumber(prices.hive.usd.toFixed(2))
  const hbd = tidyNumber(prices.hive_dollar.usd.toFixed(2))
  prices.fmt = {
    bitcoin: bitcoin,
    hive: hive,
    hbd: hbd,
  }
  return prices
}
