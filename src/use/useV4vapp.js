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
  console.log("useCheckApiTokenValid", username, apiToken)
  if (!apiToken) return false
  apiLogin.defaults.headers.common["Authorization"] = `Bearer ${apiToken}`
  const resp = await apiLogin.get("/auth/check/")
  console.log("useCheckApiTokenValid", resp.status, resp.data)
  const respData = resp.data
  const now = new Date()
  const expiryDate = new Date(respData.expires)
  const diffInMilliseconds = expiryDate - now
  const diffInMinutes = Math.floor(diffInMilliseconds / 1000 / 60)
  console.log("Expires in ", diffInMinutes, " minutes")
  if (resp.status === 200) return true
  return false
}

export async function useKeepSats(username, apiToken) {
  // if (!apiToken) return null
  // apiLogin.defaults.headers.common["Authorization"] = `Bearer ${apiToken}`
  const expiryTimeInMinutes = 1
  try {
    const resp = await apiLogin.get("/v1/v4vapp/keepsats")
    return resp.data
  } catch (error) {
    console.log("useKeepSats", error)
    return null
  }
}

export async function useFetchSatsHistory(username, days = 7 * 4) {
  // if (!apiToken) return null
  console.log("fetchHistory username", username)
  console.log("fetchHistory days", days)
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
      console.log("useFetchSatsHistory: Cache hit", username, days)
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
