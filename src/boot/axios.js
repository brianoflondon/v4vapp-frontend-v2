import { boot } from "quasar/wrappers"
import axios from "axios"

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)

// My Lightning Node address to prevent self-payment
const myNodePubKey =
  "0266ad2656c7a19a219d37e82b280046660f4d7f3ae0c00b64a1629de4ea567668"

// const myNodePubKey = ""
let useLocal = false

const isLocalhost =
  window.location.href.includes("localhost") ||
  window.location.href.includes("127.0") ||
  window.location.href.includes("192.168") ||
  window.location.href.includes("10.0")

console.log("isLocalhost", isLocalhost)

console.log("process.env.VUE_APP_LOCAL_API", process.env.VUE_APP_LOCAL_API)

if (process.env.VUE_APP_LOCAL_API === "true" || isLocalhost) {
  console.log("Using local API")
  useLocal = process.env.VUE_APP_LOCAL_API !== "false"
}

const isDev = window.location.href.includes("dev.v4v.app")

const useDev = isDev || process.env.VUE_APP_DEV_API === "true"

const rootUrl = useDev ? "https://devapi.v4v.app/v1" : "https://api.v4v.app/v1"
const rootLoginUrl = useDev ? "https://devapi.v4v.app/" : "https://api.v4v.app/"

let apiURL = rootUrl
let apiLoginURL = rootLoginUrl

if (useLocal) {
  apiURL = "http://localhost:1818/v1"
  apiLoginURL = "http://localhost:1818/"
}

// // make a test call to localhost and if it fails, use the remote server
// if (useLocal) {
//   axios
//     .get("http://localhost:1818/v1")
//     .then((response) => {
//       console.log("Local API available", response.data)
//       apiURL = "http://localhost:1818/v1"
//       apiLoginURL = "http://localhost:1818/"

//     })
//     .catch((error) => {
//       console.log("Local API not available", error)
//     })
// }

const serverHiveAccount = useLocal ? "hivehydra" : "v4vapp"

console.log("useLocal", useLocal)
console.log("rootUrl", rootUrl)
console.log("apiURL", apiURL)
console.log("apiLoginURL", apiLoginURL)

const api = axios.create({ baseURL: apiURL })
const apiLogin = axios.create({ baseURL: apiLoginURL })

export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API

  app.config.globalProperties.$apiLogin = apiLogin
})

export { axios, api, apiLogin, apiURL, myNodePubKey, serverHiveAccount }
