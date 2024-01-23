import { defineStore } from "pinia"
import axios from "axios"

const coinGeckoApi = "https://api.coingecko.com/api/v3"
const maxCacheAge = 10 * 60 * 1000 // 10 minutes in milliseconds

export const useCoingeckoStore = defineStore("coingecko", {
  state: () => ({
    exchangeRates: null,
    currencyOptions: null,
    ratesCache: {}, // Initialize as an empty object
    lastFetched: {}, // Initialize as an empty object
  }),

  actions: {
    async fetchCoingeckoRates() {
      if (this.isCacheValid("exchangeRates")) {
        return [this.exchangeRates, this.currencyOptions]
      }

      try {
        const url = `${coinGeckoApi}/exchange_rates`
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
        const res = await axios.get(url, { params })
        if (res.status === 200) {
          res.data.hive_dollar = res.data.usd
          this.cacheDataRates(cacheKey, res.data)
          return res.data
        }
      } catch (err) {
        console.log("coingecko Error fetching rates")
        console.error(err)
        throw err
      }
    },

    cacheDataRates(key, data) {
      this.ratesCache[key] = data
      this.lastFetched[key] = Date.now()
    },

    isCacheValidRates(key) {
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
    },

    isCacheValid(key) {
      return this[key] && Date.now() - this.lastFetched[key] < maxCacheAge
    },
  },
})
