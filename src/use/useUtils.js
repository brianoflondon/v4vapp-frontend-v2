// useUtils.js
// ----------------------------------------------------------------------------
// General utility functions
//
// ----------------------------------------------------------------------------

export function tidyNumber(x) {
  if (x) {
    const parts = x.toString().split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return parts.join(".")
  } else {
    return null
  }
}
