// useV4vapp.js
//

import { Notify } from "quasar"
import { api, apiLogin } from "src/boot/axios"
import { useStoreUser } from "src/stores/storeUser"
import { checkCache, putInCache } from "src/use/useUtils"

/**
 * Checks if the API token is valid.
 * @returns {Promise<boolean>} A promise that resolves to true if the API token is valid, otherwise false.
 */
export async function useCheckApiTokenValid(username, apiToken) {
  // Check if the user has an API token
  if (!apiToken) return false
  apiLogin.defaults.headers.common["Authorization"] = `Bearer ${apiToken}`
  const resp = await apiLogin.get("/auth/check/")
  const respData = resp.data
  const now = new Date()
  const expiryDate = new Date(respData.expires)
  const diffInMilliseconds = expiryDate - now
  const diffInMinutes = Math.floor(diffInMilliseconds / 1000 / 60)
  if (resp.status === 200) return true
  return false
}

/**
 * Fetches the keepsats data from the server.
 *
 * @param {boolean} useCache - Flag indicating whether to use cache or not. Default is true.
 * @param {boolean} transactions - Flag indicating whether to include transactions or not. Default is true.
 * @returns {Promise} - A promise that resolves to the keepsats data.
 */
export async function useKeepSats(useCache = true, transactions = true) {
  // if (!apiToken) return null
  // apiLogin.defaults.headers.common["Authorization"] = `Bearer ${apiToken}`
  const expiryTimeInMinutes = 1
  try {
    const params = {
      useCache: useCache,
      transactions: transactions,
    }
    const resp = await apiLogin.get("/v1/v4vapp/keepsats", {
      params,
    })
    return resp.data
  } catch (error) {
    console.error("useKeepSats", error)
    Notify.create({
      message: "Need to re-authenticate",
      color: "negative",
      position: "bottom",
      timeout: 2000,
    })
    useStoreUser().logout()
    return null
  }
}

/**
 * Fetches the SATs history for a given username.
 * @param {string} username - The username for which to fetch the SATs history.
 * @param {number} [days=28] - The number of days to look back for SATs history. Default is 28 days.
 * @returns {Promise<Array>} - A promise that resolves to an array of SATs history transactions.
 */
export async function useFetchSatsHistory(username, days = 7 * 4) {
  // if (!apiToken) return null
  const expiryTimeInMinutes = 1
  const params = {
    // hours to look back
    age: days * 24,
    successOnly: true,
  }
  try {
    // check cache first
    const cacheKey = `satsHistory-${username}-${days}`
    let data = await checkCache(cacheKey)
    if (data) {
      return data
    }

    const response = await apiLogin.get("/v1/v4vapp/hivetosats", {
      params,
    })
    if (Array.isArray(response.data) && response.data.length > 0) {
      data = response.data[0].transactions
    }

    // Store the data and timestamp in the cache
    await putInCache(cacheKey, data, expiryTimeInMinutes)

    return data
  } catch (error) {
    console.error("fetchHistory error", error)
  }
}

/**
 * Transfers a specified amount of sats from the current user's account to another Hive account.
 *
 * @param {string} hiveTo - The Hive account name to transfer the sats to.
 * @param {number} amountSats - The amount of sats to transfer.
 * @param {string} memo - The memo to include with the transfer.
 * @returns {Promise<void>} - A promise that resolves when the transfer is successful, or rejects with an error.
 */
export async function useKeepSatsTransfer(hiveTo, amountSats, memo) {
  // convert amountsats to an int and check it is > 0
  if (isNaN(amountSats) || amountSats <= 0) {
    console.error("Invalid amountSats", amountSats)
    return
  }
  if (!hiveTo) {
    console.error("Invalid hiveTo", hiveTo)
    return
  }
  //check amountSats doesn't have a , or any other punctuation
  amountSats = parseInt(amountSats)

  const data = {
    hiveAccnameTo: hiveTo,
    sats: amountSats,
    memo: memo,
  }

  try {
    const response = await apiLogin.post("/v1/v4vapp/keepsats/transfer", data)
    if (response.status === 200) {
      console.log(response.data)
      return response.data
    }
  } catch (error) {
    console.error(error)
    return error
  }
}


/**
 * Fetches the cost of a new account from the API.
 * @returns {Promise<any>} A promise that resolves to the cost data.
 */
export async function useNewAccountCost() {
  try {
    const response = await api.get("/account/cost")
    return response.data
  } catch (error) {
    console.error(error)
    return null
  }
}