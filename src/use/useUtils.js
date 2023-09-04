// useUtils.js
// ----------------------------------------------------------------------------
// General utility functions
//
// ----------------------------------------------------------------------------

import { useI18n } from "vue-i18n"

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
  /**
   * Formats a time duration in seconds into a human-readable string.
   *
   * @param {number} timeInSeconds - The time duration in seconds to format.
   * @returns {string} The formatted time string in the format "Xh Ym Zs" or "Ym Zs" or "Zs".
   */
  // const { locale } = useI18n({ useScope: "global" })

  // Parse the given UTC ISO string into a Date object
  const date = new Date(isoString)

  // Format time with hours, minutes, and seconds
  const timeFormat = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  // Format date with day and month
  const dateFormat = date.toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
  })

  return {
    time: timeFormat,
    date: dateFormat,
  }
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
