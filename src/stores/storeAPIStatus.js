import { defineStore } from "pinia"
import { api } from "boot/axios"
import { tidyNumber } from "src/use/useUtils"
import { useDateFormat } from "@vueuse/core"
import { serverHiveAccount } from "boot/axios"
import { callRPC, config as hiveTxConfig } from "hive-tx"

const hiveNodes = [
  "https://api.hive.blog",
  "https://api.deathwing.me",
  "https://api.openhive.network",
  "https://rpc.mahdiyari.info",
  "https://techcoderx.com",
  "https://hiveapi.actifit.io",
  "https://api.c0ff33a.uk",
]
hiveTxConfig.nodes = hiveNodes

export const useStoreAPIStatus = defineStore("storeAPIStatus", {
  state: () => ({
    // count: 0, // for testing
    refreshIntervalMs: 10 * 60 * 1000,
    fetchTimestamp: null,
    apiStatus: null,
    apiError: null,
    gatewayFetchTimestamp: null,
    gatewayError: null,
    hiveConfig: null,
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
    gatewayClosedGetLnd: (state) => {
      if (!state.hiveConfig) return null
      return !!state.hiveConfig.closed_get_lnd
    },
    gatewayClosedGetHive: (state) => {
      if (!state.hiveConfig) return null
      return !!state.hiveConfig.closed_get_hive
    },
    isGatewayStatusKnown() {
      return (
        this.gatewayClosedGetLnd !== null && this.gatewayClosedGetHive !== null
      )
    },
    isGatewayFullyOpen() {
      return (
        this.gatewayClosedGetLnd === false &&
        this.gatewayClosedGetHive === false
      )
    },
    gatewayOverallStatus() {
      if (!this.isGatewayStatusKnown) return "unknown"
      return this.isGatewayFullyOpen ? "open" : "closed"
    },
    isGatewayAnyClosed() {
      return this.isGatewayStatusKnown
        ? this.gatewayClosedGetLnd || this.gatewayClosedGetHive
        : false
    },
    gatewayLndStatus() {
      if (this.gatewayClosedGetLnd === null) return "unknown"
      return this.gatewayClosedGetLnd ? "closed" : "open"
    },
    gatewayHiveStatus() {
      if (this.gatewayClosedGetHive === null) return "unknown"
      return this.gatewayClosedGetHive ? "closed" : "open"
    },
    isOverallHealthy() {
      return !this.apiError && !this.gatewayError && this.isGatewayFullyOpen
    },
    mergedStatusDisp() {
      return this.isOverallHealthy ? "🟢" : "🟥"
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
    async updateApiStatus() {
      console.log("Updating API status...")
      try {
        const res = await api.get("", {
          params: { get_crypto: true },
        })
        this.fetchTimestamp = Date.now()
        this.apiStatus = res.data
        this.apiError = null
        this.apiStatus.crypto = prettyPrices(this.apiStatus.crypto)
        console.log("API status updated:", this.apiStatus)
      } catch (err) {
        let age = (Date.now() - this.fetchTimestamp) / 1000
        if (age > 5 && this.apiStatus) {
          this.apiStatus = null
        }
        this.apiError = err
      }
      this.statusDisp = this.isOverallHealthy ? "🟢" : "🟥"
    },
    async updateGatewayStatus() {
      let gatewayStatusError = null
      try {
        const res = await callRPC("condenser_api.get_accounts", [
          [serverHiveAccount],
        ])
        if (!Array.isArray(res) || res.length === 0) {
          gatewayStatusError = new Error(
            "Gateway status RPC returned no account data",
          )
        } else {
          const details = res[0]
          if (!details?.posting_json_metadata) {
            gatewayStatusError = new Error("Gateway status metadata missing")
          } else {
            const metadata = JSON.parse(details.posting_json_metadata)
            const cfg = metadata?.v4vapp_hiveconfig
            if (!cfg) {
              gatewayStatusError = new Error("Gateway config missing")
            } else {
              console.debug("Raw posting_json_metadata:", metadata)
              console.debug("v4vapp_hiveconfig:", cfg)

              this.hiveConfig = cfg
              this.gatewayFetchTimestamp = Date.now()
            }
          }
        }
      } catch (err) {
        gatewayStatusError = err instanceof Error ? err : new Error(String(err))
      }
      this.gatewayError = gatewayStatusError
      this.statusDisp = this.isOverallHealthy ? "🟢" : "🟥"
    },
    async checkKeychain() {
      try {
        this.isKeychainIn =
          typeof window !== "undefined" && !!window.hive_keychain
      } catch (error) {
        console.error({ error })
      }
    },
    async update() {
      await Promise.allSettled([
        this.updateApiStatus(),
        this.updateGatewayStatus(),
        this.checkKeychain(),
      ])
      this.statusDisp = this.isOverallHealthy ? "🟢" : "🟥"
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
