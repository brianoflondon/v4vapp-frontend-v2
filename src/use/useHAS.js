import HAS from "hive-auth-wrapper"
import { api, serverHiveAccount } from "boot/axios"

import { ref } from "vue"
import { useStoreUser } from "src/stores/storeUser"
import { v4 as uuidv4 } from "uuid"
import { apiLogin } from "boot/axios"

const qrCodeTextHAS = ref("")
const expiry = ref(0)
const resolvedHAS = ref(null)
const storeUser = useStoreUser()
let pendingTransaction = null
export function useHAS() {
  return { qrCodeTextHAS, expiry, resolvedHAS }
}

let auth_payload = {}

export async function useIsHASAvailable() {
  try {
    console.log("useIsHasAvailable running")
    const status = HAS.status()
    console.log("status", status)
    return status.connected
  } catch (error) {
    console.error({ error })
    return false
  }
}

/**
 * Checks if there is an existing authentication for the given username.
 * @param {string} username - The username to check for existing authentication.
 * @returns {boolean} - Returns true if there is an existing authentication that is not expired, otherwise false.
 */
export function useCheckExistingHASAuth(username) {
  console.log("Checking existing HAS auth for ", username)
  const existingAuth = storeUser.getUser(username)
  console.log("existingAuth", existingAuth)
  if (existingAuth && !existingAuth.apiKey) {
    console.log("existingAuth", existingAuth)
    if (existingAuth.authKey && existingAuth.expire > Date.now()) {
      console.log(
        "login expires in: ",
        (existingAuth.expire - Date.now()) / 1000 / 60,
        "min"
      )
      return true
    }
  }
  return false
}

/**
 * Performs a login operation using the Hive Authentication System (HAS).
 *
 * @param {string} username - The Hive account name (without the @).
 * @param {string} keyType - The type of key to use for authentication (default: "posting").
 * @returns {Promise<boolean>} - A promise that resolves to true if the login is successful, and false otherwise.
 */
export async function useHASLogin(username = "", keyType = "posting") {
  // Your application information
  if (username === "") {
    console.error("username is empty")
    resolve(false)
  }
  const existingAuth = useCheckExistingHASAuth(username)
  if (existingAuth) {
    console.log("existingAuth", existingAuth)
    return true
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

  async function getChallenge(hiveAccName, clientId) {
    const getChallenge = await apiLogin.get(`/auth/${hiveAccName}`, {
      params: {
        clientId: clientId,
      },
    })
    return getChallenge
  }

  if (auth.expire > Date.now()) {
    // token exists and is still valid - no need to login again
    resolve(true)
  } else {
    const clientId = storeUser.clientId
    const challenge = await getChallenge(username, clientId)
    console.log("challenge", challenge)
    let challenge_data = undefined
    // optional - create a challenge to be signed with the posting key
    challenge_data = {
      key_type: keyType,
      challenge: challenge.data.challenge,
    }
    console.log("challenge_data", challenge_data)

    HAS.authenticate(auth, APP_META, challenge_data, (req) => {
      console.log("response", req) // process auth_wait
      console.log("expires in ", (req.expire - Date.now()) / 1000, "secs")
      expiry.value = req.expire / 1000
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
      .then((res) => resolveAuth(res, auth, challenge_data)) // Authentication request approved
      .catch((err) => reject(err)) // Authentication request rejected or error occurred
  }
}

// Authentication request approved
/**
 * Resolves the authentication process.
 *
 * @param {Object} res - The response object.
 * @param {Object} auth - The authentication object.
 * @param {Object} challenge_data - The challenge data object.
 * @returns {Promise<void>} - A promise that resolves when the authentication process is completed.
 */
async function resolveAuth(res, auth, challenge_data) {
  console.log("--- resolveAuth ---")
  console.log("res.data", res.data)
  console.log("auth_payload", auth_payload)
  console.log("challenge_data", challenge_data)

  // Now we call the API to get the token
  // TRY HERE
  try {
    var formData = new URLSearchParams()

    let usernameData = {
      hiveAccName: auth_payload.account,
      clientId: storeUser.clientId,
    }

    let usernameString = JSON.stringify(usernameData)
    formData.append("username", usernameString)
    const passwordData = {
      success: true,
      publicKey: res.data.challenge.pubkey,
      result: res.data.challenge.challenge,
      data: {
        username: auth_payload.account,
        message: challenge_data.challenge,
        key: "posting",
      },
    }

    let passwordString = JSON.stringify(passwordData)
    formData.append("password", passwordString)

    const responseApi = await apiLogin.post(`/token`, formData)
    const apiTokenExpire = responseApi.data.expire * 1000
    const apiTokenExpireDate = new Date(apiTokenExpire)
    let hasTokenExpire = res.data.expire
    const hasTokenExpireDate = new Date(hasTokenExpire)

    if (hasTokenExpire > apiTokenExpire) {
      console.log("HAS expire is greater than API expire")
      hasTokenExpire = apiTokenExpire
    }
    storeUser.login(
      auth_payload.account,
      "posting",
      auth_payload.key,
      hasTokenExpire,
      res.data.token,
      responseApi.data.access_token
    )
    qrCodeTextHAS.value = null
    expiry.value = 0
    auth_payload = {}
    resolvedHAS.value = res
  } catch (error) {
    console.log("signature failure")
    console.error("error", error)
  }

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

// Transaction approved
function resolveTransaction(res) {
  resolvedHAS.value = res
}

function rejectTransaction(err) {
  resolvedHAS.value = err
}

// Authentication request rejected or error occurred
function reject(err) {
  qrCodeTextHAS.value = null
  expiry.value = 0
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

/**
 * Transfers an amount of currency from one user to another using the HAS system.
 * @param {string} username - The username of the user initiating the transfer.
 * @param {number} amount - The amount of currency to transfer.
 * @param {string} currency - The currency to transfer.
 * @param {string} memo - The memo to include with the transfer.
 * @returns {Promise} - A promise that resolves when the transfer is successful or rejects with an error.
 */
export async function useHASTransfer(username, amount, currency, memo) {
  console.log("useHASTransfer: ", username, amount, currency, memo)
  amount = parseFloat(amount).toFixed(3)
  const amountString = `${amount} ${currency}`
  const operation = createOp(username, serverHiveAccount, amountString, memo)

  // Get details for this user
  const user = storeUser.getUser(username)
  if (!user || !user.authKey) {
    // User not authenticated with HAS
    console.log("user not authenticated with HAS")
    pendingTransaction = function () {
      useHASTransfer(username, amount, currency, memo)
    }
    console.log("pendingTransaction stored")
    useHASLogin(username)
    return
  }

  const auth = {
    username: user.hiveAccname, // (required)
    key: user.authKey,
    token: user.token,
  }

  HAS.broadcast(auth, "active", [operation], (evt) => {
    expiry.value = evt.expire / 1000
    resolvedHAS.value = evt
  })
    .then((res) => {
      resolveTransaction(res)
    })
    .catch((err) => {
      rejectTransaction(err)
    })
}
