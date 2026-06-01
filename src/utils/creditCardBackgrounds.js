const fallbackCreditCardBackgrounds = [
  "sealogo01",
  "sealogo02",
  "lightning01",
  "lightning02",
  "lightning03",
  "lightning04",
  "dolphins",
  "grok-01",
  "grok-02",
  "grok-03",
  "grok-04",
]

// Keep this list in sync with files in public/credit-card/backgrounds/*.webp.
// If globbing cannot resolve in a given environment, we fall back to defaults.
const discoveredCreditCardBackgrounds = Object.keys(
  import.meta.glob("/public/credit-card/backgrounds/*.webp"),
)
  .map((filePath) =>
    filePath
      .split("/")
      .pop()
      ?.replace(/\.webp$/i, ""),
  )
  .filter(Boolean)
  .sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
  )

export const creditCardBackgrounds =
  discoveredCreditCardBackgrounds.length > 0
    ? discoveredCreditCardBackgrounds
    : fallbackCreditCardBackgrounds

export function creditCardBackgroundUrl(backgroundName) {
  return `/credit-card/backgrounds/${backgroundName}.webp`
}
