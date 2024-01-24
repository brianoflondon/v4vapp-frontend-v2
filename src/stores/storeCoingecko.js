import { defineStore } from "pinia"
import { useStorage } from "@vueuse/core"
import { useAppDetails } from "src/use/useAppDetails.js"
const { appName, appVersion } = useAppDetails()

import axios from "axios"

const coinGeckoApi = "https://api.coingecko.com/api/v3"
const maxCacheAge = 10 * 60 * 1000 // 10 minutes in milliseconds

export const useCoingeckoStore = defineStore("coingecko", {
  state: () => ({
    exchangeRates: useStorage("exchangeRates", {}),
    currencyOptions: useStorage("currencyOptions", {}),
    ratesCache: useStorage("ratesCache", {}),
    lastFetched: useStorage("lastFetched", {}),
    lastFetchedHuman: useStorage("lastFetchedHuman", {}),
  }),

  actions: {
    async fetchCoingeckoRates() {
      const storedAppVersion = window.localStorage.getItem("appVersion")
      console.log("coingecko storedAppVersion", storedAppVersion)
      console.log("coingecko appVersion", appVersion.value)
      if (storedAppVersion !== appVersion.value) {
        console.log("coingecko appVersion changed")
        this.exchangeRates = {}
        this.currencyOptions = {}
        this.ratesCache = {}
        this.lastFetched = {}
        this.lastFetchedHuman = {}
        window.localStorage.setItem("appVersion", appVersion.value)
      }

      console.log("coingecko Fetching rates")
      console.log("coingecko cacheKey", "exchangeRates")
      if (this.isCacheValid("exchangeRates")) {
        console.log("coingecko Using cached rates")
        return [this.exchangeRates, this.currencyOptions]
      }

      try {
        const url = `${coinGeckoApi}/exchange_rates`
        console.log("coingecko fetchCoingeckoRates url", url)
        const res = await axios.get(url)

        if (res.status === 200) {
          const coingeckoRates = res.data.rates
          const currencyOptions = this.buildCurrencyOptions(coingeckoRates)

          this.cacheData("exchangeRates", coingeckoRates, currencyOptions)
          return [coingeckoRates, currencyOptions]
        }
      } catch (err) {
        console.error(err)
        if (this.exchangeRates && this.currencyOptions) {
          return [this.exchangeRates, this.currencyOptions]
        }
        if (this.ratesCache["exchangeRates"]) {
          return this.ratesCache[cacheKey]
        }
        throw err
      }
    },

    async getCoingeckoRate(currency) {
      const cacheKey = `rates-${currency}`
      console.log("coingecko cacheKey", cacheKey)
      if (this.isCacheValidRates(cacheKey)) {
        console.log("coingecko Using cached rates")
        return this.ratesCache[cacheKey]
      }

      try {
        console.log("coingecko Fetching rates", currency)
        const url = `${coinGeckoApi}/simple/price`
        const params = {
          ids: "hive,hive_dollar,btc,usd",
          vs_currencies: `btc,usd,eur,${currency}`,
        }
        console.log("coingecko getCoingeckoRate url", url, currency)
        const res = await axios.get(url, { params })
        if (res.status === 200) {
          res.data.hive_dollar = res.data.usd
          this.cacheDataRates(cacheKey, res.data)
          return res.data
        }
      } catch (err) {
        console.error("coingecko Error fetching rates")
        console.error(err)
        // return cached data if available
        if (this.ratesCache[cacheKey]) {
          return this.ratesCache[cacheKey]
        }
        throw err
      }
    },

    cacheDataRates(key, data) {
      console.log("coingecko cacheDataRates", key, data)
      this.ratesCache[key] = data
      this.lastFetched[key] = Date.now()
      this.lastFetchedHuman[key] = new Date().toLocaleString()
      console.log("coingecko cacheDataRates", this.ratesCache)
    },

    isCacheValidRates(key) {
      console.log("coingecko isCacheValidRates", key)
      return (
        this.ratesCache[key] && Date.now() - this.lastFetched[key] < maxCacheAge
      )
    },

    buildCurrencyOptions(coingeckoRates) {
      const currencyOptions = Object.entries(coingeckoRates).map(
        ([key, rate]) => ({
          label: rate.name,
          value: key,
          unit: rate.unit,
        })
      )

      currencyOptions.push(...this.getExtraCurrencyOptions())
      return currencyOptions
    },

    getExtraCurrencyOptions() {
      return [
        { label: "Guatemalan Quetzal", value: "GTQ", unit: "gtq" },
        { label: "Cuban Peso", value: "CUP", unit: "cup" },
        { label: "Other", value: "OTH", unit: "$" },
      ]
    },

    cacheData(key, exchangeRates, currencyOptions) {
      this[key] = exchangeRates
      this.currencyOptions = currencyOptions
      this.lastFetched[key] = Date.now()
      this.lastFetchedHuman[key] = new Date().toLocaleString()
    },

    isCacheValid(key) {
      return this[key] && Date.now() - this.lastFetched[key] < maxCacheAge
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        storage: localStorage,
        paths: [
          "exchangeRates",
          "currencyOptions",
          "ratesCache",
          "lastFetched",
          "lastFetchedHuman",
          "appVersion"
        ],
      },
    ],
  },
})
