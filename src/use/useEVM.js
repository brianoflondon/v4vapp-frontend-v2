import { useStoreUser } from "src/stores/storeUser"
import { useGetChallenge, useValidateApi } from "src/use/useUtils"
/**
 * Checks if the given address is a valid Ethereum address.
 *
 * @param {string} address - The address to be checked.
 * @returns {boolean} - True if the address is valid, false otherwise.
 */
export function useEVMAddressExists(address) {
  const testEVM = /^0x[a-fA-F0-9]{40}$/.test(address)
  if (testEVM) {
    return {
      exists: testEVM,
      valid: testEVM,
      error: "",
      hiveAccname: address,
    }
  } else {
    return {
      exists: testEVM,
      valid: testEVM,
      error: "Invalid Ethereum address",
      hiveAccname: address,
    }
  }
}

/**
 * Checks if the given address is a valid Ethereum Virtual Machine (EVM) address.
 *
 * @param {string} address - The address to be checked.
 * @returns {boolean} - Returns true if the address is a valid EVM address, otherwise returns false.
 */
export function useIsEVMAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Returns a shortened version of the Ethereum Virtual Machine (EVM) address.
 *
 * @param {string} address - The EVM address to be shortened.
 * @returns {string} - The shortened version of the EVM address.
 */
export function useShortEVMAddress(address) {
  if (!address) return ""
  if (address.length < 20) return address
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

/**
 * Connects to the EVM.
 *
 * @returns {Promise<void>} A promise that resolves when the connection is established.
 */
export async function useEVMLoginFlow() {
  const storeUser = useStoreUser()

  if (typeof window.ethereum !== "undefined") {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" })
      // request account Address
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })
      if (accounts.length > 0) {
        const evmConnected = accounts[0]
        const evmAddressLabel = useShortEVMAddress(evmConnected)
        console.log("Wallet connected", accounts)
        console.log("evmConnected: ", evmConnected)
        const clientId = storeUser.clientId
        const challenge = await useGetChallenge(evmConnected, clientId)
        console.log("challenge: ", challenge)
        // now we have the challenge, we can sign it
        const signature = await signMessage(
          evmConnected,
          challenge.data.challenge
        )
        console.log("signature: ", signature)
        // now we can send the signature back to the server
        const signatureData = {
          success: true,
          result: signature,
          data: {
            username: evmConnected,
            message: challenge.data.challenge,
          },
          signature: signature,
          account: evmConnected,
        }
        console.log("signatureData: ", signatureData)
        try {
          const validate = await useValidateApi(clientId, signatureData)
          console.log("validate: ", validate)
          console.log("logging in with EVM")
          await storeUser.login(
            evmConnected,
            "EVM",
            null,
            validate.data?.expire * 1000,
            null,
            validate.data.access_token,
            "evm"
          )
          console.log("storeUser.currentUser: ", storeUser.currentUser)
        } catch (error) {
          console.error("Error validating signature: ", error)
        }
      }
    } catch (error) {
      console.error("User denied wallet connection", error)
    }
  } else {
    console.log("No Ethereum wallet found")
  }
}


async function signMessage(address, message) {
  try {
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, address],
    })
    return signature
  } catch (error) {
    console.error("Error signing message:", error)
  }
}