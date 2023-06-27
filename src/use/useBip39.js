import { api } from "boot/axios"
import { Quasar } from "quasar"

const backupWords = [
  "lottery",
  "crowd",
  "crash",
  "rally",
  "drill",
  "bonus",
  "derive",
  "party",
  "absorb",
  "height",
  "mouse",
  "cage",
  "tongue",
  "gather",
  "shrimp",
  "coast",
  "menu",
  "say",
  "tomorrow",
  "country",
  "discover",
  "front",
  "situate",
  "auto",
  "shaft",
  "plug",
  "solar",
  "define",
  "buzz",
  "find",
  "boss",
  "devote",
  "pipe",
  "horror",
  "news",
  "reason",
  "palace",
  "only",
  "judge",
  "gesture",
  "arrive",
  "fan",
  "plunge",
  "clap",
  "illegal",
  "mask",
  "toast",
  "pottery",
]

export async function useBip39(count) {
  // Returns a list of bip39 words using V4V.app API
  // Falls back to a limited subset of words if the API is down
  let locale = Quasar.lang.getLocale() // returns a string
  try {
    const resp = await api.get("/bip39/", {
      params: {
        count: count,
        lang_code: locale,
      },
    })
    if (resp.status !== 200) throw new Error("API returned non-200 status")
    return resp.data
  } catch {
    return getRandomWords(backupWords, count)
  }
}

function getRandomWords(wordsList, count) {
  if (count <= 0 || count > wordsList.length) {
    throw new Error("Invalid count value")
  }

  const shuffledWords = wordsList.sort(() => 0.5 - Math.random())
  return shuffledWords.slice(0, count)
}
