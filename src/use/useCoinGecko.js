import { axios } from "boot/axios"
const coinGeckoApi = "https://api.coingecko.com/api/v3"

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