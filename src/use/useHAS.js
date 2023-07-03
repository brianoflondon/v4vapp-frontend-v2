import HAS from "hive-auth-wrapper"

import { ref } from "vue"
import { useStoreUser } from "src/stores/storeUser"
import { store } from "quasar/wrappers"

const qrCodeText = ref("This is a test QR Code")
const expiry = ref(0)
const storeUser = useStoreUser()
export function useHAS() {
  return { qrCodeText, expiry }
}

let auth_payload = {}

// Login to HAS
export async function HASLogin(username = "", keyType = "posting") {
  // Your application information
  if (username === "") {
    console.error("username is empty")
    resolve(false)
  }
  const existingAuth = storeUser.getUser(username)
  console.log("existingAuth", existingAuth)
  if (existingAuth) {
    console.log("existingAuth", existingAuth)
    if (existingAuth.authKey && existingAuth.expire > Date.now()) {
      console.log(
        "login expires in: ",
        (existingAuth.expire - Date.now()) / 1000 / 60,
        "min"
      )
      return
    }
  }
  console.log("username", username)
  const APP_META = {
    name: "v4vapp",
    description: "V4V.app Lightning Hive Gateway",
    icon: "https://v4v.app/site-logo/v4vapp-logo-shadows.svg",
  }

  // Create an authentication object
  const auth = {
    username: username, // required - replace "username" with your Hive account name (without the @)
    expire: undefined,
    key: keyType,
  }

  // Retrieving connection status
  const status = HAS.status()
  console.log(status)

  if (auth.expire > Date.now()) {
    // token exists and is still valid - no need to login again
    resolve(true)
  } else {
    let challenge_data = undefined
    // optional - create a challenge to be signed with the posting key
    challenge_data = {
      key_type: keyType,
      challenge: JSON.stringify({
        login: auth.username,
        ts: Date.now(),
      }),
    }
    console.log("challenge_data", challenge_data)
    HAS.authenticate(auth, APP_META, challenge_data, (req) => {
      console.log("response", req) // process auth_wait
      console.log("expires in ", (req.expire - Date.now()) / 1000, "secs")
      expiry.value = req.expire
      auth_payload = {
        account: req.account,
        uuid: req.uuid,
        key: req.key,
        host: status.host,
      }
      const auth_payload_string = JSON.stringify(auth_payload)
      const URI = `has://auth_req/${btoa(auth_payload_string)}`
      qrCodeText.value = URI
    })
      .then((res) => resolve(res)) // Authentication request approved
      .catch((err) => reject(err)) // Authentication request rejected or error occurred
  }
}

// Authentication request approved
function resolve(res) {
  console.log("resolve", res.data)
  console.log("auth_payload", auth_payload)
  storeUser.login(
    auth_payload.account,
    auth_payload.key,
    auth_payload.uuid,
    res.data.expire
  )
  qrCodeText.value = null
  auth_payload = {}
}

// Authentication request rejected or error occurred
function reject(err) {
  console.log("reject", err)
  qrCodeText.value = ""
  auth_payload = {}
}

export async function HASbroadcast(operation) {
  // Broadcast a message to the user
  // Create an authentication object

  const op = [
    "transfer",
    {
      from: "v4vapp.dev",
      to: "v4vapp.dev",
      amount: "1.001 HIVE",
      memo: "memo",
    },
  ]
  // Retrieving connection status
  const status = HAS.status()

  const auth = {
    username: "v4vapp.dev", // (required)
    key: storeUser.authKey,
    token: ""
  }

  auth_payload = {
    account: "v4vapp.dev",
    uuid: storeUser.authKey,
    key: "active",
    host: status.host,
  }

  HAS.broadcast(auth, op[0], [op], (evt) => {
    console.log(evt) // process sign_wait
  })
    .then((res) => resolve(res)) // transaction approved and successfully broadcasted
    .catch((err) => reject(err)) // transaction rejected or failed
}
