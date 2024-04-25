// useHive.js
//
// Functions related to Hive
// ----------------------------------------------------------------------------
import { apiURL, api, apiLogin } from "boot/axios"
import { Dark } from "quasar"
import { genRandAlphaNum } from "src/use/useUtils"
import "src/assets/hive-tx.min.js"

const useHiveAccountRegex =
  /^(?=.{3,16}$)[a-z]([0-9a-z]|[0-9a-z-](?=[0-9a-z])){2,}([.](?=[a-z][0-9a-z-][0-9a-z-])[a-z]([0-9a-z]|[0-9a-z-](?=[0-9a-z])){1,}){0,}$/

const baseURLBlockExplorer = "https://hivehub.dev/tx/"

export function useGenerateTxUrl(txId) {
  if (!txId) {
    return null
  }
  return `${baseURLBlockExplorer}${txId}`
}

/**
 * Retrieves Hive profile and details for a given Hive account name.
 *
 * @param {string} hiveAccname - The Hive account name.
 * @returns {Promise<Object|null>} - The Hive profile and details, or null if an error occurs.
 */
export async function useHiveDetails(hiveAccname) {
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

/**
 * Checks if a Hive account exists.
 *
 * @param {string} hiveAccname - The Hive account name to check.
 * @returns {Promise<Object>} - An object containing the result of the account existence check.
 * @property {boolean} exists - Indicates whether the account exists or not.
 * @property {boolean} valid - Indicates whether the account name is valid for new account or not.
 * @property {string|null} error - The error message if any error occurred during the check.
 */
export async function useHiveAccountExists(hiveAccname) {
  // Returns true if the Hive account exists
  // first char is not a-z
  console.log("Checking Hive account: ", hiveAccname)
  if (!hiveAccname[0].match(/[a-z]/)) {
    return {
      exists: false,
      valid: false,
      error: "Name must not start with a number",
      hiveAccname: hiveAccname,
    }
  }
  if (hiveAccname.length < 3 || hiveAccname.length > 16) {
    const errorText = hiveAccname.length < 3 ? "Too short" : "Too long"

    return {
      exists: false,
      valid: false,
      error: `${errorText}: 3 to 16 chars`,
      hiveAccname: hiveAccname,
    }
  }
  if (!hiveAccname?.match(useHiveAccountRegex)) {
    return { exists: false, valid: false, error: "Invalid Hive account name" }
  }
  try {
    const res = await hiveTx.call("condenser_api.get_accounts", [[hiveAccname]])
    if (res.result.length > 0) {
      return {
        exists: true,
        valid: false,
        error: "Account Name taken",
        hiveAccname: hiveAccname,
      }
    }
    return {
      exists: false,
      valid: true,
      error: "Available Account Name",
      hiveAccname: hiveAccname,
    }
  } catch (e) {
    return { exists: false, valid: null, error: e, hiveAccname: hiveAccname }
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
    return "/avatars/hive_logo_dark.svg"
  } else {
    return "/avatars/hive_logo_light.svg"
  }
}

export function useHiveAvatarURL({
  hiveAccname,
  size = "medium",
  reason = "v4vapp-v2-useHiveAvatarURL",
}) {
  // Uses the Hive.blog image service to get the avatar for a Hive account
  // Returns null if the hiveAccname is blank or not a valid name.
  console.log("useHiveAvatarURL", hiveAccname, size, reason)
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
/**
 * Extracts the profile from the posting_json_metadata field or if that doesn't exist checks the profile.
 * @param {object} data - The data object containing the posting_json_metadata and json_metadata fields.
 * @returns {object|null} - The extracted profile object or null if not found.
 */
async function extractProfile(data) {
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
/**
 * Searches through Hive for accounts matching a pattern and returns them sorted by reputation.
 * If there is an exact match in the list, it will be the first item.
 * @param {string} val - The pattern to search for.
 * @param {number} [maxAcc=6] - The maximum number of accounts to return.
 * @returns {Promise<Array<string>>} - The sorted accounts.
 */
export async function useLoadHiveAccountsReputation(val, maxAcc = 6) {
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
  limit = 100,
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
    if (!history.result) {
      return null
    }
    return history.result.reverse().map((item) => item[1])
  } catch (error) {
    console.error({ error })
    return null
  }
}

export function useGetHiveAmountString(amount, currency) {
  // Returns a string with the amount and currency
  // convert currency to uppercase
  currency = currency.toUpperCase()
  if (!["HIVE", "HBD"].includes(currency)) {
    return null
  }
  if (amount <= 0) {
    return null
  }
  return amount.toFixed(3) + " " + currency
}

export function useGetCheckCode() {
  // Returns a string with the amount and currency
  return "v4v-" + genRandAlphaNum(5)
}

/**
 * Generates a Hive transfer operation.
 *
 * @param {string} from - The sender's account name.
 * @param {string} to - The recipient's account name.
 * @param {number} amountToSend - The amount to transfer.
 * @param {string} currencyToSend - The currency of the transfer. (hbd or hive)
 * @param {string} memo - The memo for the transfer.
 * @param {string|null} checkCode - The check code for the transfer.
 * @returns {Array} - The Hive transfer operation.
 */
export function useGenerateHiveTransferOp(
  from,
  to,
  amountToSend,
  currencyToSend,
  memo,
  checkCode = null
) {
  // Returns a Hive transfer operation
  if (!from) {
    from = ""
  }
  if (!to) {
    return null
  }
  const amountString = useGetHiveAmountString(amountToSend, currencyToSend)
  if (checkCode) {
    memo = memo ? memo + " " + checkCode : checkCode
  }
  const op = [
    "transfer",
    {
      from: from,
      to: to,
      amount: amountString,
      memo: memo,
    },
  ]
  return op
}
