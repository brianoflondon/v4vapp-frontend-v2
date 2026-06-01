import { serverHiveAccount, apiLogin } from "boot/axios"
import { useHiveAvatarURL } from "src/use/useHive.js"
import { Platform, Notify } from "quasar"
import { i18n } from "boot/i18n"
import { useStoreUser } from "src/stores/storeUser"
import { useGetChallenge, useValidateApi } from "src/use/useUtils"
import { authDebug, authError } from "src/utils/authDebug"

const storeUser = useStoreUser()

function getHiveKeychain() {
  if (typeof window === "undefined") return null
  return window.hive_keychain || null
}

function normalizeKeyType(keyType = "active") {
  const raw = String(keyType || "active").toLowerCase()
  if (raw === "posting") return "Posting"
  if (raw === "memo") return "Memo"
  return "Active"
}

function requestSignBuffer({ username, message, keyType }) {
  const hiveKeychain = getHiveKeychain()
  if (!hiveKeychain) {
    return Promise.resolve({
      success: false,
      message: "Hive Keychain not installed",
      data: { username, message },
    })
  }

  return new Promise((resolve) => {
    hiveKeychain.requestSignBuffer(
      username,
      message,
      normalizeKeyType(keyType),
      (response) => {
        resolve({
          ...response,
          data: {
            username,
            message,
            method: normalizeKeyType(keyType),
            title: "Login",
          },
          signature: response?.result,
          account: username,
        })
      },
    )
  })
}

function requestTransfer({ username, to, amount, memo, currency, enforce }) {
  const hiveKeychain = getHiveKeychain()
  if (!hiveKeychain) {
    return Promise.resolve({
      success: false,
      message: "Hive Keychain not installed",
      data: { username, to, amount, memo, enforce, currency },
    })
  }

  return new Promise((resolve) => {
    hiveKeychain.requestTransfer(
      username,
      to,
      amount,
      memo,
      currency,
      (response) => {
        resolve({
          ...response,
          data: { username, to, amount, memo, enforce, currency },
        })
      },
      enforce,
    )
  })
}

/*************************************************
 ****     Hive Keycahin Functions
 **************************************************/

export async function useIsHiveKeychainInstalled() {
  try {
    const isKeychainIn = !!getHiveKeychain()
    return isKeychainIn
  } catch (error) {
    authError({ error })
  }
  return false
}

export async function useHiveKeychainLogin({
  hiveAccname,
  message = null,
  keyType = "active",
}) {
  const isKeychainIn = await useIsHiveKeychainInstalled()
  if (!isKeychainIn || !hiveAccname) {
    return null
  }
  if (!message) {
    message = "Login to V4Vapp"
  }
  try {
    const loginResult = await requestSignBuffer({
      username: hiveAccname,
      message,
      keyType,
    })
    // this line is the result which should be used in the API text scripts
    // signed_message_example.json
    // authDebug("loginResult: ", loginResult)
    return loginResult
  } catch (error) {
    authError({ error })
    return error
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Performs the login flow using Hive Keychain.
 *
 * @param {Object} hiveAccObj - The Hive account object.
 * @param {Object} props - The props object.
 * @returns {void}
 */
export async function useKeychainLoginFlow(hiveAccObj, props) {
  // Fetch the avatar for the user
  const t = i18n.global.t
  let userToLogin = hiveAccObj.value
  // changes to hiveAccObj object DO flow back to the
  // reactive object in the component
  const avatarUrl = useHiveAvatarURL({ hiveAccname: hiveAccObj.value })
  // Check for Hive Keychain in the browser
  const isKeychainInstalled = await useIsHiveKeychainInstalled()
  let position = "left"
  if (Platform.is.mobile) {
    position = "top"
  }
  if (!isKeychainInstalled) {
    Notify.create({
      timeout: 2000,
      avatar: avatarUrl,
      color: "warning",
      message: t("keychain_not_installed"),
      position: position,
    })
    return
  }
  // Check for a valid Hive account in the input field
  if (!hiveAccObj) {
    Notify.create({
      timeout: 2000,
      avatar: avatarUrl,
      color: "info",
      message: t("enter_hive_account"),
      position: position,
    })
    return
  }
  // Fetch the challenge message from the server API
  try {
    const clientId = storeUser.clientId
    const challenge = await useGetChallenge(hiveAccObj.value, clientId)
    var note = Notify.create({
      group: false, // required to be updatable
      timeout: 0, // we want to be in control when it gets dismissed
      avatar: avatarUrl,
      message: `${t("login_in_progress")}: @${hiveAccObj.value}`,
      caption: `${t("sign_this")}: ${challenge.data.challenge}`,
      position: position,
      color: "info",
    })
    await delay(300)
    // This is the function from Hive Keychain SDK
    const signedMessage = await useHiveKeychainLogin({
      hiveAccname: userToLogin,
      message: challenge.data.challenge,
      keyType: props.keyType,
    })
    if (
      signedMessage.success &&
      signedMessage?.data?.message == challenge.data.challenge
    ) {
      // Validate the signed message with the API
      const validate = await useValidateApi(clientId, signedMessage)
      // convert validate.data.expire to a date
      // need to store this token in the storeUser store
      hiveAccObj["loggedIn"] = true
      hiveAccObj.caption = validate.data.access_token
      await storeUser.login(
        hiveAccObj.value,
        props.keyType,
        null,
        null,                    // Do not pass client-side expire in the new short-token + HttpOnly refresh cookie model
        null,
        validate.data.access_token,
        "hive",
      )
      authDebug("storeUser: ", storeUser.users)
      note({
        icon: "done", // we add an icon
        avatar: avatarUrl,
        html: true,
        spinner: false, // we reset the spinner setting so the icon can be displayed
        multiLine: true,
        message: `${t("login_success")}`,
        caption: `${signedMessage?.data?.message} <br> ${t("matches")} <br> ${
          challenge.data.challenge
        }`,
        color: "positive",
        timeout: 1500,
      })
    } else if (!signedMessage.success) {
      hiveAccObj["loggedIn"] = false
      note({
        icon: "cancel", // we add an icon
        spinner: false, // we reset the spinner setting so the icon can be displayed
        message: t("login_failed"),
        caption: `${signedMessage?.message}`,
        color: "negative",
        timeout: 1500,
      })
    }
  } catch (error) {
    // hiveAccObj["loggedIn"] = false
    authError("error: ", error)
    Notify.create({
      icon: "cancel", // we add an icon
      spinner: false, // we reset the spinner setting so the icon can be displayed
      message: `${error}`,
      color: "negative",
      timeout: 1500,
    })
  }
}

// -------- Hive Transfer --------

/**
 * Performs a transfer using the Hive Keychain SDK.
 * Always transfer to the serverHiveAccount
 *
 * @param {string} username - The username of the sender.
 * @param {number} amount - The amount to be transferred.
 * @param {string} currency - The currency of the transfer.
 * @param {string} memo - The memo associated with the transfer.
 * @returns {Promise<Object>} - A Promise that resolves to the transfer object.
 * @throws {Error} - If an error occurs during the transfer process.
 */
export async function useHiveKeychainTransfer(
  username,
  amount,
  currency,
  memo,
) {
  try {
    amount = parseFloat(amount).toFixed(3)
    const transfer = await requestTransfer({
      username,
      to: serverHiveAccount,
      amount,
      memo,
      enforce: false,
      currency,
    })
    return transfer
  } catch (error) {
    authError({ error })
    return error
  }
}

export async function useGetApiKeychainChallenge(hiveAccName, clientId) {
  const getChallenge = await apiLogin.get(`/auth/${hiveAccName}`, {
    params: {
      clientId: clientId,
      scope: "hive:active",
    },
  })
  return getChallenge
}
