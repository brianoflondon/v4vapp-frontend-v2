// useUtils.js
// ----------------------------------------------------------------------------
// General utility functions
//
// ----------------------------------------------------------------------------

/**
 * Formats a number by inserting commas as thousands separators in its integer part,
 * while preserving any decimal part.
 *
 * @param {number} x - The number to be formatted.
 * @param {number} decimals - The number of decimals to be displayed. Defaults to 2.
 * @returns {string|null} - The formatted number as a string, or null if the input is falsy.
 */
// export function tidyNumber(x) {
//   if (x) {
//     const parts = x.toString().split(".")
//     parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
//     return parts.join(".")
//   } else {
//     return null
//   }
// }
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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}