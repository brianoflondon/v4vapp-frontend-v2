// usePasskeys.js
//
// This file is a utility for managing passkeys. It is used by the
// Login.vue component to manage the passkeys used in the login process.
//

import { apiLogin } from "boot/axios"
import { useStoreUser } from "src/stores/storeUser"
import * as webauthn from "@github/webauthn-json"

const storeUser = useStoreUser()
const isDev = window.location.href.includes("dev.v4v.app")
let appId = "v4v.app"
if (isDev) {
  appId = "dev.v4v.app"
}

/**
 * Retrieves a list of credentials.
 * @returns {Promise<Array>} A promise that resolves to an array of credentials.
 */
export async function useListCredentials() {
  if (!storeUser.currentUser) {
    return []
  }
  const listCredentials = await apiLogin.get(`/credentials/list/`, {})
  console.log("credentials", listCredentials.data)
  return listCredentials.data
}

/**
 * Retrieves the number of credentials for a given hive account name.
 *
 * @param {string} hiveAccname - The hive account name.
 * @returns {Promise<number>} The number of credentials.
 */
export async function useNumCredentials(hiveAccname) {
  console.log("useNumCredentials - start", hiveAccname)
  if (!hiveAccname) {
    return 0
  }
  try {
    const numCredentials = await apiLogin.get(
      `/credentials/count/${hiveAccname}`,
      {}
    )
    console.log("numCredentials", numCredentials.data)
    return numCredentials.data.devices
  } catch (error) {
    console.log("useNumCredentials error", error)
    return 0
  }
}

export async function usePasskeyLogin(hiveAccName) {
  console.log("webauthnAuth - start")
  if (!hiveAccName) {
    console.error("No Hive Account Name provided")
    return { success: false, message: "no account" }
  }
  let params = {
    hive_accname: hiveAccName,
    clientId: storeUser.clientId,
    appId: appId,
  }
  let getChallenge = null
  try {
    getChallenge = await apiLogin.post(`/authenticate/begin/`, params, {
      params,
    })
    console.log("getChallenge.data", getChallenge.data)
  } catch (error) {
    if (error.response.status === 401) {
      console.log("No Credentials found for this account")
      return { success: false, message: "no credentials" }
    }
    console.error("getChallenge error", error)
    return { success: false, message: "challenge error" }
  }
  try {
    let response = await webauthn.get(getChallenge.data)
    console.log("response", response)
    let sendChallengeBack = await apiLogin.post(
      `/authenticate/complete/`,
      response,
      {
        params,
        headers: { "Content-Type": "application/json" },
      }
    )
    if (sendChallengeBack.data.access_token) {
      // give me a date 1 week in the future
      return { success: true, token: sendChallengeBack.data.access_token }
      let expireDate = new Date()
    }
  } catch (error) {
    console.error("webauthn.get error", error)
    return { success: false, message: error.message }
  }
}

/**
 * Registers a device using a passkey.
 *
 * @param {string} hiveAccName - The Hive Account name.
 * @param {string} deviceName - The name of the device.
 * @returns {Promise<{ success: boolean, message: string }>} - A promise that resolves to an object with the success status and a message.
 */
export async function usePasskeyRegister(hiveAccName, deviceName) {
  console.log("usePasskeyRegister - start")
  // First get the challenge from the server
  // Then call webauthn.create with the challenge
  if (!deviceName || !hiveAccName) {
    return { success: false, message: "No device name or Hive Account" }
  }
  let params = {
    hive_accname: hiveAccName,
    clientId: storeUser.clientId,
    appId: appId,
    deviceName: deviceName,
  }

  let getChallenge = null
  try {
    getChallenge = await apiLogin.post(`/register/begin/`, params, {
      params,
    })
  } catch (error) {
    return { success: false, message: "challenge error" }
  }
  // let options = webauthn.parseCreationOptionsFromJSON(getChallenge.data)
  // console.log("options", options)
  let response = null
  try {
    response = await webauthn.create(getChallenge.data)
  } catch (error) {
    return { success: false, message: error.message }
  }
  let sendChallengeBack = null
  try {
    sendChallengeBack = await apiLogin.post(`/register/complete/`, response, {
      params,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("sendChallengeBack error", error)
    return { success: false, message: error.message }
  }
  console.log("sendChallengeBack.data", sendChallengeBack.data)
  return { success: true, message: "Device Registered" }
}

export async function usePasskeyDelete(credentialId) {
  console.log("usePasskeyDelete - start")
  if (!credentialId) {
    return { success: false, message: "Nothing to delete" }
  }
  let params = {
    credentialId: credentialId,
  }
  let response = null
  try {
    response = await apiLogin.delete(`/credentials/delete/`, {
      params: params,
    })
    console.log("response", response.data)
    return { success: true, message: "device deleted" }
  } catch (error) {
    console.error("usePasskeyDelete error", error)
    return { success: false, message: "delete error" }
  }
}
