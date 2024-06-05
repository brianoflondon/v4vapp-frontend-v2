// useV4vapp.js
//

import { Notify, Dialog, QSpinnerGears } from "quasar"
import { api, apiLogin } from "src/boot/axios"
import { checkCache, putInCache } from "src/use/useUtils"
import { i18n } from "boot/i18n"

let paymentInProgressDialog = null

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
 * @param {boolean} adminOverride - Flag indicating whether to override the admin check or not. Default is false.
 * @returns {Promise} - A promise that resolves to the keepsats data.
 */
export async function useKeepSats(
  useCache = true,
  transactions = true,
  adminOverride = false
) {
  // if (!apiToken) return null
  // apiLogin.defaults.headers.common["Authorization"] = `Bearer ${apiToken}`
  try {
    const params = {
      useCache: useCache,
      transactions: transactions,
      admin: adminOverride,
    }
    const resp = await apiLogin.get("/v1/v4vapp/keepsats", {
      params,
    })
    return resp.data
  } catch (error) {
    console.error("useKeepSats", error)
    Notify.create({
      message: "Communication issues, try again soon",
      color: "negative",
      position: "bottom",
      timeout: 2000,
    })
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
  // convert amount sats to an int and check it is > 0
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
      return response.data
    }
  } catch (error) {
    console.error(error)
    return error
  }
}

function showPaying() {
  const t = i18n.global.t

  paymentInProgressDialog = Dialog.create({
    title: t("processing"),

    progress: {
      spinner: QSpinnerGears,
      color: "amber",
    },
    persistent: true, // we want the user to not be able to close it
    ok: false, // we want the user to not be able to close it
  })
}

export function useConfirmPayWithApi(message, apiPayData) {
  const t = i18n.global.t

  if (!message) {
    message = t("confirm")
  }
  Dialog.create({
    title: t("confirm"),
    message: message,
    cancel: true,
    persistent: true,
  })
    .onOk(() => {
      console.log("OK")
      showPaying()
      return payWithApi(apiPayData)
    })
    .onCancel(() => {
      console.log("Cancel")
      Notify.create({
        color: "negative",
        timeout: 3000,
        message: t("payment_cancelled"),
        position: "top",
        dismissable: true,
      })
      return false
    })
    .onDismiss(() => {
      return false
    })
}

async function payWithApi(apiPayData) {
  const t = i18n.global.t
  console.log("apiPayData", apiPayData)
  try {
    let response
    if (apiPayData.type === "hiveAccname") {
      response = await useKeepSatsTransfer(
        apiPayData.sendTo,
        apiPayData.sats,
        apiPayData.comment
      )
    } else {
      response = await useKeepSatsInvoice(apiPayData.paymentRequest)
    }
    // extract the message from this response
    paymentInProgressDialog.hide()
    if (response.success) {
      Notify.create({
        color: "positive",
        timeout: 5000,
        message: response.message,
        position: "top",
      })
      return response
    } else {
      const message = `${t("payment_failed")} - ${response?.message}`
      Notify.create({
        color: "negative",
        timeout: 5000,
        message: message,
        position: "top",
        actions: [
          {
            label: "OK",
            color: "white",
            handler: () => {
              return
            },
          },
        ],
      })
    }
    // // wait 2 seconds then clear the form
    // storeUser.updateSatsBalance(false)
    // await new Promise((resolve) => setTimeout(resolve, 4000))
    // clearReset()
  } catch (e) {
    console.error("Error in payWithApi", e)
    Notify.create({
      color: "negative",
      timeout: 5000,
      message: t("payment_failed"),
      position: "top",
    })
  }
}

/**
 * Sends a payment request to the server and returns the response data.
 *
 * @param {string} paymentRequest - The payment request to be sent.
 * @returns {Promise<any>} - The response data from the server.
 */
export async function useKeepSatsInvoice(paymentRequest) {
  try {
    const data = {
      memo: paymentRequest,
    }
    const response = await apiLogin.post("/v1/v4vapp/keepsats/invoice", data)
    if (response.status === 200) {
      return response.data
    }
  } catch (error) {
    console.error(error)
    return error
  }
}

/**
 * Converts the specified amount of sats to the given currency using the V4vapp API.
 * @param {number} satsToConvert - The amount of sats to convert.
 * @param {string} currency - The currency to convert to.
 * @param {string} [memo=""] - Optional memo for the conversion.
 * @returns {Promise<any>} - A promise that resolves to the converted amount or rejects with an error.
 */
export async function useKeepSatsConvert(satsToConvert, currency, memo = "") {
  try {
    const data = {
      sats: satsToConvert,
      currency: currency,
      memo: memo,
    }
    const response = await apiLogin.post("/v1/v4vapp/keepsats/convert", data)
    if (response.status === 200) {
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
