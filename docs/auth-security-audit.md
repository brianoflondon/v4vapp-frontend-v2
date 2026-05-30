# Security Audit Report: Login/Authentication System

**Between** `v4vapp-frontend-v2` and `v4vapp-api-ext`

**Scope**: Login flows between `v4vapp-frontend-v2` (Quasar/Vue SPA) and `v4vapp-api-ext` (FastAPI backend), focusing on challenge-response "local signing" (primarily Hive Keychain, plus EVM, BTC, Nostr) that results in a JWT ("JWOT") from the backend. FIDO2/WebAuthn passkey flow was reviewed for consistency.

**Date of audit**: April 2026 (based on current codebase state)

---

## Auth Flow Summary (Hive Keychain Primary Path)

1. **Frontend** (`useKeychain.js` + `HiveLogin.vue`): Generates/persists a `clientId` (UUID), calls `GET /auth/{hiveAccname}?clientId=...&appId=...&scope=hive:active`.
2. **Backend** (`auth_routers.py`): Creates a `Challenge` (3 random BIP39 English words + account + unix timestamp + clientId + appId). Stores full `User` object (with challenge) in Redis under the username key, TTL 600s.
3. **Frontend**: Shows the exact challenge string to the user, calls Hive Keychain `requestSignBuffer(username, message=challenge, keyType)` (usually "Active").
4. **Frontend** sends the full `KeychainSignedMessage` (echoed challenge in `data.message`, hex signature in `result`, `publicKey`, etc.) to `POST /auth/validate/?clientId=...`.
5. **Backend** (`auth_helpers.py`):
   - Matches clientId.
   - Verifies signature using `nectargraphenebase.ecdsasig.verify_message` + pubkey reconstruction.
   - Re-fetches the account's current keys from live Hive blockchain (`nectar.account.Account`) to confirm the pubkey is authorized for the requested scope (posting/active).
   - Enforces `SIGNATURE_TIMEOUT = 300s`.
   - On success: deletes the Redis challenge entry, issues HS256 JWT via `python-jose`.
6. **Frontend** stores the JWT in Pinia persisted store (`useStorage` → localStorage) and sets it on the `apiLogin` axios instance.
7. **Subsequent requests**: `get_current_user` verifies JWT, runs `secondary_verification` (re-checks pubkey on chain with 2h Redis cache + CF country header match), checks `BAD_TOKEN_LIST` (hash-based) and `BAD_USER_LIST`.

Similar patterns exist for EVM (`eth_account` + `encode_defunct`), BTC (`btclib.ecc.bms`), Nostr, and FIDO2 (separate `/authenticate/begin` + `/complete` endpoints that also end up calling `get_token`).

---

## Key Positive Security Properties

- **Private keys never leave the device** — excellent design for a crypto app. All cryptographic operations (Hive secp256k1, WebAuthn, EVM personal_sign, BTC) happen locally via Keychain/wallet.
- Strong post-issuance validation: every protected request re-verifies the Hive pubkey against the *current* blockchain state. If the user rotates/removes the key, existing tokens quickly become useless (within cache window).
- Short-lived challenges + server-side single-use enforcement (Redis delete on success) + clientId binding + timestamp.
- Reasonable scope system (`hive:posting`, `hive:active`, etc.) and `has_scope` checks.
- FIDO2 flow re-uses the same token issuance and verification machinery.

---

## Security Findings (Ranked by Risk)

### High Risk

1. **Long-lived JWTs with extremely weak revocation (High)**  
   Default `ACCESS_TOKEN_EXPIRE_DAYS=30` (configurable up to 365). No `jti` (JWT ID), no server-side session store, no refresh token mechanism. Revocation is only via a tiny manual `BAD_TOKEN_LIST` of payload hashes in source code. An attacker who obtains a valid token (see #2) has 30+ days of access.

2. **JWTs persisted in localStorage (High)**  
   The full bearer token lives in `storeUser.users[...].apiToken` via `@vueuse/core` `useStorage` (localStorage). Any XSS vulnerability in the SPA (or a malicious browser extension) immediately gives the attacker a valid long-lived API token. This token can be used from anywhere to perform actions on behalf of the user (invoices, keepsats transfers, etc. within the token's scope).

3. **Insecure `clientId` generation (High)**  
   `generateUUID()` in `useUtils.js` uses `Math.random()` (not `crypto.getRandomValues` or `crypto.randomUUID`). This is a classic non-cryptographic UUID. While not trivial to exploit due to other binding factors, it weakens the clientId as a security binding mechanism for challenges.

4. **Overly permissive CORS (High/Medium)**  
   `CORSMiddleware` with `allow_origins=["*"]`, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`. Combined with long-lived tokens, this increases the attack surface for cross-origin authenticated requests if other frontend vulns exist.

5. **Critical secret not in example configuration (High)**  
   `AUTHENTICATION_APP_KEY` (the HS256 JWT signing key) defaults to `"No ENV found"` in `config.py` and is absent from `example.env`. New deployments or misconfigured environments could silently use a weak/known key. The same value is also read in the (deprecated) `auth_fastapi_docs.py`.

### Medium Risk

- **Insufficient rate limiting on auth endpoints (Medium)**: `/auth/*` and `/authenticate/*` paths use the "high" bucket (50 burst / 200 per minute). No dedicated strict limits or account-based throttling for login attempts. This enables enumeration and online brute-force of accounts or rapid challenge generation.
- **Replay / race window on challenges (Medium)**: A captured signed challenge response is single-use only because the Redis entry is deleted on success. However, there is a ~5-minute window, no distributed locking, and deletion happens after several network/chain checks. Concurrent logins for the same account or Redis failures could theoretically allow limited replay.
- **ClientId is long-lived and not strongly bound**: The UUID is generated once per browser and stored forever. No rotation, no origin binding, no device fingerprinting.
- **Secondary verification pubkey cache (Medium)**: 2-hour Redis cache on `verify_hive_pubkey`. A key that was just removed/rotated from the Hive account can still be used for up to ~2 hours.
- **Cross-method dispatch relies on username parsing**: `AccountNameModel` decides Hive vs EVM vs BTC. The `hive_accname` property on `KeychainSignedMessage` is a misnomer for non-Hive flows. While currently separated, this is fragile.
- **BTC message signing verification assumptions**: Uses raw `bms.verify` on the exact challenge string. Sats Connect `signMessage` behavior (prefixing, etc.) must exactly match what btclib expects; mismatches here could be a bypass or DoS vector.
- **Minor code bug**: In `useUtils.js:360`, the catch block references an undefined `validate` variable.

### Low / Informational

- `AUTHENTICATION_BYPASS` is defined in config but **never imported or used** anywhere (dead code).
- Deprecated `routers/auth_fastapi_docs.py` (fake users DB) remains in the source tree.
- Challenges are logged at INFO level (contains account + clientId + timestamp — low sensitivity but unnecessary).
- No pinning or multi-node consensus for the Hive RPC calls used in pubkey verification (`nectar` library).
- No explicit enforcement that the key type used in signing (`data.key` in Keychain response) matches the requested `scope` in all code paths (chain verification is the real backstop).
- FIDO2 and challenge flows both key Redis state under the bare username — potential for subtle interference if a user rapidly mixes login methods.

---

## Recommendations (Prioritized)

### Immediate (High impact, low effort)

1. Move `AUTHENTICATION_APP_KEY` into `example.env` with a strong generation comment (`openssl rand -hex 32`).
2. Replace `generateUUID()` with `crypto.randomUUID()` (or a proper CSPRNG implementation) for `clientId`.
3. Add `jti` (UUID) to `TokenData`, store issued `jti`s (or a revocation list) in Redis, and check it on every token validation. Expose an admin endpoint to revoke by `jti` or username.
4. Shorten default token lifetime significantly (e.g., 7–14 days) and/or implement refresh tokens.
5. Add dedicated low/strict rate limits (or per-account rate limits) for all `/auth/*` and `/authenticate/*` paths.

### Short term

- Consider moving the long-lived JWT out of localStorage into a short-lived in-memory + HttpOnly cookie (or at least document the XSS risk prominently and harden the app against injection).
- Tighten CORS to an explicit allowlist of known frontends (including any static hosting domains) instead of `"*"`.
- Add origin/referrer checks or stronger binding for `clientId` where possible.
- Audit and remove the dead `AUTHENTICATION_BYPASS` and deprecated auth docs file.
- Add tests that explicitly attempt cross-type signature confusion (Hive sig as EVM, etc.).

### Longer term / Architecture

- Evaluate adding short-lived "session" tokens + refresh for the SPA instead of one very long-lived bearer token.
- Consider adding device/session metadata (user-agent hash, approximate geo, etc.) into the JWT and secondary verification.
- For high-value actions (large keepsats transfers), require re-authentication or FIDO2 even with a valid token.

---

## Overall Assessment

This is a **reasonably well-designed decentralized authentication system** for a crypto/Hive application. The core principle (never send private keys to the server) is sound, and the continuous blockchain re-validation of keys is a strong control.

The biggest practical risks are not in the cryptography or challenge-response protocol itself, but in the **long token lifetime + client-side storage model** combined with a very permissive deployment posture (CORS, missing secret hygiene, weak clientId entropy). These are classic SPA + JWT pitfalls.

If the application is hardened against XSS, the secret is properly managed, and rate limiting/revocation are improved, the system is in good shape for its threat model.

---

**Audit performed by**: Grok (xAI)  
**Files reviewed** (key paths):
- `src/use/useKeychain.js`
- `src/use/useUtils.js`
- `src/stores/storeUser.js`
- `src/boot/axios.js`
- `src/components/HiveLogin.vue`
- `src/use/usePasskeys.js`
- Backend: `src/v4vapp_api_ext/auth/` (routers, models, helpers)
- Backend: `src/v4vapp_api_ext/fido/fido_routers.py`
- Backend: `main.py` (middleware, CORS)
- `config.py`
- Various test files and examples

---

*End of report*