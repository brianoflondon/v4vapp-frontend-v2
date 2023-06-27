import { api, myNodePubKey } from "boot/axios"
import * as bolt11 from "src/assets/bolt11.min.js"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"

const storeAPIStatus = useStoreAPIStatus()

export async function useDecodeLightningInvoice(invoice) {
  // Decode a lightning invoice first using local Bolt11 library
  // then using V4V.app API to decode lnurl and lightning addresses

  let decodedInvoice = null
  invoice = invoice.toLowerCase().trim()
  // if the invoice starts with lnbc the bolt11 library can decode it
  if (invoice.startsWith("lnbc")) {
    decodedInvoice = await bolt11Decode(invoice)
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

  if (decodedInvoice.payeeNodeKey === myNodePubKey) {
    // if we fail this test, no need to do any other tests
    decodedInvoice.errors.self_payment = true
    decodedInvoice.errors.text.push("self_payment")
    return
  }
  const amount = Math.floor(decodedInvoice.millisatoshis / 1000)
  const minimumPayment =
    storeAPIStatus.apiStatus.config.minimum_invoice_payment_sats
  const maximumPayment =
    storeAPIStatus.apiStatus.config.maximum_invoice_payment_sats
  if (amount < minimumPayment) {
    decodedInvoice.errors.too_low = true
    decodedInvoice.errors.text.push("invoice_too_low")
    return
  } else if (amount > maximumPayment) {
    decodedInvoice.errors.too_high = true
    decodedInvoice.errors.text.push("invoice_too_high")
    return
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
    console.log(response.data)
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
  url.search = new URLSearchParams(params).toString()
  let combined = url.toString()
  console.log(combined)

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
  console.log(result)
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

  console.log("useLightning decoded ", decoded)
  return decoded
}
