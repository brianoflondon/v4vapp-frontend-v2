# Signup System Documentation

## Overview

The `/signup` route provides a self-service flow for users to create a new Hive blockchain account. The account creation is paid for with a Lightning Network invoice (sats). The frontend orchestrates a two-phase backend process:

1. **`POST /v2/v4vapp/account/create`** — reserves the desired Hive account name and returns a Lightning BOLT11 invoice.
2. **`POST /v2/v4vapp/account/create_complete`** — called only after the Lightning invoice has been confirmed as paid; supplies the master password and proof of payment so the backend can finalize account creation on Hive.

A separate polling endpoint (`/v2/v4vapp/check_invoice`) is used to detect payment without requiring the user to manually click "Paid".

The public backend OpenAPI docs for these account endpoints are available at:
**https://api.v4v.app/docs#/account**

---

## Route and Entry Points

| Location            | Details                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| Route               | `/signup`                                                                                              |
| Component           | [src/pages/SignUp.vue](/src/pages/SignUp.vue)                                                          |
| Core logic          | [src/components/hive/NewAccount.vue](/src/components/hive/NewAccount.vue)                              |
| Confirmation dialog | [src/components/hive/ConfirmNewAccount.vue](/src/components/hive/ConfirmNewAccount.vue)                |
| Cost helper         | `useNewAccountCost()` in [src/use/useV4vapp.js](/src/use/useV4vapp.js)                                 |
| Menu entry          | [src/components/SideMenu.vue](/src/components/SideMenu.vue) (visible to all users; also in admin menu) |

The page is always accessible; the backend may return `isOpen: false` via the cost endpoint to disable new signups.

---

## User Flow (4 Steps)

The UI presents a stepper (`StepNumbers`) with 4 stages:

1. **Pick Hive Name**
   - User enters desired `@accountname` (lowercased, validated client-side + server-side via `useHiveAccountExists`).
   - On valid unused name → advance to step 2 and auto-generate a master password.

2. **Download Keys**
   - Master password is generated (32 random alphanum chars via `genRandAlphaNum`).
   - All four key types (owner, active, posting, memo) are derived locally using `@hiveio/dhive` `PrivateKey.fromLogin`.
   - User must explicitly download or copy the keys file before the Pay button is enabled (checkbox "Confirm Download").

3. **Confirm Download**
   - Checkbox `downloadedKeys` must be checked → advances stepper to stage 4.

4. **Pay**
   - Shows cost summary (Hive amount + sats equivalent).
   - Below the charge line is a "Receive back" table showing small starter balances (Hive, HBD, and sats) that will be deposited directly into the newly created Hive account as part of the creation process.
   - Clicking the Pay button calls `requestInvoice()`.

After successful payment and `create_complete`, a final dialog (`ConfirmNewAccount`) shows the account name + master password again (last chance to save) plus a Keychain QR code.

---

## API Base and Clients

All signup-related calls use:

- Axios instance: `apiLogin` (baseURL = `https://api.v4v.app/` or `https://devapi.v4v.app/` or `http://localhost:1818/`)
- Prefix: `API_BASE = "/v2/v4vapp/"` (from [src/boot/axios.js](/src/boot/axios.js))
- Full paths therefore become:
  - `GET /v2/v4vapp/account/cost`
  - `POST /v2/v4vapp/account/create`
  - `POST /v2/v4vapp/check_invoice`
  - `POST /v2/v4vapp/account/create_complete`

`apiLogin` is also used for auth flows; it has a response interceptor that can perform silent refresh on 401/403 using the HttpOnly refresh cookie.

---

## API Endpoints Used by Signup

### 1. GET `/v2/v4vapp/account/cost`

**Purpose**: Returns the current price to create a new Hive account through this service, the service availability flag, and the starter balances that the _newly created account_ will receive upon successful creation.

This endpoint does **not** describe a refund to the payer. Instead it advertises a small "welcome" or "starter" bundle that is transferred into the brand-new Hive account (in liquid HIVE, HBD, and a few sats) as part of the on-chain account creation that happens inside the `create_complete` flow. This gives the new user a usable account immediately instead of a completely empty one.

**Called from**:

- `onMounted` in `NewAccount.vue` via `useNewAccountCost()`
- Also used to compute `isClosed = !newAccountCost.value?.isOpen` (when `isOpen` is false the entire signup UI shows a "Coming Soon" banner and disables the pay button).

**Response shape** (observed fields, example with current pricing):

```json
{
  "isOpen": true,
  "hive": 12,
  "sats": 45000,
  "hive_back": 0.001,
  "hbd_back": 0.01,
  "sats_back": 100
}
```

**Field descriptions**:

| Field       | Type    | Meaning                                                                                                                                                                                |
| ----------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isOpen`    | boolean | When `false`, new account creation is temporarily disabled by the operator.                                                                                                            |
| `hive`      | number  | The price charged for account creation, expressed in Hive (liquid HIVE). This is the primary displayed cost.                                                                           |
| `sats`      | number  | The equivalent Lightning price in satoshis. Used for the Lightning invoice and shown in parentheses on the pay button.                                                                 |
| `hive_back` | number  | Amount of liquid HIVE that will be transferred into the new account during creation (shown with 3 decimal places in the UI).                                                           |
| `hbd_back`  | number  | Amount of liquid HBD that will be transferred into the new account during creation (shown with 3 decimal places).                                                                      |
| `sats_back` | number  | Small amount of sats that will be sent to the new account (usually via an internal Lightning or conversion mechanism) as part of the same creation event. Displayed as a whole number. |

**UI presentation** (in the Pay section of the form):

A small table is rendered:

```
You will be charged:   12 Hive (45,000 sats)
Receive back:          0.001 Hive
                       0.010 HBD
                         100 sats
```

The translations for the labels are `you_will_be_charged` and `receive_back`.

These "receive back" values are funded by the service provider (v4vapp) from its own balances at the moment `account/create_complete` succeeds on the backend. They are not taken from the payment the user just made for the account creation service.

**When the amounts are actually sent**:

The starter balances are applied on the backend only after a successful `POST /v2/v4vapp/account/create_complete` call (i.e. after the Lightning invoice has been confirmed paid and the `r_preimage` proof has been accepted). The Hive account creation transaction(s) and the funding transfers happen server-side at that point. The frontend only receives a `{ success: true, accountName, masterPassword }` response; it does not perform the on-chain funding itself.

---

### 2. POST `/v2/v4vapp/account/create`

**Purpose**: First phase of account creation. The backend checks that the name is still available, reserves it (or rate-limits), and returns a Lightning invoice that must be paid to proceed.

**Request body** (from `requestInvoice()`):

```js
{
  accountName: string,   // e.g. "alice"
  appId: string,         // e.g. "v4vapp-2.7.1" (from useAppStr())
  clientId: string       // persistent per-browser UUID from storeUser.clientId
}
```

**Success response** (assigned to `paymentRequest`):

```js
{
  payment_request: "lnbc...",   // raw BOLT11 (frontend prefixes with "lightning:")
  payment_hash: "...",
  r_hash: "...",                // used for subsequent check_invoice calls
  expires_at: 1712345678,       // unix seconds
  amount: 12345                 // sats
}
```

**Frontend handling** (`requestInvoice` in NewAccount.vue:417):

- Retries on HTTP 429 (rate limit) with 5s backoff in a tight loop.
- On success: shows the payment dialog, starts `checkPayment(expiresAt)`.
- The QR code is rendered via `CreateQRCode` with the `lightning:` prefixed string.

**Rate limiting note**: The backend (and the OpenAPI docs) likely apply stricter limits on this endpoint because it can be used for name squatting.

---

### 3. POST `/v2/v4vapp/check_invoice`

**Purpose**: Poll to learn whether the Lightning invoice from `/account/create` has been paid.

**Request body**:

```js
{
  r_hash: string // from the /account/create response
}
```

**Response shape** (observed):

```js
{
  paid: boolean,
  expired: boolean,
  r_preimage: string,   // only present (or meaningful) once paid
  // possibly other fields such as amount, etc.
}
```

**Frontend polling** (`checkPayment` in NewAccount.vue:456):

- Called immediately after invoice is received.
- On `paid === true` → calls `handlePaid()`.
- On `expired === true` → calls `handleExpired()` (resets UI, allows retry).
- Otherwise: computes a progress bar from `expiresAt` and schedules another call in 1 second via `setTimeout`.
- A manual "Paid" button in the dialog also calls `checkPayment(false)` (skips the expiry timer path).

**Voucher bypass** (dev / admin path):

- If `voucher.value` is set (currently hidden in the template with `v-if="false"`), `handlePaid()` is triggered immediately without waiting for `paid`.

---

### 4. POST `/v2/v4vapp/account/create_complete`

**Purpose**: Second (final) phase. Called only after the frontend has proof that the invoice was paid. The backend verifies the preimage matches the payment hash, then actually creates the Hive account using the supplied master password and the keys derived from it.

**Request body** (from `handlePaid()`):

```js
{
  accountName: string,
  appId: string,
  clientId: string,
  masterPassword: string,     // the one generated in step 2
  r_preimage: string,         // from the successful check_invoice response
  payment_hash: string,       // from the original /account/create response
  r_hash: string,             // from the original /account/create response
  paymentVoucher?: string     // optional, only when using voucher path
}
```

**Success response** (observed checks in code):

```js
{
  success: true,
  accountName: string,     // echoed back
  masterPassword: string   // echoed back (for client-side verification)
}
```

**Frontend verification** (`handlePaid` in NewAccount.vue:549):

- Confirms `resp.data.masterPassword === masterPassword.value`
- Confirms `resp.data.accountName === accountName.value`
- Confirms `resp.data.success === true`
- On success: shows a positive notification and opens the `ConfirmNewAccount` dialog (`accountConfirm = true`).
- On failure: shows a negative notification.

The 429 retry loop (5s backoff) is also applied here.

After this call succeeds, the keys have already been derived locally (they were derived before payment), so the user is shown the final "save your keys" dialog.

**Important**: This is the step during which the backend actually creates the Hive account and transfers the starter balances (`hive_back`, `hbd_back`, `sats_back` advertised by the `/account/cost` endpoint) into the new account. The frontend does not see the individual funding transactions; it only observes the final `{ success: true }` result.

---

## Payment Dialog and UX Details

- Dialog is persistent (user cannot accidentally close it while an invoice is live).
- QR code is rendered with `CreateQRCode` component; the `hiveAccname="v4vapp.api"` is passed (probably for the "pay to" display).
- A linear progress bar counts down from 100% to 0 based on `expires_at`.
- Cost in sats is shown below the QR.
- Copy-to-clipboard button for the raw `lightning:...` string.
- Two exit paths:
  - "Cancel" → `handleCancel()` clears timers, resets state, allows name/password regeneration.
  - "Paid" (manual) → forces a `check_invoice` call.
- On expiry: resets to step 2 (user can re-use the same name or change it).

---

## Key Generation (Client-Side Only)

All private keys are generated in the browser using `@hiveio/dhive`:

```js
const ownerKey = PrivateKey.fromLogin(accountName, masterPassword, "owner")
const activeKey = PrivateKey.fromLogin(accountName, masterPassword, "active")
const postingKey = PrivateKey.fromLogin(accountName, masterPassword, "posting")
const memoKey = PrivateKey.fromLogin(accountName, masterPassword, "memo")
```

The `keys` object (with public + private + keychain format) is only used after successful `create_complete` to:

- Pre-fill the final `ConfirmNewAccount` dialog
- Generate a `keychain://add_account=...` deep link QR code
- Allow download/copy of a plain-text key backup file

The master password itself is **never sent** until `create_complete`, and even then it is sent together with cryptographic proof of payment (`r_preimage`).

---

## State Machine Summary (Simplified)

```
name valid + keys generated
        │
        ▼
downloadedKeys checked
        │
        ▼
requestInvoice() ──► POST /account/create
        │                │
        │                ▼
        │            show QR + start polling
        │                │
        ▼                ▼
handleCancel()      checkPayment() loop
   (reset)              │
                        ├── paid? ──► handlePaid()
                        │               │
                        │               ▼
                        │           POST /account/create_complete
                        │               │
                        │               └── success? ──► accountConfirm dialog
                        │
                        └── expired? ──► handleExpired() (reset to step 2)
```

---

## Error / Edge Case Handling

| Situation                                        | Behavior                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Name already exists or invalid                   | `nameCheck` false, error message shown, Pay button disabled                             |
| 429 from `/account/create` or `/create_complete` | 5s sleep + retry loop (infinite until non-429)                                          |
| Invoice expires                                  | Dialog resets; user can try again with same or different name                           |
| Payment detected but `create_complete` fails     | Negative notification; keys are still available in memory if user retries               |
| User closes tab mid-flow                         | No server-side cleanup guaranteed; name reservation will eventually time out on backend |
| Voucher field (hidden)                           | Bypasses Lightning payment entirely if populated                                        |

---

## Related Constants and Helpers

| Symbol                | Source                        | Purpose                                                         |
| --------------------- | ----------------------------- | --------------------------------------------------------------- |
| `API_BASE`            | `src/boot/axios.js:63`        | `"/v2/v4vapp/"`                                                 |
| `apiLogin`            | `src/boot/axios.js`           | Axios instance pointed at `https://api.v4v.app/` (or dev/local) |
| `useAppStr()`         | `src/use/useAppDetails.js:19` | Returns e.g. `"v4vapp-2.7.1"` for `appId`                       |
| `storeUser.clientId`  | `src/stores/storeUser.js:183` | Persistent browser UUID (via `generateUUID()`)                  |
| `useNewAccountCost()` | `src/use/useV4vapp.js:378`    | Thin wrapper around `GET ${API_BASE}account/cost`               |
| `tidyNumber()`        | `src/use/useUtils.js`         | Number formatting for cost display                              |
| `genRandAlphaNum(32)` | `src/use/useUtils.js`         | Master password generator                                       |

---

## Mapping to Backend OpenAPI (https://api.v4v.app/docs#/account)

The frontend calls map to the backend router group under `/account` (and the standalone `check_invoice` path):

- `GET /v2/v4vapp/account/cost` — returns pricing (`hive`, `sats`), the `isOpen` flag, and the starter balances (`hive_back`, `hbd_back`, `sats_back`) that the new account will be funded with upon creation. This is the endpoint that drives the cost table and "Receive back" lines in the signup UI.
- `POST /v2/v4vapp/account/create` — the "create invoice / reserve name" operation.
- `POST /v2/v4vapp/account/create_complete` — the "verify payment + create Hive account" operation.
- `POST /v2/v4vapp/check_invoice` — generic Lightning invoice status checker (used by signup and possibly other flows).

When viewing the auto-generated docs, look for the `account` tag and the models for the request bodies containing `accountName`, `clientId`, `appId`, `masterPassword`, `r_preimage`, etc.

---

## Security / Trust Notes

- Private keys are generated locally and **never leave the device** until the user explicitly imports them into Keychain or another wallet.
- The backend never sees the master password until the user has already paid (and even then only together with a Lightning preimage that proves payment).
- The `clientId` + `appId` are sent on both create calls; they are primarily for rate limiting, analytics, and anti-abuse rather than security of the account itself.
- The final account on Hive is controlled solely by the keys derived from the master password the user chose / downloaded. V4V.app does not retain any keys.
- The small starter balances shown in "Receive back" (`hive_back` / `hbd_back` / `sats_back`) are provided by the v4vapp service from its own treasury at creation time. They are independent of (and not subtracted from) the Lightning payment the user made to purchase the account creation service.
- For a highly security concious user, you should create new keys and change the keys of the account immediately after creation. It would be possible for [v4v.app](https://v4v.app/) to store the master password (we don't) but immediately changing the keys after creation would mitigate that risk. The master password is only used as a seed to generate the keys; the keys themselves are what control the account on Hive.

---

_Document generated from code review of the `document-signup` worktree (frontend v2)._
