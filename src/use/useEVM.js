import { useStoreUser } from "src/stores/storeUser";
import { useGetChallenge, useValidateApi } from "src/use/useUtils";
import { authDebug, authError } from "src/utils/authDebug";
/**
 * Checks if the given address is a valid Ethereum address.
 *
 * @param {string} address - The address to be checked.
 * @returns {boolean} - True if the address is valid, false otherwise.
 */
export function useEVMAddressExists(address) {
  const testEVM = /^0x[a-fA-F0-9]{40}$/.test(address);
  if (testEVM) {
    return {
      exists: testEVM,
      valid: testEVM,
      error: "",
      hiveAccname: address,
    };
  } else {
    return {
      exists: testEVM,
      valid: testEVM,
      error: "Invalid Ethereum address",
      hiveAccname: address,
    };
  }
}

/**
 * Checks if the given address is a valid Ethereum Virtual Machine (EVM) address.
 *
 * @param {string} address - The address to be checked.
 * @returns {boolean} - Returns true if the address is a valid EVM address, otherwise returns false.
 */
export function useIsEVMAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Returns a shortened version of the Ethereum Virtual Machine (EVM) address.
 *
 * @param {string} address - The EVM address to be shortened.
 * @returns {string} - The shortened version of the EVM address.
 */
export function useShortEVMAddress(address) {
  if (!address) return "";
  if (address.length < 20) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Connects to the EVM.
 *
 * @returns {Promise<void>} A promise that resolves when the connection is established.
 */
export async function useEVMLoginFlow() {
  const storeUser = useStoreUser();

  if (typeof window.ethereum !== "undefined") {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      // request account Address
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts.length > 0) {
        const evmConnected = accounts[0];
        const evmAddressLabel = useShortEVMAddress(evmConnected);
        authDebug("Wallet connected", accounts);
        authDebug("evmConnected: ", evmConnected);
        const clientId = storeUser.clientId;
        const challenge = await useGetChallenge(evmConnected, clientId);
        authDebug("challenge: ", challenge);
        // now we have the challenge, we can sign it
        const signature = await signMessage(
          evmConnected,
          challenge.data.challenge,
        );
        authDebug("signature: ", signature);
        if (!signature) {
          authError("User Rejected Signature Request");
          return;
        }
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
        };
        authDebug("signatureData: ", signatureData);
        try {
          const validate = await useValidateApi(clientId, signatureData);
          authDebug("validate: ", validate);
          authDebug("logging in with EVM");
          authDebug("EVM login: Passing expire=null (consistent with passkeys). Short backend token + re-signing provides security.");

          await storeUser.login(
            evmConnected,
            "EVM",
            null,
            // 2026 auth hardening: pass null for expire (consistent with passkeys).
            // EVM sessions are not forced out by a client-side expire.
            // Security comes from short-lived backend access tokens (30 min default)
            // + requirement to re-sign with the wallet private key.
            // The axios interceptor will attempt silent refresh via cookie if available.
            null,
            null,
            validate.data.access_token,
            "evm",
          );

          authDebug("storeUser.currentUser: ", storeUser.currentUser);
        } catch (error) {
          authError("Error validating signature: ", error);
        }
      }
    } catch (error) {
      authError("User denied wallet connection", error);
    }
  } else {
    authDebug("No Ethereum wallet found");
  }
}

async function signMessage(address, message) {
  try {
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, address],
    });
    return signature;
  } catch (error) {
    authError("Error signing message:", error);
  }
}
