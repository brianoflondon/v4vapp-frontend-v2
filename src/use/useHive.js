// useHive.js
//
// Functions related to Hive
// ----------------------------------------------------------------------------
import { apiURL } from "boot/axios"
import { Dark } from "quasar"
import { KeychainSDK } from "keychain-sdk"

import "src/assets/hive-tx.min.js"

const useHiveAccountRegex =
  /^(?=.{3,16}$)[a-z]([0-9a-z]|[0-9a-z-](?=[0-9a-z])){2,}([.](?=[a-z][0-9a-z-][0-9a-z-])[a-z]([0-9a-z]|[0-9a-z-](?=[0-9a-z])){1,}){0,}$/

const serverHiveAccount = "v4vapp"

export async function useHiveDetails(hiveAccname) {
  // returns Hive Profile and details for a given Hive hiveAccname
  if (!hiveAccname?.match(useHiveAccountRegex)) {
    console.debug("Invalid Hive hiveAccname")
    return null
  }
  try {
    const res = await hiveTx.call("condenser_api.get_accounts", [[hiveAccname]])
    let hiveDetails = res.result[0]
    hiveDetails["profile"] = await extractProfile(hiveDetails)
    console.log("hiveDetails", hiveDetails)
    return hiveDetails
  } catch (e) {
    return null
  }
}

export async function useHiveProfile(hiveAccname) {
  // returns Hive Profile for a given Hive hiveAccname
  if (!hiveAccname?.match(useHiveAccountRegex)) {
    console.debug("Invalid Hive hiveAccname")
    return null
  }
  try {
    const profile = await hiveTx.call("bridge.get_profile", [
      hiveAccname, // account to look up
      hiveAccname, // observer account
    ])
    return profile.result
    //curl -s --data '{"jsonrpc":"2.0", "method":"bridge.get_profile", "params":{"account": "alice", "observer": "bob"}, "id":1}' https://api.hive.blog
  } catch (e) {
    console.log("Error:", e)
    return null
  }
}

/*************************************************
 ****     Avatar related functions
 **************************************************/

export function useHiveAvatarRef({
  hiveAccname,
  size = "medium",
  reason = "v4vapp-useHiveAvatarRef",
}) {
  const hiveAvatar = ref(
    useHiveAvatarURL({ hiveAccname: hiveAccname, size: size, reason: reason })
  )
  return hiveAvatar
}

export function useBlankProfileURL() {
  // Returns the blank profile image
  if (Dark.isActive) {
    return "avatars/hive_logo_dark.svg"
  } else {
    return "avatars/hive_logo_light.svg"
  }
}

export function useHiveAvatarURL({
  hiveAccname,
  size = "medium",
  reason = "v4vapp-v2-useHiveAvatarURL",
}) {
  // Uses the Hive.blog image service to get the avatar for a Hive account
  // Returns null if the hiveAccname is blank or not a valid name.
  if (!hiveAccname || !hiveAccname.match(useHiveAccountRegex)) {
    return useBlankProfileURL()
  }
  return (
    apiURL + "/hive/avatar/" + hiveAccname + "/" + size + "?reason=" + reason
  )
}

// -------- Helper functions --------
async function extractProfile(data) {
  // Extracts the profile from the posting_json_metadata field or
  // if that doesn't exist checks the profile.
  try {
    const profile = await JSON.parse(data["posting_json_metadata"])["profile"]
    return profile
  } catch (e) {
    try {
      const profile = await JSON.parse(data["json_metadata"])["profile"]
      return profile
    } catch (e) {
      return null
    }
  }
}

// -------- Hive Account Reputation --------
export async function useLoadHiveAccountsReputation(val, maxAcc = 6) {
  // search through Hive for accounts matching pattern val
  // return sorted by reputation.
  // If there is an exact match in the list, it will be the first item.
  if (val.length < 2) {
    return
  }
  try {
    const res = await hiveTx.call("condenser_api.get_account_reputations", [
      val,
      maxAcc + 10,
    ])
    const reputations = res.result
    reputations.sort((a, b) => b.reputation - a.reputation)

    const exactMatchIndex = reputations.findIndex(
      (item) => item.account === val
    )
    if (exactMatchIndex > -1) {
      const exactMatch = reputations.splice(exactMatchIndex, 1)
      reputations.unshift(exactMatch[0])
    }

    const sortedAccounts = reputations
      .map((item) => item.account)
      .slice(0, maxAcc)

    return sortedAccounts
  } catch (error) {
    console.error(error)
  }
}

/**
 * useGetHiveProposalVotes fetches proposal votes for a given Hive account and proposal ID.
 *
 * @param {string} hiveAccname - The name of the Hive account to fetch votes for.
 * @param {string|number} proposalId - The ID of the proposal to fetch votes for.
 *
 * @returns {Promise<Array>|null} Returns a Promise that resolves to an array of proposal votes.
 *                               Returns null if the provided Hive account name or proposal ID are invalid,
 *                               or if no votes were found for the given proposal.
 */
export async function useGetHiveProposalVotes(hiveAccname, proposalId) {
  if (!hiveAccname || !hiveAccname.match(useHiveAccountRegex)) {
    return null
  }

  let shouldFetchNextPage = true
  let lastProcessedProposalId = 0
  const pageSize = 100
  proposalId = parseInt(proposalId, 10)

  while (shouldFetchNextPage) {
    try {
      const params = [
        [hiveAccname, lastProcessedProposalId],
        pageSize,
        "by_voter_proposal",
        "ascending",
        "votable",
      ]

      const response = await hiveTx.call(
        "condenser_api.list_proposal_votes",
        params
      )
      const userVotedItems = response.result.filter(
        (item) => item.voter === hiveAccname
      )

      if (!userVotedItems.length) {
        return null
      }

      if (userVotedItems.length < pageSize) {
        shouldFetchNextPage = false
      }

      const matchingProposals = userVotedItems.filter(
        (item) => item.proposal.proposal_id === proposalId
      )

      if (matchingProposals.length > 0) {
        return matchingProposals
      }

      lastProcessedProposalId =
        userVotedItems[userVotedItems.length - 1].proposal.proposal_id + 1
    } catch (error) {
      console.error("An error occurred while fetching proposal votes:", error)
      return null
    }
  }
}

/*************************************************
 ****     Hive Keycahin Functions
 **************************************************/

const keychain = new KeychainSDK(window)

export async function useIsHiveKeychainInstalled() {
  try {
    const isKeychainIn = await keychain.isKeychainInstalled()
    return isKeychainIn
  } catch (error) {
    console.log({ error })
  }
  return false
}

export async function useHiveKeychainLogin({
  hiveAccname,
  message = null,
  keyType = "posting",
}) {
  console.log("useHiveKeychainLogin")
  const isKeychainIn = keychain.isKeychainInstalled()
  if (!isKeychainIn || !hiveAccname) {
    return null
  }
  if (!message) {
    message = "Login to V4Vapp"
  }
  const keychainParams = {
    data: {
      username: hiveAccname,
      message: message,
      method: keyType,
      title: "Login",
    },
    options: {},
  }
  try {
    const loginResult = await keychain.login(
      keychainParams.data,
      keychainParams.options
    )
    console.log(loginResult)
    return loginResult
  } catch (error) {
    console.log({ error })
    return error
  }
}

// -------- Hive Transfer --------

/**
 * Performs a transfer using the Hive Keychain SDK.
 *
 * @param {string} username - The username of the sender.
 * @param {number} amount - The amount to be transferred.
 * @param {string} currency - The currency of the transfer.
 * @param {string} memo - The memo associated with the transfer.
 * @returns {Promise<Object>} - A Promise that resolves to the transfer object.
 * @throws {Error} - If an error occurs during the transfer process.
 */
export async function useHiveKeychainTransfer(
  username,
  amount,
  currency,
  memo
) {
  try {
    const keychain = new KeychainSDK(window)
    amount = parseFloat(amount).toFixed(3)
    const formParamsAsObject = {
      data: {
        username: username,
        to: serverHiveAccount,
        amount: amount,
        memo: memo,
        enforce: false,
        currency: currency,
      },
    }
    const transfer = await keychain.transfer(formParamsAsObject.data)
    console.log({ transfer })
    return transfer
  } catch (error) {
    console.log({ error })
    return error
  }
}

// -------- Hive check for transactions --------
export async function useGetHiveTransactionHistory(
  hiveAccname,
  limit = 10,
  start = -1,
  opFilterLow = 4,
  opFilterHigh = 4
) {
  // Returns the account history for the given account.

  if (!hiveAccname || !hiveAccname.match(useHiveAccountRegex)) {
    return null
  }
  try {
    const history = await hiveTx.call("condenser_api.get_account_history", [
      hiveAccname,
      start,
      limit,
      opFilterLow,
      opFilterHigh,
    ])
    return history.result.reverse()
    // const transfers = history.result.filter((item) => item[1].op[0] === "transfer")
    // return transfers.reverse()
  } catch (error) {
    console.log({ error })
    return null
  }
}
