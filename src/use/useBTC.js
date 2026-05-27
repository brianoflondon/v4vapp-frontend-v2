import { AddressPurpose, MessageSigningProtocols, request } from "sats-connect"
import { Notify } from "quasar"
import { useStoreUser } from "src/stores/storeUser"
import { useGetChallenge, useValidateApi } from "src/use/useUtils"

/**
 * Checks if the given string is a likely valid BTC address format.
 * Supports common mainnet/testnet legacy and segwit address prefixes.
 *
 * @param {string} address
 * @returns {{ exists: boolean, valid: boolean, error: string, hiveAccname: string }}
 */
export function useBTCAddressExists(address) {
  const value = String(address || "").trim()
  const btcRegex =
    /^(bc1|tb1|bcrt1)[ac-hj-np-z02-9]{11,87}$|^[13mn2][a-km-zA-HJ-NP-Z1-9]{25,62}$/
  const valid = btcRegex.test(value)

  return {
    exists: valid,
    valid,
    error: valid ? "" : "Invalid Bitcoin address",
    hiveAccname: value,
  }
}

/**
 * Returns a shortened Bitcoin address label suitable for button text.
 *
 * @param {string} address
 * @returns {string}
 */
export function useShortBTCAddress(address) {
  if (!address) return ""
  if (address.length < 20) return address
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

/**
 * Uses Sats Connect to request BTC address access, sign backend challenge,
 * and authenticate against the existing validation endpoint.
 *
 * @returns {Promise<{ account: string, signature: string } | null>}
 */
export async function useBTCLoginFlow() {
  const storeUser = useStoreUser()

  try {
    Notify.create({
      timeout: 2000,
      color: "info",
      message: "Connecting BTC wallet...",
      position: "left",
    })

    const connectResponse = await request("wallet_connect", {
      addresses: [AddressPurpose.Payment],
      message: "Connect wallet for BTC login",
    })

    if (connectResponse.status === "error") {
      Notify.create({
        timeout: 2500,
        color: "warning",
        message: "BTC wallet connection was cancelled or failed",
        position: "left",
      })
      console.error("wallet_connect error", connectResponse.error)
      return null
    }

    const paymentAddress = connectResponse.result.addresses?.find(
      (address) => address.purpose === AddressPurpose.Payment,
    )?.address

    if (!paymentAddress) {
      Notify.create({
        timeout: 2500,
        color: "negative",
        message: "No BTC payment address returned by wallet",
        position: "left",
      })
      console.error("No BTC payment address returned by wallet_connect")
      return null
    }

    const clientId = storeUser.clientId
    const challenge = await useGetChallenge(paymentAddress, clientId)
    const challengeMessage = challenge?.data?.challenge

    if (!challengeMessage) {
      Notify.create({
        timeout: 2500,
        color: "negative",
        message: "BTC challenge request failed",
        position: "left",
      })
      console.error("Challenge was empty for BTC login")
      return null
    }

    Notify.create({
      timeout: 8000,
      color: "info",
      message: "Please sign this BTC challenge in your wallet",
      caption: challengeMessage,
      multiLine: true,
      position: "left",
    })

    const signResponse = await request("signMessage", {
      address: paymentAddress,
      message: challengeMessage,
      protocol: MessageSigningProtocols.ECDSA,
    })

    if (signResponse.status === "error") {
      Notify.create({
        timeout: 2500,
        color: "warning",
        message: "BTC signature request was cancelled or failed",
        position: "left",
      })
      console.error("signMessage error", signResponse.error)
      return null
    }

    const signature = signResponse.result?.signature

    if (!signature) {
      Notify.create({
        timeout: 2500,
        color: "negative",
        message: "BTC signature was empty",
        position: "left",
      })
      console.error("No signature returned by signMessage")
      return null
    }

    const signatureData = {
      success: true,
      result: signature,
      data: {
        username: paymentAddress,
        message: challengeMessage,
      },
      signature,
      account: paymentAddress,
    }

    const validate = await useValidateApi(clientId, signatureData)

    if (!validate?.data?.access_token) {
      Notify.create({
        timeout: 2500,
        color: "negative",
        message: "BTC login validation failed",
        position: "left",
      })
      console.error("BTC login validation failed", validate)
      return null
    }

    await storeUser.login(
      paymentAddress,
      "BTC",
      null,
      validate.data?.expire * 1000,
      null,
      validate.data.access_token,
      "btc",
    )

    Notify.create({
      timeout: 2000,
      color: "positive",
      message: "BTC login successful",
      position: "left",
    })

    return {
      account: paymentAddress,
      signature,
    }
  } catch (error) {
    Notify.create({
      timeout: 2500,
      color: "negative",
      message: "BTC login failed",
      position: "left",
    })
    console.error("BTC login flow failed", error)
    return null
  }
}
