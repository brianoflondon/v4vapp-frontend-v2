// useV4vapp.js
//

import { apiLogin } from "src/boot/axios"
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
export async function useKeepSats(useCache = true, transactions=true) {
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
    return null
  }
}

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
