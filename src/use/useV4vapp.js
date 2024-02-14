// useV4vapp.js
//

import { apiLogin } from "src/boot/axios"

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
  try {
    const resp = await apiLogin.get("/v1/v4vapp/keepsats")
    return resp.data
  } catch (error) {
    console.log("useKeepSats", error)
    return null
  }
}

export async function useFetchSatsHistory(username) {
  // if (!apiToken) return null
  console.log("fetchHistory", username)
  const params = {
    hiveAccname: username,
    age: 3000,
  }
  try {
    const rawData = await apiLogin.get("/v1/v4vapp/hivetosats/", {
      params,
    })
    let data = []
    if (Array.isArray(rawData.data) && rawData.data.length > 0) {
      console.log("First item in rawData.data", rawData.data[0])
      data = rawData.data[0].transactions
    }
    return data
  } catch (error) {
    console.error("fetchHistory error", error)
  }
}
