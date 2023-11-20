import { axios } from "boot/axios"
import { useStoreUser } from "src/stores/storeUser"

const storeUser = useStoreUser()
const coinGeckoApi = "https://api.coingecko.com/api/v3"

// use axios to fetch extraCurrencyOptions from github link

let extraCurrencyOptions = [
  {
    label: "Guatemalan Quetzal",
    value: "GTQ",
    unit: "gtq",
  },
  {
    label: "Cuban Peso",
    value: "CUP",
    unit: "cup",
  },
  {
    label: "Other",
    value: "OTH",
    unit: "$",
  },
]

export async function getCoingeckoRates() {
  try {
    const url = `${coinGeckoApi}/exchange_rates`
    const res = await axios.get(url)
    if (res.status == 200) {
      const coingeckoRates = res.data.rates
      const currencyOptions = []

      // Iterating through the data to create the desired list
      for (const rateKey in coingeckoRates) {
        if (coingeckoRates.hasOwnProperty(rateKey)) {
          currencyOptions.push({
            label: coingeckoRates[rateKey].name,
            value: rateKey,
            unit: coingeckoRates[rateKey].unit,
          })
        }
      }
      // add extra currencies to currencyOptions
      currencyOptions.push(...extraCurrencyOptions)
      return [coingeckoRates, currencyOptions]
    }
  } catch (err) {
    console.log(err)
  }
}

export async function getCoingeckoRate(currency) {
  try {
    const url = `${coinGeckoApi}/simple/price`
    const params = {
      ids: "hive,hive_dollar,btc",
      vs_currencies: `btc,usd,eur,${currency}`,
    }
    const res = await axios.get(url, { params: params })
    if (res.status == 200) {
      const coingeckoRates = res.data
      return coingeckoRates
    }
  } catch (err) {
    console.log(err)
  }
}
