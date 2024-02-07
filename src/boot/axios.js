import { boot } from "quasar/wrappers"
import axios from "axios"
import { root } from "postcss"

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)

// My Lightning Node address to prevent self-payment
const myNodePubKey =
  "0266ad2656c7a19a219d37e82b280046660f4d7f3ae0c00b64a1629de4ea567668"

// Set this to false to use the devapi URLs
console.log("process.env", process.env)
console.log("PROD: ", process.env.PROD)
console.log("DEV: ", process.env.DEV)

const useLocal = process.env.DEV ? true : false

const rootUrl = process.env.PROD
  ? "https://api.v4v.app/v1"
  : "https://devapi.v4v.app/v1"
console.log("rootUrl: ", rootUrl)

const apiURL = useLocal ? "http://127.0.0.1:1818/v1" : rootUrl

const apiLoginURL = useLocal ? "http://127.0.0.1:1818" : rootUrl

const serverHiveAccount = "v4vapp"

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

  app.config.globalProperties.$apiLoginURL = apiLogin
})

export { axios, api, apiLogin, apiURL, myNodePubKey, serverHiveAccount }
