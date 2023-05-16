// useHive.js
//
// Functions related to Hive
// ----------------------------------------------------------------------------
import { apiURL } from "boot/axios"
import { Dark } from "quasar"
import "src/assets/hive-tx.min.js"

const useHiveAccountRegex =
  /^(?=.{3,16}$)[a-z]([0-9a-z]|[0-9a-z-](?=[0-9a-z])){2,}([.](?=[a-z][0-9a-z-][0-9a-z-])[a-z]([0-9a-z]|[0-9a-z-](?=[0-9a-z])){1,}){0,}$/

export async function useHiveDetails(hiveAccname) {
  // returns Hive Profile and details for a given Hive hiveAccname
  if (!hiveAccname.match(useHiveAccountRegex)) {
    console.log("Invalid Hive hiveAccname")
    return null
  }
  try {
    const res = await hiveTx.call("condenser_api.get_accounts", [[hiveAccname]])
    console.log(res)
    let hiveDetails = res.result[0]
    hiveDetails["profile"] = extractProfile(hiveDetails)
    return hiveDetails
  } catch (e) {
    return null
  }
}

/*************************************************
 ****     Avatar related funcitons
 **************************************************/

export function useHiveAvatarRef({
  hiveAccname,
  size = "medium",
  reason = "v4vapp-web",
}) {
  console.log("useHiveAvatarRef", hiveAccname)
  const hiveAvatar = ref(
    useHiveAvatarURL({ hiveAccname: hiveAccname, size: size, reason: reason })
  )
  return hiveAvatar
}

export function useHiveAvatarURL({
  hiveAccname,
  size = "medium",
  reason = "v4vapp-web",
}) {
  // Uses the Hive.blog image service to get the avatar for a Hive account
  // Returns null if the hiveAccname is blank or not a valid name.
  if (!hiveAccname || !hiveAccname.match(useHiveAccountRegex)) {
    if (Dark.isActive) {
      return "avatars/hive_logo_dark.svg"
    } else {
      return "avatars/hive_logo_light.svg"
    }
  }
  console.log(apiURL + "/hive/avatar/" + hiveAccname + "/" + size)
  return (
    apiURL + "/hive/avatar/" + hiveAccname + "/" + size + "?reason=" + reason
  )
}

export async function useLoadHiveAvatar(hiveAccname) {
  const url = useHiveAvatarURL({ hiveAccname: hiveAccname, size: "small" })
  try {
    const res = await axios({
      url: url,
      method: "GET",
      responseType: "blob",
    })
    console.log("useLoadHiveAvatar result", res)
    if (res.status === 200) {
      const retUrl = URL.createObjectURL(res.data)
      console.log("useLoadHiveAvatar retUrl", retUrl)
      return retUrl
    } else {
      return "avatars/unkown_hive_user.png"
    }
  } catch (err) {
    return "avatars/unkown_hive_user.png"
  }
}

// -------- Helper functions --------
function extractProfile(data) {
  // Extracts the profile from the posting_json_metadata field or
  // if that doesn't exist checks the profile.
  try {
    const profile = JSON.parse(data["posting_json_metadata"])["profile"]
    return profile
  } catch (e) {
    try {
      const profile = JSON.parse(data["json_metadata"])["profile"]
      return profile
    } catch (e) {
      return null
    }
  }
}

// -------- Hive Account Reputation --------
export async function useLoadHiveAccountsReputation(val, maxAccounts = 6) {
  // search through Hive for accounts matching pattern val
  // return sortted by reputation
  if (val.length < 2) {
    return
  }
  try {
    const res = await hiveTx.call("condenser_api.get_account_reputations", [
      val,
      maxAccounts,
    ])
    const accounts = res.result.map((el) => el.account)
    return accounts
  } catch (error) {
    console.log(error)
  }
}
