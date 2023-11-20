import { defineStore } from "pinia"
import axios from "axios"

const coinGeckoApi = "https://api.coingecko.com/api/v3"
const maxCacheAge = 600000 // 10 minutes in milliseconds

export const useCoingeckoStore = defineStore("coingecko", {
  state: () => ({
    exchangeRates: null,
    currencyOptions: null,
    ratesCache: {},
    lastFetched: null,
  }),

  actions: {
    async fetchCoingeckoRates() {
      // Check if cache is valid
      if (this.isCacheValid()) {
        return [this.exchangeRates, this.currencyOptions]
      }

      try {
        const url = `${coinGeckoApi}/exchange_rates`
        const res = await axios.get(url)

        if (res.status === 200) {
          const coingeckoRates = res.data.rates
          const currencyOptions = this.buildCurrencyOptions(coingeckoRates)

          // Cache the data in the store
          this.cacheData(coingeckoRates, currencyOptions)

          return [coingeckoRates, currencyOptions]
        }
      } catch (err) {
        if (this.exchangeRates && this.currencyOptions) {
          return [this.exchangeRates, this.currencyOptions]
        }
        console.error(err)
      }
    },

    async getCoingeckoRate(currency) {
      const cacheKey = `rates-${currency}`

      // Check if cache is valid
      if (this.isCacheValidRates(cacheKey)) {
        console.log(
          "coingecko cache is valid getCoingeckoRate: ",
          this.ratesCache[cacheKey]
        )
        return this.ratesCache[cacheKey]
      }

      try {
        const url = `${coinGeckoApi}/simple/price`
        const params = {
          ids: "hive,hive_dollar,btc",
          vs_currencies: `btc,usd,eur,${currency}`,
        }
        const res = await axios.get(url, { params: params })
        if (res.status === 200) {
          this.cacheDataRates(cacheKey, res.data)
          return res.data
        }
      } catch (err) {
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

      // Add extra currencies here if necessary
      currencyOptions.push(...this.getExtraCurrencyOptions())

      return currencyOptions
    },

    getExtraCurrencyOptions() {
      // Define extra currency options here
      return [
        // Example extra currencies
        { label: "Guatemalan Quetzal", value: "GTQ", unit: "gtq" },
        { label: "Cuban Peso", value: "CUP", unit: "cup" },
        { label: "Other", value: "OTH", unit: "$" },
      ]
    },

    cacheData(exchangeRates, currencyOptions) {
      this.exchangeRates = exchangeRates
      this.currencyOptions = currencyOptions
      this.lastFetched = Date.now()
    },

    isCacheValid() {
      // Check if data is available and not outdated
      const isValid =
        this.exchangeRates &&
        this.currencyOptions &&
        Date.now() - this.lastFetched < maxCacheAge
      console.log("checking coingecko cache isValid: ", isValid)
      return isValid
    },
  },
})
