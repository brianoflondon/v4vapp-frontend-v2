// usePasskeys.js
//
// This file is a utility for managing passkeys. It is used by the
// Login.vue component to manage the passkeys used in the login process.
//

import { apiLogin } from "boot/axios"
import { useStoreUser } from "src/stores/storeUser"
import * as webauthn from "@github/webauthn-json"

const storeUser = useStoreUser()

export async function useListCredentials() {
  if (!storeUser.currentUser) {
    return []
  }
  const listCredentials = await apiLogin.get(`/credentials/list/`, {})
  console.log("credentials", listCredentials.data)
  return listCredentials.data
}

export async function useNumCredentials(hiveAccname) {
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
    appId: "dev.v4v.app",
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
    return { success: false, message: "webauthn error" }
  }
}

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
    appId: "dev.v4v.app",
    deviceName: deviceName,
  }

  let getChallenge = null
  try {
    getChallenge = await apiLogin.post(`/register/begin/`, params, {
      params,
    })
    console.log("getChallenge.data", getChallenge.data)
  } catch (error) {
    console.error("getChallenge error fetching the challenge", error)
    return { success: false, message: "challenge error" }
  }
  // let options = webauthn.parseCreationOptionsFromJSON(getChallenge.data)
  // console.log("options", options)
  let response = null
  try {
    response = await webauthn.create(getChallenge.data)
  } catch (error) {
    console.error("webauthn.create error", error)
    return { success: false, message: error.message }
  }
  console.log("response", response)
  let sendChallengeBack = null
  // alert("ask for the device name", response)
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
  return { success: true, message: "device registered" }
}
