// useUtils.js
// ----------------------------------------------------------------------------
// General utility functions
//
// ----------------------------------------------------------------------------

import { useQuasar } from "quasar"
import { useI18n } from "vue-i18n"
import { apiLogin } from "boot/axios"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { useStoreUser } from "src/stores/storeUser"
import { productName, version } from "../../package.json"

/**
 * Formats a number by inserting commas as thousands separators in its integer part,
 * while preserving any decimal part.
 *
 * @param {number} x - The number to be formatted.
 * @param {number} decimals - The number of decimals to be displayed. Defaults to 2.
 * @returns {string|null} - The formatted number as a string, or null if the input is falsy.
 */
export function tidyNumber(x, decimals = 2) {
  if (x !== null && x !== undefined && !isNaN(x)) {
    const parts = x.toString().split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")

    // Drop decimals if x > 10,000
    if (x >= 10000) {
      return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }

    // Handle the decimal part based on the decimals value
    if (decimals > 0) {
      if (parts[1]) {
        while (parts[1].length < decimals) {
          parts[1] += "0" // Add zeros until reaching the desired number of decimals
        }
        if (parts[1].length > decimals) {
          parts[1] = parts[1].substring(0, decimals) // Truncate if there are more than the desired decimals
        }
      } else {
        parts[1] = "0".repeat(decimals) // If there's no decimal part, add the desired number of zeros
      }
    } else if (decimals === 0) {
      return parts[0] // Return only the integer part if decimals is 0
    }

    return parts.join(".")
  } else {
    return null
  }
}

/**
 * Formats a time duration in seconds into a human-readable string.
 *
 * @param {number} timeInSeconds - The time duration in seconds to format.
 * @returns {string} The formatted time string in the format "Xh Ym Zs" or "Ym Zs" or "Zs".
 */
export function formatTime(timeInSeconds) {
  const hours = Math.floor(timeInSeconds / 3600)
  const minutes = Math.floor((timeInSeconds % 3600) / 60)
  const seconds = Math.floor(timeInSeconds % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * Formats a UTC ISO string into localized time and date formats based on the user's locale.
 *
 * @param {string} isoString - The UTC ISO string to format.
 * @returns {{ time: string, date: string }} An object containing formatted time and date strings.
 */
export function formatDateTimeLocale(isoString) {
  const { locale } = useI18n({ useScope: "global" })
  // Parse the given UTC ISO string into a Date object
  const date = new Date(isoString)

  // Format time with hours, minutes, and seconds
  const timeFormat = date.toLocaleTimeString(locale.value, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  // Format date with day and month
  const dateFormat = date.toLocaleDateString(locale.value, {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })

  return {
    time: timeFormat,
    date: dateFormat,
  }
}

export function formatPrettyDate(timestamp) {
  /**
   * Calculates the time difference between the current date and a given timestamp.
   *
   * @param {number} timestamp - The timestamp to calculate the difference from.
   * @returns {number} The time difference in milliseconds.
   */
  const timeDiff = Date.now() - timestamp
  // check if timediff is less than one day
  if (timeDiff < 86400000) {
    return formatTimeDifference(timeDiff)
  }
  return formatDateTimeLocale(timestamp).date
}

/**
 * Converts a UTC ISO string to the user's local time zone.
 *
 * @param {string} isoString - The UTC ISO string to convert.
 * @returns {Date} The converted local time in the user's time zone.
 */
export function convertUtcToUserLocalTime(isoString) {
  // Parse the given UTC ISO string into a Date object
  const date = new Date(isoString)
  // Get the time zone offset in minutes for the user's local time zone
  const timezoneOffset = date.getTimezoneOffset()

  // Apply the time zone offset to the date to convert it to the local time
  const userLocalTime = new Date(date.getTime() - timezoneOffset * 60 * 1000)

  const timeFormat = userLocalTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  // Format date with day and month
  const dateFormat = userLocalTime.toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
  })
  return {
    time: timeFormat,
    date: dateFormat,
  }
}

/**
 * Formats a time difference in milliseconds into a human-readable string representation
 * indicating minutes, hours, or days as appropriate.
 *
 * @param {number} timeDifferenceMillis - The time difference in milliseconds to format.
 * @returns {string} The formatted time difference string in the appropriate format.
 */
export function formatTimeDifference(timeDifferenceMillis) {
  const seconds = Math.floor(timeDifferenceMillis / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days >= 1) {
    return `${days} day${days > 1 ? "s" : ""}`
  } else if (hours >= 1) {
    return `${hours} hour${hours > 1 ? "s" : ""}`
  } else if (minutes >= 1) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`
  } else {
    return `${seconds} sec${seconds !== 1 ? "s" : ""}`
  }
}

/**
 * Generates a random alphanumeric string of a given length.
 *
 * @param {number} length - The length of the desired random string.
 * @returns {string} A random alphanumeric string of the specified length.
 *
 * @example
 *   const randomString = genRandAlphaNum(5);
 *   console.log(randomString);  // Outputs something like: "A3f9Z"
 */
export function genRandAlphaNum(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Truncate the section of a string that starts with "lnbc" if it exceeds a certain length.
 *
 * @param {string} inputString - The input string to be processed.
 * @param {number} [maxLength=9] - The maximum allowed length for the "lnbc" section.
 * @returns {string} - Returns the input string with the "lnbc" section possibly truncated.
 *
 * @example
 * const testString = "lnbc5u1pjsz4yrpp5...";
 * console.log(truncateLnbc(testString)); // Outputs "lnbc5u1pjs..."
 */
export function useTruncateLnbc(inputString, maxLength = 9) {
  // Check if the string contains "lnbc"
  if (inputString.includes("lnbc")) {
    // Use a regular expression to match the "lnbc" pattern and grab everything after it
    const match = inputString.match(/(lnbc[^\s]+)/)

    if (match && match[1].length > maxLength) {
      // If the matched string exceeds the maxLength, truncate it and append '...'
      const truncated = match[1].substr(0, maxLength) + "..."
      // Replace the original matched string with the truncated one in the inputString
      return inputString.replace(match[1], truncated)
    }
  }

  // If "lnbc" wasn't found or if the matched string didn't exceed maxLength, return the inputString as is
  return inputString
}

/**
 * Extracts the username from a route parameter.
 *
 * This function assumes that the route parameter is in the format 'v4vapp.dev/bookmark', and extracts the substring
 * before the first '/'. If there is no '/', it extracts the entire string.
 *
 * @param {string} routeParam - The route parameter from which to extract the username.
 * @returns {string} The extracted username.
 */
export function useUsernameFromRouteParam(routeParam) {
  // Assuming routeParam is in the format 'v4vapp.dev/bookmark'
  var slashPosition = routeParam.indexOf("/")

  // Extract the substring before the first /
  // If there is no /, it extracts the entire string
  var username =
    slashPosition !== -1 ? routeParam.substring(0, slashPosition) : routeParam

  return username
}

export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Checks the cache for a given key and returns the cached data if it exists and is not expired.
 * If the cached data is expired, it will be deleted from the cache.
 * @param {string} key - The key to check in the cache.
 * @returns {Promise<Object|null>} - The cached data if it exists and is not expired, otherwise null.
 */
export async function checkCache(key) {
  const cache = await caches.open("v4vapp")
  const cachedResponse = await cache.match(key)
  const cachedTimestamp = await cache.match(`${key}-timestamp`)

  if (cachedResponse && cachedTimestamp) {
    const expiryTime = await cachedTimestamp.text()
    if (Date.now() > expiryTime) {
      // The item is expired
      await cache.delete(key)
      await cache.delete(`${key}-timestamp`)
      return null
    } else {
      const data = await cachedResponse.json()
      return data
    }
  }
  return null
}

export async function putInCache(key, data, expiryTimeInMinutes) {
  /**
   * The cache object used for storing data in the "v4vapp" cache.
   * @type {Cache}
   */
  const cache = await caches.open("v4vapp")
  const expiryTime = Date.now() + expiryTimeInMinutes * 60 * 1000
  cache.put(key, new Response(JSON.stringify(data)))
  cache.put(`${key}-timestamp`, new Response(expiryTime.toString()))
}

/**
 * Calculates the color for a QR code based on the given parameters.
 *
 * @param {boolean} isLightning - Indicates whether the QR code is related to lightning.
 * @param {boolean} loading - Indicates whether the QR code is still loading.
 * @returns {string} The color code for the QR code.
 */
export function QRLightningHiveColor(isLightning, loading) {
  const q = useQuasar()
  if (loading) {
    return q.dark.isActive ? "#992AC7" : "#2F0D3D"
  }

  if (isLightning) {
    return q.dark.isActive ? "#18D231" : "#0A5614"
  }

  return q.dark.isActive ? "#1976D2" : "#0E4377"
}

export function buttonActiveNot(isActive) {
  const colors = {
    color: isActive ? "primary" : "blue-grey-1",
    textColor: isActive ? "white" : "grey-7",
  }
  return colors
}

/**
 * Retrieves the challenge from the Login API.
 *
 * @param {string} hiveAccName - The hive account name.
 * @param {string} clientId - The client ID.
 * @returns {Promise} - A promise that resolves to the challenge data.
 */
export async function useGetChallenge(hiveAccName, clientId) {
  const getChallenge = await apiLogin.get(`/auth/${hiveAccName}`, {
    params: {
      clientId: clientId,
      appId: `${productName}-${version}`.replace(/\s+/g, ""),
    },
  })
  return getChallenge
}

export function getMinMax(dest) {
  const storeApiStatus = useStoreAPIStatus()
  const storeUser = useStoreUser()
  console.log("dest", dest)
  if (storeApiStatus.minMax) {
    let min = 1
    let max = 400
    if (dest === "SATS") {
      dest = "sats"
      min = storeApiStatus.minMax.sats.min
      max = Math.min(
        storeUser.keepSatsBalanceNum,
        storeApiStatus.minMax.sats.max
      )
    } else {
      min = storeApiStatus.minMax[dest].min
      max = storeApiStatus.minMax[dest].max

      min = Math.min(min, storeUser.balancesNum[dest.toLowerCase()])
      max = Math.min(max, storeUser.balancesNum[dest.toLowerCase()])
    }
    const diff = max - min

    // Divide the difference by 100 to get the initial step size
    let step = diff / 100

    // Calculate the power of 10 for the step size
    const power = Math.floor(Math.log10(step))

    // Round the step size to the nearest power of 10
    step = Math.pow(10, power)
    const mid = diff / 2 + min
    return { min: min, max: max, step: step, mid: mid }
  }
  return { min: 1, max: 400, step: 1, diff: 200 }
}
