import { defineStore } from "pinia"
import { api } from "boot/axios"
import { tidyNumber } from "src/use/useUtils"
import { useDateFormat } from "@vueuse/core"

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
      if (
        !state.apiStatus?.config?.min_max?.min ||
        !state.apiStatus?.config?.min_max?.max
      ) {
        return null
      }
      const minSource = state.apiStatus.config.min_max.min
      const maxSource = state.apiStatus.config.min_max.max

      const readLimit = (source, key) => {
        if (!source) return null
        if (source[key] != null) return source[key]
        const lower = key.toLowerCase()
        if (source[lower] != null) return source[lower]
        const upper = key.toUpperCase()
        if (source[upper] != null) return source[upper]
        return null
      }

      const hiveMin = readLimit(minSource, "HIVE")
      const hiveMax = readLimit(maxSource, "HIVE")
      const hbdMin = readLimit(minSource, "HBD")
      const hbdMax = readLimit(maxSource, "HBD")
      const usdMin = readLimit(minSource, "USD")
      const usdMax = readLimit(maxSource, "USD")
      const satsMin = readLimit(minSource, "sats")
      const satsMax = readLimit(maxSource, "sats")

      if (
        hiveMin == null ||
        hiveMax == null ||
        hbdMin == null ||
        hbdMax == null ||
        satsMin == null ||
        satsMax == null
      ) {
        return null
      }

      const ans = {
        HIVE: {
          min: hiveMin,
          max: hiveMax,
        },
        HBD: {
          min: hbdMin,
          max: hbdMax,
        },
        USD: {
          min: usdMin,
          max: usdMax,
        },
        sats: {
          min: satsMin,
          max: satsMax,
        },
      }
      return ans
    },
    hiveMinMax() {
      return this.minMax?.HIVE || null
    },
    HBDMinMax() {
      return this.minMax?.HBD || null
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
          this.isKeychainIn =
            typeof window !== "undefined" && !!window.hive_keychain
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
