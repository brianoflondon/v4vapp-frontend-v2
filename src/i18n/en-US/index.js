export default {
  // General
  loading: "Loading ...",
  error: "Error",
  paste: "Paste",
  required: "Required",
  ok: "OK",
  cancel: "Cancel",
  characters: "characters",
  hours: "hours",
  minutes: "minutes",
  seconds: "seconds",
  fee: "fee",
  vote: "Vote",
  please: "Please",
  and: "and",
  witness: "My Hive Witness",
  prices_fetched: "Prices fetched",
  from: "from",
  to: "to",
  local_currency: "Local Currency",
  currency: "Currency",
  confirm: "Confirm",
  yes: "Yes",
  no: "No",
  all: "All",
  keepsats: "KeepSats",
  // Dark Mode Selector
  change_light: "Change to light mode",
  change_dark: "Change to dark mode",
  // Keychain
  keychain_installed: "Keychain is Installed",
  keychain_missing: "Keychain is Missing",
  scan_for_keychain: "Keychain/Ecency",
  // IndexPage
  index_page_message: "For more information about this project, please visit",
  // Selector
  hive_account: "Hive Account",
  // Lightning Page
  lightning: "Lightning",
  hive: "Hive",
  transfer: "Transfer",
  not_found: "Not found",
  lightning_failed: "Lightning payment failed",
  Progress: "Progress",
  private_memo: "Use a Private Hive Transfer Memo (needs a Memo key)",
  // Login
  keychain_not_installed: "Keychain is not installed",
  enter_hive_account: "Please enter you Hive Account name",
  hive_login: "Hive Login",
  login: "Login",
  login_as: "Login as",
  login_with: "Login with",
  hive_keychain: "Hive Keychain",
  login_in_progress: "Login in progress",
  login_failed: "Login failed",
  login_success: "Login success",
  sign_this: "Sign this",
  matches: "matches",
  logout: "Logout",
  logout_all: "Logout All",
  // Passkeys:
  passkey: "Passkey",
  used: "Used",
  unused: "Unused",
  add: "Add",
  manage: "Manage",
  confirm_delete: "Confirm Delete",
  confirm_edit: "Confirm edit",
  name: "Name",
  add_new_key: "Add a new Passkey",
  name_required: "Device Name is required",
  // Get Hive
  amount: "Amount",
  copy: "Copy",
  copy_qrcode: "Click to copy QR code to clipboard",
  pay: "Pay",
  pay_tooltip: "Pay this invoice with installed Lighting app",
  copied: "Copied to clipboard",
  download: "Download",
  download_tooltip: "Download QR code as a file",
  downloading_qrcode: "Downloading QR code",
  // SideMenu
  map: "Map",
  page: "Page",
  home: "Home",
  status: "Status",
  // Status Page
  status_page_message:
    "Status page is under construction, in the meantime please visit Hive.",
  // Pricebar
  sats: "satoshis (1/1000,000,000 BTC)",
  failure: "Failure",
  working: "Working",
  keychain_installed: "Keychain is Installed",
  keychain_missing: "Keychain is Missing",
  reload_prices: "Reload Prices",
  // Invoice
  invoice: "Invoice",
  expires: "expires",
  Expires: "Expires",
  enter_invoice: "lnbc...., Lightning Address or Hive Name",
  valid_invoice: "Invoice decoded",
  valid_lightning_address: "Address decoded",
  invalid_invoice: "Invalid invoice or Lightning Address",
  invoice_too_low: "Invoice is below minimum payment",
  invoice_too_high: "Invoice is above maximum payment",
  invoice_expired: "Invoice has expired",
  self_payment: "Can't send to v4v.app",
  invoice_hint: "Paste an invoice, scan a QR code or a Hive Account name.",
  waiting_for: "Waiting for reply transaction to appear on Hive blockchain",
  payment_sent_hive_keychain: "Payment sent by Hive Keychain",
  check_lightning: "Check your Lightning wallet, payment has been sent",
  invoice_provider_not_working:
    "Lightning Invoice provider is not working right now, try later or check the address",
  requesting: "Requesting",
  // HAS Process
  logged_in_as: "Logged in as",
  open_HAS_auth: "Please open your HAS app and authorize the transaction.",
  open_HAS: "Open your HAS app",
  which_account: "Which account do you want to use?",
  rejected_payment: "Payment rejected by user on HAS",
  // Please vote
  voting_as: "Voting as",
  vote_for_proposal: "Vote DHF for proposal",
  please_vote:
    "If you're using V4V.app and find it useful, please consider voting for both my proposal for ongoing maintenance and my witness. This really helps me keep the service operating. Thank you!",
  thank_you_for_voting: "Thank you for voting!",
  vote_witness: "Vote for my Hive Witness",
  vote_proposal: "Vote for my DHF Proposal",
  thank_you: "Thank you for voting already!",
  // Tab Bar
  send: "Send",
  receive: "Receive",
  podcasts: "Podcasts",
  pods: "Pods",
  // Ask Details dialog
  send_to_hive: "Send to Hive",
  send_to_lightning: "Send to Lightning",
  asking_details: "You are about to pay:",
  making_invoice: "You are about to create an invoice for:",
  amount_to_send: "Amount to send",
  too_low: "Amount too low",
  too_high: "Amount too high",
  comment: "Comment",
  comment_length: "Comment is too long",
  // HAS Details Page
  resend_transaction: "Retry HAS transaction",
  payment_sent: "HAS Payment Sent",
  // Camera
  NotAllowedError: "You need to grant camera access permission",
  NotSupportedError: "No camera found on this device",
  NotReadableError: "Is the camera already in use?",
  OverconstrainedError: "Installed cameras are not suitable",
  StreamApiNotSupportedError: "Stream API is not supported in this browser",
  InsecureContextError: "Secure secure context required (HTTPS, localhost)",
  OtherError: "Unknown camera error",
  // Explanation Box
  explanation_title: "What is this site?",
  explanation_text: `v4v.app acts like a Bitcoin Lightning Wallet for Hive.\n
  Using the Hive or Hive Backed Dollars (HBD) you have in your Hive account, you can pay any Lightning invoice or send BTC sats to any Lightning Address.\n
  The 'Send' tab allows you to pay any Lightning invoice or Lightning Address. In addition you can deposit sats to be stored as 'KeepSats' on v4v.app and use those to pay Lightning invoices or send to other Hive users. At any time you can convert the sats to Hive or HBD.\n
  The 'Receive' tab lets you request a Hive Payment (as a QR code for the payer) or a Lightning invoice BTC sats as Hive. This can act as a Point of Sale in a shop and let you collect payment instantly from people paying with Hive, HBD or Lightning.\n
  You can store a small amount of Sats on V4V.app: your KeepSats balance. This balance is shown on your credit card when logged in. It's the big number.\n`,
  keepsats_deposit_title: `How to get KeepSats on v4v.app`,
  keepsats_deposit_text: `To store KeepSats on v4v.app, there are two ways.:\n
  1. Deposit Hive or HBD and they will be converted and stored as a KeepSats balance\n
  2. Send Sats direct to the Lightning address shown on the Deposit tab which is just your Hive Account Name followed by @sats.v4v.app\n
  A fee is only applied when changing Hive or HBD into sats, depositing sats has no fee.`,
  keepsats_convert_title: `How to convert KeepSats to Hive`,
  keepsats_convert_text: `To convert KeepSats to Hive, select the amount of sats to convert with the slider and choose Hive or HBD, your sats will be deposited in Hive or HBD.\n
  A fee applies when converting sats to Hive or HBD.`,
  // Receive Page
  // Credit Card
  savings: "Savings",
  savings_tooltip:
    "Show the amounts stored in Hive's savings accounts for HBD and Hive",
  balance_changed: "KeepSats balance has changed by",
  // Transfer page
  sending: "Sending",
  // Point of Sale POS
  point_of_sale: "Point of Sale",
  charge: "Charge",
  set_rate: "Set Rate",
  market_rate: "Market Rate",
  sales: "Sales",
  history: "History",
  memo_pipe: 'Memo must NOT contain the "pipe" symbol: "|"',
  // as in charge a customer
  payment: "Payment",
  scan_to_send: "Scan this code to send",
  use: "Use",
  pay_to: "Pay to:",
  no_amount: "No amount entered",
  no_account: "No Hive account to send to",
  old_page: "Old Hive Page",
  new_page: "New Receive Hive Page",
  no_fees: "No Fees for Hive or HBD",
  Fees: "Fees",
  list_received_payments: "Received Payments",
  memo: "Memo",
  calculating_fees: "Calculating fees",
  // Transaction list
  date: "Date",
  paid: "Paid",
  pending: "Pending",
  date: "Date",
  paid_by: "Paid by",
  import_hive: "Import Hive",
  local_records: "Local Records",
  import_from_hive_tooltip: "Import all past sales from Hive",
  delete_local_records_tooltip: `Delete all local records. This will erase all pending payments, \n
    but successful payments can be re- imported from Hive with the \n
    Import Hive button`,
  delete_all_pending_message:
    "Are you sure you want to delete all pending sales?",
  delete_one_pending_message:
    "Are you sure you want to delete this pending sale?",
  export_to_csv: "Export to CSV",
  export_to_csv_tooltip:
    "Export all the currently displayed sales to a CSV file",
  // Hive to Lightning Transactions
  other: "Other",
  wallet: "Wallet",
  login_to_see_history: "Login to see your history",
  reason: "Reason",
  deposit: "Deposit",
  withdraw: "Withdraw",
  convert: "Convert",
  convert_sats_to_hive: "Convert sats to Hive",
  deposit_sats_on_v4vapp: "Deposit sats on v4v.app",
  convert_sats_from_v4vapp: "Convert sats to Hive",
  payment_failed: "Payment failed",

  // Loading messages
  new_content: "New content is available; please quit the app or refresh.",
}
