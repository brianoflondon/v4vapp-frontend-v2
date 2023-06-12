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
 * @returns {string|null} - The formatted number as a string, or null if the input is falsy.
 */
export function tidyNumber(x) {
  if (x) {
    const parts = x.toString().split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return parts.join(".")
  } else {
    return null
  }
}
