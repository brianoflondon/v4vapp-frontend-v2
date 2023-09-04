// useHive.js
//
// Functions related to Hive
// ----------------------------------------------------------------------------
import { apiURL, api } from "boot/axios"
import { Dark } from "quasar"

import "src/assets/hive-tx.min.js"

const useHiveAccountRegex =
  /^(?=.{3,16}$)[a-z]([0-9a-z]|[0-9a-z-](?=[0-9a-z])){2,}([.](?=[a-z][0-9a-z-][0-9a-z-])[a-z]([0-9a-z]|[0-9a-z-](?=[0-9a-z])){1,}){0,}$/

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
  } catch (e) {
    console.error("Error:", e)
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

export async function useHiveAvatarBlob({
  hiveAccname,
  size = "medium",
  reason = "v4vapp-v2-useHiveAvatarURL",
}) {
  // Uses the Hive.blog image service to get the avatar for a Hive account
  // Returns null if the hiveAccname is blank or not a valid name.
  if (!hiveAccname || !hiveAccname.match(useHiveAccountRegex)) {
    return useBlankProfileURL()
  }
  const url = "/hive/avatar/" + hiveAccname + "/" + size + "?reason=" + reason
  try {
    const response = await api.get(url, { responseType: "blob" })
    const blob = new Blob([response.data], { type: response.data.type })

    // Check if the image is not 0 bytes
    if (blob.size > 0) {
      return URL.createObjectURL(blob)
    } else {
      return useBlankProfileURL()
    }
  } catch (e) {
    console.error(e)
  }
  return useBlankProfileURL()
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
  return false
}

// Returns the proxy vote if one exists or false
export async function useCheckProxyVote(hiveAccname) {
  if (!hiveAccname || !hiveAccname.match(useHiveAccountRegex)) {
    return null
  }

  const details = await useHiveDetails(hiveAccname)
  const proxy = details?.proxy

  if (proxy) {
    return proxy
  }
  return false
}

export async function useGetHiveWitnessVotes(hiveAccname, witness) {
  if (!hiveAccname || !hiveAccname.match(useHiveAccountRegex)) {
    return null
  }

  const params = {
    start: [witness, hiveAccname],
    limit: 1,
    order: "by_witness_account",
  }
  try {
    const response = await hiveTx.call(
      "database_api.list_witness_votes",
      params
    )
    if (response.result?.votes.length > 0) {
      if (
        response.result.votes[0].witness === witness &&
        response.result.votes[0].account === hiveAccname
      ) {
        return true
      }
    }
    return false
  } catch (error) {
    console.error("An error occurred while fetching witness votes:", error)
    return null
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
    // This removes the un-necessary double list structure
    return history.result.reverse().map((item) => item[1])

  } catch (error) {
    console.error({ error })
    return null
  }
}
