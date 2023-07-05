import HAS from "hive-auth-wrapper"
import { serverHiveAccount } from "boot/axios"

import { ref } from "vue"
import { useStoreUser } from "src/stores/storeUser"
import { v4 as uuidv4 } from "uuid"

const qrCodeTextHAS = ref("")
const expiry = ref(0)
const storeUser = useStoreUser()
let pendingTransaction = null
export function useHAS() {
  return { qrCodeTextHAS, expiry }
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
  // generate random uuid
  const myAuthKey = uuidv4()

  const auth = {
    username: username, // required - replace "username" with your Hive account name (without the @)
    expire: undefined,
    key: myAuthKey,
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
        key: myAuthKey,
        host: status.host,
      }
      const auth_payload_string = JSON.stringify(auth_payload)
      const URI = `has://auth_req/${btoa(auth_payload_string)}`
      qrCodeTextHAS.value = URI
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
    "posting",
    auth_payload.key,
    res.data.expire,
    res.data.token
  )
  qrCodeTextHAS.value = null
  auth_payload = {}
  if (pendingTransaction) {
    const start = Date.now()
    console.log("pendingTransaction delay executing now")
    // run the pending transaction AFTER a delay of 300ms to
    // allow the login to complete
    setTimeout(() => {
      console.log("pendingTransaction executing now ", Date.now() - start, "ms")
      pendingTransaction()
    }, 3000)
  }
}

// Authentication request rejected or error occurred
function reject(err) {
  console.log("reject", err)
  qrCodeTextHAS.value = null
  auth_payload = {}
}

function createOp(from, to, amount, memo) {
  return [
    "transfer",
    {
      from,
      to,
      amount,
      memo,
    },
  ]
}

export async function useHASTransfer(username, amount, currency, memo) {
  console.log("useHASTransfer", username, amount, currency, memo)
  amount = parseFloat(amount).toFixed(3)
  const amountString = `${amount} ${currency}`
  const operation = createOp(username, serverHiveAccount, amountString, memo)
  console.log("operation", operation)

  // Get details for this user
  const user = storeUser.getUser(username)
  if (!user || !user.authKey) {
    // User not authenticated with HAS
    console.log("user not authenticated with HAS")
    pendingTransaction = function () {
      useHASTransfer(username, amount, currency, memo)
    }
    console.log("pendingTransaction stored")
    HASLogin(username)
    return
  }

  console.log("user", user)

  const auth = {
    username: user.hiveAccname, // (required)
    key: user.authKey,
    token: user.token,
  }

  HAS.broadcast(auth, "active", [operation], (evt) => {
    console.log("HAS return event", evt)
    console.log("expires in ", (evt.expire - Date.now()) / 1000, "secs")
    expiry.value = evt.expire / 1000
    return evt
  })
    .then((res) => {
      console.log("resolved: ", res)
      // resolve(res)
    })
    .catch((err) => {
      console.log("error: ", err)
      // reject(err)
    })
}

export async function HASbroadcast(operation) {
  // Broadcast a message to the user
  // Create an authentication object

  const op = [
    "transfer",
    {
      from: storeUser.hiveAccname,
      to: storeUser.hiveAccname,
      amount: "1.001 HIVE",
      memo: "this is a memo",
    },
  ]

  // Retrieving connection status
  const status = HAS.status()
  console.log(status)

  const auth = {
    username: storeUser.hiveAccname, // (required)
    key: storeUser.authKey,
    token: storeUser.token,
  }

  console.log("auth", auth)
  console.log("op", op)

  HAS.broadcast(auth, "active", [op], (evt) => {
    console.log(evt)
  })
    .then((res) => {
      console.log(res)
      resolve(res)
    })
    .catch((err) => {
      console.log(err)
      reject(err)
    })
}
