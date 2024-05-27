import { api, myNodePubKey } from "boot/axios"
import { store } from "quasar/wrappers"
import * as bolt11 from "src/assets/bolt11.min.js"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { useStoreUser } from "src/stores/storeUser"

const storeAPIStatus = useStoreAPIStatus()
const storeUser = useStoreUser()

export async function useGetLightingHiveInvoice(
  hiveAccname,
  amount,
  currency,
  memo,
  checkCode = "",
  expiry = 300,
  receiveCurrency = ""
) {
  try {
    if (expiry > 600) {
      expiry = 600
    }
    let message = memo
    if (checkCode) {
      message = memo ? memo + " " + checkCode : checkCode
    }

    currency = currency.toUpperCase()
    const callBackResult = await api.get("new_invoice_hive", {
      params: {
        hive_accname: hiveAccname,
        amount: amount,
        currency: currency,
        usd_hbd: false,
        app_name: "v4vapp-pos",
        expiry: expiry,
        message: message,
        receive_currency: receiveCurrency,
      },
    })
    return callBackResult.data
  } catch (error) {
    console.error(error)
    // Check if the error response exists and has a status property
    if (error.response && error.response.status) {
      // Handle 422 status code separately
      if (error.response.status === 422) {
        console.error("Status code 422: Unprocessable Entity")
        return { error: error.response.data.detail[0].msg }
        // Add your custom logic here
      }
    }
    return null
  }
}

export async function useCheckLightningInvoice(paymentHash) {
  try {
    const callBackResult = await api.get("check_invoice", {
      params: {
        payment_hash: paymentHash,
      },
    })
    return callBackResult.data
  } catch (error) {
    console.error(error)
    return null
  }
}

/**
 * Decodes a lightning invoice using local Bolt11 library and V4V.app API.
 *
 * @param {string} invoice - The lightning invoice to decode.
 * @returns {Promise<Object|null>} - The decoded invoice object, or null if decoding fails.
 */
export async function useDecodeLightningInvoice(invoice) {
  let decodedInvoice = null
  invoice = invoice.toLowerCase().trim()
  // if the invoice starts with lnbc the bolt11 library can decode it
  if (invoice.startsWith("lnbc")) {
    decodedInvoice = await bolt11Decode(invoice)
    console.log("decodedInvoice", decodedInvoice)
    if (decodedInvoice) {
      // Adds error messages to the decoded invoice if
      await validateInvoice(decodedInvoice)
      // add pubkeys to the decoded invoice
      decodedInvoice.v4vapp = {}
      decodedInvoice.v4vapp.pubKeys = extractPubKeys(decodedInvoice)
      decodedInvoice.v4vapp.type = "bolt11"
      decodedInvoice.v4vapp.timeNow = Date.now() / 1000
      return decodedInvoice
    }
  } else {
    // if the invoice looks like an email address
    if (invoice.includes("@") || invoice.startsWith("lnurl")) {
      // try to decode it as a lightning address
      decodedInvoice = await anythingDecode(invoice)
      if (decodedInvoice) {
        decodedInvoice.v4vapp = {}
        decodedInvoice.v4vapp.metadata = await decodeMetadata(decodedInvoice)
        decodedInvoice.v4vapp.amountToSend =
          decodedInvoice.v4vapp.metadata.minSats
        decodedInvoice.v4vapp.type = "lightningAddress"
        return decodedInvoice
      }
    }
  }
  return decodedInvoice
}

export function useGetTimeProgress(decodedInvoice) {
  // returns the progress of the invoice in seconds
  // if the invoice is expired returns -1
  if (!decodedInvoice) {
    return -1
  }
  const timeNow = Date.now() / 1000
  const timeLengthInvoice =
    decodedInvoice.timeExpireDate - decodedInvoice.timestamp
  const timeLeft = decodedInvoice.timeExpireDate - timeNow

  const timeFraction = timeLeft / timeLengthInvoice

  return [timeFraction, timeLeft]
}

function validateInvoice(decodedInvoice) {
  // Check value of invoice is within min and max
  // check that invoice is not expired
  decodedInvoice.errors = {}
  decodedInvoice.errors.text = []
  if (!decodedInvoice) {
    return null
  }
  decodedInvoice.payWithSatsOnly = false
  if (decodedInvoice.payeeNodeKey === myNodePubKey) {
    // if this is a self payment i.e. going to the v4v.app node
    // only pay it with KeepSats
    console.log("decodedInvoice.payeeNodeKey", decodedInvoice.payeeNodeKey)
    // decodedInvoice.payWithSatsOnly = true
  }
  const amount = Math.floor(decodedInvoice.millisatoshis / 1000)
  const minimumPayment =
    storeAPIStatus.apiStatus.config.minimum_invoice_payment_sats
  const maximumPayment =
    storeAPIStatus.apiStatus.config.maximum_invoice_payment_sats
  // need to add check to see if user has a sats balance
  if (amount < minimumPayment && storeUser.keepSatsBalanceNum < amount) {
    decodedInvoice.errors.too_low = true
    decodedInvoice.errors.text.push("invoice_too_low")
    return
  } else if (amount > maximumPayment && amount > storeUser.keepSatsBalanceNum) {
    decodedInvoice.errors.too_high = true
    decodedInvoice.errors.text.push("invoice_too_high")
    return
  } else if (amount < minimumPayment || amount > maximumPayment) {
    decodedInvoice.payWithSatsOnly = true
  }
  // Compare the current time with the expiration time
  if (Date.now() > decodedInvoice.timeExpireDate * 1000) {
    decodedInvoice.errors.expired = true
    decodedInvoice.errors.text.push("invoice_expired")
  }
  return
}

export function extractPubKeys(data) {
  // Extract pubkeys from a decoded lightning invoice
  const pubKeys = []

  // Add payeeNodeKey to the array
  if (data.payeeNodeKey) {
    pubKeys.push(data.payeeNodeKey)
  }

  // Loop through tags
  if (Array.isArray(data.tags)) {
    data.tags.forEach((tag) => {
      // Check if tag is routing_info
      if (tag.tagName === "routing_info" && Array.isArray(tag.data)) {
        // Loop through data in routing_info tag
        tag.data.forEach((route) => {
          // Add pubkey to the array
          if (route.pubkey) {
            pubKeys.push(route.pubkey)
          }
        })
      }
    })
  }

  return pubKeys
}

async function bolt11Decode(invoice) {
  // Decode invoice using local bolt11 library
  try {
    const decodedInvoice = await lightningPayReq.decode(invoice)
    return decodedInvoice
  } catch (error) {
    return null
  }
}

async function anythingDecode(invoice) {
  // Uses v4vapp api to decode lnurl and lightning addresses
  const data = {
    anything: invoice,
  }

  try {
    const response = await api.post("/lnurlp/proxy/", data, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
    })
    return response.data
  } catch (error) {
    console.error(error)
    return null
  }
}

function modifyComment(dInvoice) {
  if (dInvoice?.hiveHbd === "hbd") {
    if (dInvoice.v4vapp.comment === undefined) {
      dInvoice.v4vapp.comment = "#HBD"
    } else {
      dInvoice.v4vapp.comment += " #HBD"
    }
  }
}

// Using call by reference to modify the dInvoice object
export async function useCreateInvoice(dInvoice) {
  try {
    dInvoice.v4vapp.amountToSend = Math.round(dInvoice.v4vapp.amountToSend)
    modifyComment(dInvoice)
    const response = await callBackGenerateInvoice(
      dInvoice.callback,
      dInvoice.v4vapp.amountToSend,
      dInvoice.v4vapp?.comment
    )
    if (response === null) {
      console.error("response from Lightning Service Provider is null")
      return null
    }
    dInvoice.askDetails = false
    dInvoice.callback = response
    return response
  } catch (error) {
    console.error("error", error)
  }
}

export async function callBackGenerateInvoice(callbackURL, amount, comment) {
  // Take in a call back url and an amount and generate a Lightning Invoice
  // using the v4vapp api
  let baseURL = callbackURL
  let params = {
    amount: amount * 1000,
  }
  if (comment) {
    params.comment = comment
  }
  let url = new URL(baseURL)
  // Handle multiple search params in the callback url (co-pilot help)
  let searchParams = new URLSearchParams(url.search)
  Object.keys(params).forEach((key) => searchParams.append(key, params[key]))
  url.search = searchParams.toString()
  let combined = url.toString()

  const v4vappUrl = "/lnurlp/proxy/callback/"
  try {
    const callBackResult = await api.get(v4vappUrl, {
      params: { callbackUrl: combined },
    })
    return callBackResult.data
  } catch (error) {
    console.error(error)
    return null
  }
}

/**
 * Decode metadata from a decoded LNURL request.
 * If the requested min or max sats are outside the range
 * of this service, set them to service maximum/minimum.
 *
 * @param {Object} decodedInvoice - The decoded invoice object containing metadata.
 * @returns {Promise<Object>} - A promise that resolves to the decoded metadata object.
 */
async function decodeMetadata(decodedInvoice) {
  let result = await JSON.parse(decodedInvoice.metadata)
  let decoded = result.reduce((obj, item) => {
    obj[item[0]] = item[1]
    return obj
  }, {})
  result.imageKey = Object.keys(decoded).find((key) => key.includes("image/"))
  if (result.imageKey) {
    // decoded.image = decoded[result.imageKey]
    decoded.imgUrl = `data:${result.imageKey},${decoded[result.imageKey]}`
  } else {
    decoded.imgUrl = ""
  }
  decoded.requestString = decoded["text/long-desc"]
    ? decoded["text/long-desc"]
    : decoded["text/plain"]
  decoded.minSats = Math.floor(decodedInvoice.minSendable / 1000)
  decoded.maxSats = Math.floor(decodedInvoice.maxSendable / 1000)
  decoded.commentLength = decodedInvoice?.commentAllowed || 0

  const minimumPayment =
    storeAPIStatus.apiStatus.config.minimum_invoice_payment_sats
  const maximumPayment =
    storeAPIStatus.apiStatus.config.maximum_invoice_payment_sats

  if (decoded.minSats < minimumPayment) {
    decoded.minSats = minimumPayment
  }
  if (decoded.maxSats > maximumPayment) {
    decoded.maxSats = maximumPayment
  }

  return decoded
}
