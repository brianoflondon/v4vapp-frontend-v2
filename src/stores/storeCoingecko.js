import { defineStore } from "pinia"
import { useStorage } from "@vueuse/core"
import { useAppDetails } from "src/use/useAppDetails.js"
const { appName, appVersion } = useAppDetails()

import axios from "axios"

const coinGeckoApi = "https://api.coingecko.com/api/v3"
const maxCacheAge = 10 * 60 * 1000 // 10 minutes in milliseconds

/**
 * Custom store for Coingecko data.
 * @typedef {Object} CoingeckoStore
 * @property {Object} state - The state of the Coingecko store.
 * @property {Object} state.exchangeRates - The exchange rates data.
 * @property {Object} state.currencyOptions - The currency options data.
 * @property {Object} state.ratesCache - The rates cache data.
 * @property {Object} state.lastFetched - The last fetched data.
 * @property {Object} state.lastFetchedHuman - The last fetched data in human-readable format.
 * @property {Object} actions - The actions of the Coingecko store.
 * @property {Function} actions.fetchCoingeckoRates - Fetches the Coingecko rates.
 * @property {Function} actions.getCoingeckoRate - Gets the Coingecko rate for a specific currency.
 * @property {Function} actions.cacheDataRates - Caches the data rates with the specified key.
 * @property {Function} actions.isCacheValidRates - Checks if the cache for the specified key is valid.
 * @property {Function} actions.buildCurrencyOptions - Builds the currency options based on the Coingecko rates.
 * @property {Function} actions.getExtraCurrencyOptions - Gets additional currency options.
 * @property {Function} actions.cacheData - Caches the exchange rates and currency options.
 * @property {Function} actions.isCacheValid - Checks if the cache for the specified key is valid.
 * @property {Object} persist - The persistence configuration for the Coingecko store.
 * @property {boolean} persist.enabled - Indicates if persistence is enabled.
 * @property {Array} persist.strategies - The persistence strategies.
 * @property {Object} persist.strategies.storage - The storage mechanism for persistence.
 * @property {Array} persist.strategies.paths - The paths to be persisted.
 */
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
      if (storedAppVersion !== appVersion.value) {
        console.log("coingecko appVersion changed")
        this.exchangeRates = {}
        this.currencyOptions = {}
        this.ratesCache = {}
        this.lastFetched = {}
        this.lastFetchedHuman = {}
        window.localStorage.setItem("appVersion", appVersion.value)
      }

      if (this.isCacheValid("exchangeRates")) {
        return [this.exchangeRates, this.currencyOptions]
      }

      try {
        const url = `${coinGeckoApi}/exchange_rates`
        console.debug("coingecko fetchCoingeckoRates url", url)
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


    /**
     * Fetches Coingecko rates for a given currency.
     * @param {string} currency - The currency for which rates are to be fetched.
     * @returns {Promise<Object>} - A promise that resolves to an object containing the Coingecko rates.
     * @throws {Error} - If there is an error fetching the rates.
     */
    async getCoingeckoRate(currency) {
      const cacheKey = `rates-${currency}`
      if (this.isCacheValidRates(cacheKey)) {
        console.debug("coingecko Using cached rates")
        return this.ratesCache[cacheKey]
      }

      try {
        console.debug("coingecko Fetching rates", currency)
        const url = `${coinGeckoApi}/simple/price`
        const params = {
          ids: "hive,hive_dollar,btc,usd",
          vs_currencies: `btc,usd,eur,${currency}`,
        }
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


    /**
     * Caches the data rates with the specified key.
     * @param {string} key - The key to cache the data rates.
     * @param {any} data - The data rates to be cached.
     */
    cacheDataRates(key, data) {
      this.ratesCache[key] = data
      this.lastFetched[key] = Date.now()
      this.lastFetchedHuman[key] = new Date().toLocaleString()
    },


    /**
     * Checks if the cache for rates is valid.
     * @param {string} key - The cache key.
     * @returns {boolean} - True if the cache is valid, false otherwise.
     */
    isCacheValidRates(key) {
      console.log("coingecko isCacheValidRates", key)
      return (
        this.ratesCache[key] && Date.now() - this.lastFetched[key] < maxCacheAge
      )
    },

    /**
     * Builds an array of currency options based on the provided coingecko rates.
     * Each currency option object contains a label, value, and unit.
     * @param {Object} coingeckoRates - The coingecko rates object.
     * @returns {Array} - An array of currency options.
     */
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

    /**
     * Retrieves the extra currency options.
     * @returns {Array} An array of objects representing the extra currency options.
     */
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
          "appVersion",
        ],
      },
    ],
  },
})
