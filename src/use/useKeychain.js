import { KeychainSDK } from "keychain-sdk"
import { serverHiveAccount, apiLogin, api } from "boot/axios"

const keychain = new KeychainSDK(window)

/*************************************************
 ****     Hive Keycahin Functions
 **************************************************/

export async function useIsHiveKeychainInstalled() {
  try {
    const isKeychainIn = await keychain.isKeychainInstalled()
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
  console.log("useHiveKeychainLogin")
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

export async function useValidateApi(clientId, signedMessage) {
  try {
    const validate = await apiLogin.post(`/auth_validate/`, signedMessage, {
      params: {
        clientId: clientId,
      },
      headers: {
        "Content-Type": "application/json",
      },
    })
    return validate
  } catch (error) {
    console.error({ error })
    return error
  }
}
