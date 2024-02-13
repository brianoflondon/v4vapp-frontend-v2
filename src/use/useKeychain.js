import { KeychainSDK } from "keychain-sdk"
import { serverHiveAccount, apiLogin } from "boot/axios"
import { useHiveAvatarURL } from "src/use/useHive.js"
import { Platform, Notify } from "quasar"
import { i18n } from "boot/i18n"
import { useStoreUser } from "src/stores/storeUser"

const storeUser = useStoreUser()
const keychain = new KeychainSDK(window)

/*************************************************
 ****     Hive Keycahin Functions
 **************************************************/

export async function useIsHiveKeychainInstalled() {
  try {
    console.log("-------------> useIsHiveKeychainInstalled")
    const isKeychainIn = await keychain.isKeychainInstalled()
    console.log("isKeychainIn: ", isKeychainIn)
    return isKeychainIn
  } catch (error) {
    console.error({ error })
  }
  return false
}

export async function useHiveKeychainLogin({
  hiveAccname,
  message = null,
  keyType = "posting",
}) {
  console.log("useHiveKeychainLogin: ", hiveAccname, message, keyType)
  const isKeychainIn = keychain.isKeychainInstalled()
  if (!isKeychainIn || !hiveAccname) {
    return null
  }
  if (!message) {
    message = "Login to V4Vapp"
  }
  const keychainParams = {
    data: {
      username: hiveAccname,
      message: message,
      method: keyType,
      title: "Login",
    },
    options: {},
  }
  try {
    const loginResult = await keychain.login(
      keychainParams.data,
      keychainParams.options
    )
    return loginResult
  } catch (error) {
    console.error({ error })
    return error
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function useKeychainLoginFlow(hiveAccObj, props) {
  // Fetch the avatar for the user
  const t = i18n.global.t
  console.log("useKeychainLoginFlow: ", hiveAccObj)
  // changes to hiveAccObj object DO flow back to the
  // reactive object in the component
  const avatarUrl = useHiveAvatarURL({ hiveAccname: hiveAccObj.value })
  console.log("avatarUrl: ", avatarUrl)
  // Check for Hive Keychain in the browser
  const isKeychainInstalled = await useIsHiveKeychainInstalled()
  console.log("isKeychainInstalled: ", isKeychainInstalled)
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
  // Fetch the challenge message from the server
  try {
    const clientId = storeUser.clientId
    console.log("clientId: ", clientId)
    const challenge = await useGetApiKeychainChallenge(
      hiveAccObj.value,
      clientId
    )

    console.log("challenge: ", challenge)
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
    const signedMessage = await useHiveKeychainLogin({
      hiveAccname: hiveAccObj.value,
      message: challenge.data.challenge,
      keyType: props.keyType,
    })
    if (
      signedMessage.success &&
      signedMessage?.data?.message == challenge.data.challenge
    ) {
      console.log("now to validate")
      const validate = await useValidateApi(clientId, signedMessage)
      console.log("validate: ", validate)
      console.log("validate.data: ", validate.data)
      // convert validate.data.expire to a date
      const expireDate = new Date(validate.data.expire * 1000)
      console.log("validate token expires at ", expireDate)
      // need to store this token in the storeUser store
      hiveAccObj["loggedIn"] = true
      hiveAccObj.caption = validate.data.access_token
      await storeUser.login(
        hiveAccObj.value,
        props.keyType,
        null,
        validate.data?.expire * 1000,
        null,
        validate.data.access_token
      )
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
    console.error("error: ", error)
    note({
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
  memo
) {
  try {
    const keychain = new KeychainSDK(window)
    amount = parseFloat(amount).toFixed(3)
    const formParamsAsObject = {
      data: {
        username: username,
        to: serverHiveAccount,
        amount: amount,
        memo: memo,
        enforce: false,
        currency: currency,
      },
    }
    const transfer = await keychain.transfer(formParamsAsObject.data)
    console.log({ transfer })
    return transfer
  } catch (error) {
    console.error({ error })
    return error
  }
}

export async function useGetApiKeychainChallenge(hiveAccName, clientId) {
  const getChallenge = await apiLogin.get(`/auth/${hiveAccName}`, {
    params: {
      clientId: clientId,
    },
  })
  return getChallenge
}

/**
 * Validates the signed message with the API.
 *
 * @param {string} signedMessage - The signed message to be validated.
 * @param {string} clientId - The client ID.
 * @returns {Promise} - A promise that resolves with the validation result.
 */
export async function useValidateApi(clientId, signedMessage) {
  Notify.create({
    timeout: 2000,
    color: "warning",
    message: "Validating...",
    position: "left",
  })
  try {
    const validate = await apiLogin.post(`/auth/validate/`, signedMessage, {
      params: {
        clientId: clientId,
      },
      headers: {
        "Content-Type": "application/json",
      },
    })
    return validate
  } catch (error) {
    if (validate.status === 422) {
      Notify.create({
        message: "422 error from validate",
      })
    }
    console.error({ error })
    return error
  }
}
