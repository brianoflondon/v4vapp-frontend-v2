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

export async function useKeepSats(username, apiToken, hasApiToken) {
  if (!apiToken) return null
  apiLogin.defaults.headers.common["Authorization"] = `Bearer ${apiToken}`
  try {
    const resp = await apiLogin.get("/v1/v4vapp/keepsats")
    return resp.data
  } catch (error) {
    console.log("useKeepSats", error)
    return null
  }
}
