import { api } from "boot/axios"
import { Quasar } from "quasar"
import * as bolt11 from "src/assets/bolt11.min.js"

export async function useDecodeLightningInvoice(invoice) {
  // Decode a lightning invoice first using local Bolt11 library
  // then using V4V.app API to decode lnurl and lightning addresses

  let decodedInvoice = null
  invoice = invoice.toLowerCase().trim()
  // if the invoice starts with lnbc the bolt11 library can decode it
  if (invoice.startsWith("lnbc")) {
    decodedInvoice = bolt11Decode(invoice)
    if (decodedInvoice) {
      return decodedInvoice
    }
  } else {
    // if the invoice looks like an email address
    if (invoice.includes("@") || invoice.startsWith("lnurl")) {
      // try to decode it as a lightning address
      decodedInvoice = await anythingDecode(invoice)
      if (decodedInvoice) {
        return decodedInvoice
      }
    }
  }

  return decodedInvoice
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
