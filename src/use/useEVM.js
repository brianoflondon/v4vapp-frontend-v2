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

export function useIsEVMAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}


export function useShortEVMAddress(address) {
  if (!address) return ""
  if (address.length < 20) return address
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}
