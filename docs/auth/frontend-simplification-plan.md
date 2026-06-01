# Frontend Simplification Plan – One Session, Multiple Users

**Date:** 2026-05-30
**Branch:** feat/simplify-multi-account-auth-model
**Goal:** Dramatically reduce frontend complexity by aligning with a new backend model where one browser session (one refresh cookie) can authorize multiple accounts.

## Current Pain

The frontend has accumulated significant defensive complexity because of the assumption "each login gets its own independent refresh token/cookie":

- `lastCookieRestore` tracking + anti-spam logic in `ensureAccessToken`
- Very strict per-user `accessTokens` map and header management
- `CRITICAL MISMATCH` guards in `updateSatsBalance`
- Repeated `ensureAccessToken` calls in many places (update, switchUser, initialize, scheduleUpdate, visibility recovery)
- Complex `currentReauthNeeded` + warning icon logic
- Lots of "cookie owner vs currentUser" special cases

This complexity causes bugs (wrong balance after resume/switch) and makes the code hard to reason about.

## New Target Model (Backend will support this)

- One browser session = one HttpOnly refresh cookie + one Redis session record.
- The session record has an `allowed_users` list (e.g. `["brianoflondon", "v4vapp-test", "v4vapp.dhf"]`).
- When a user successfully authenticates a new account while a valid refresh cookie is present, the backend **attaches** that username to the existing session's allowed list.
- The client can request a fresh short-lived access token for **any** user in the allowed list using the existing cookie.
- Revoking the session (or the cookie) invalidates everything for that browser session (acceptable per user's stated risk model).

## Frontend Simplification Goals

1. Treat the browser session as the primary unit.
2. Maintain a clear list of accounts that belong to the current browser session.
3. Make switching between accounts in the session lightweight and reliable.
4. Remove or greatly simplify all the "which cookie is active?" defensive code.
5. Make re-auth / adding a new account to the session explicit and clean.
6. Reduce the number of places that call `ensureAccessToken` / trigger refreshes.

## Proposed Architecture Changes (Frontend)

### 1. Store Changes (`storeUser.js`)

- Add `sessionAccounts: string[]` (or richer structure with `authMethod`, `lastAuthenticatedAt`, etc.).
- Keep `accessTokens: { [username]: token }` but it now represents "tokens we currently hold for accounts in this session".
- Remove or deprecate `lastCookieRestore`.
- Simplify `apiToken` getter: it can be "the best token we have for this user in the current session".
- `currentUser` still exists, but it must be one of the `sessionAccounts`.

### 2. Token Acquisition

- Rename / simplify `ensureAccessToken(hiveAccname)` → something like `ensureTokenForUser(hiveAccname)`.
- It should:
  - Check if we already have a fresh enough token for that user.
  - If not, call `/auth/refresh` (the cookie will be sent automatically).
  - The backend (future) will return a token for the requested user if they are in the session's allowed list.
- Remove the aggressive per-call `ensureAccessToken` from `update()`, `expireCheck()`, etc.
- Call it more deliberately: on switch, on explicit re-auth, and on a much less frequent background refresh.

### 3. User Switching

- `switchUser(hiveAccname)`:
  - If the account is not in `sessionAccounts`, treat it as "add this account to the session" → trigger normal login flow for it.
  - If it is in the session, just set `currentUser`, clear stale `currentKeepSats`, and ensure we have a token for it.
- Immediately clear `currentKeepSats` and `currentDetails` on switch (already partially done).

### 4. Adding Accounts to the Current Session

- When a normal login (passkey, keychain, etc.) succeeds **while a refresh cookie is present**, the frontend should record that the new account now belongs to the current browser session.
- The backend will do the actual attachment.

### 5. Re-auth / Session Recovery

- The `currentReauthNeeded` concept can be simplified.
- If we need a token for a user in the session but refresh fails (or the account is no longer in the allowed list on the backend), prompt the user to "re-add this account to the current browser session" using their normal login method (passkey, keychain, etc.).
- The warning icon on CreditCard should lead to this flow.

### 6. Cleanup Opportunities

- Remove or greatly reduce the "cookie owner vs currentUser" mismatch handling.
- Reduce the number of places that force `dataLoading = true`.
- Consider whether `accessTokens` needs to be quite so defensive once the backend model is aligned.
- The interceptor can become simpler (less need to decode and route around "wrong user" tokens).

## Implementation Order (Frontend First)

1. Add `sessionAccounts` concept + basic management.
2. Simplify `switchUser` and the token acquisition path.
3. Update `initialize()` to reconstruct `sessionAccounts` from persisted users (for now, treat all persisted users as part of the session on first load after the change).
4. Update login paths to add the newly logged-in account to `sessionAccounts`.
5. Clean up `ensureAccessToken` / token logic and reduce call sites.
6. Simplify the re-auth warning and `triggerReauth` logic.
7. Remove or comment out now-unnecessary defensive code (keep the critical mismatch guard as defense-in-depth for a while).
8. Test thoroughly on desktop + mobile PWA (background/resume, switching, multiple passkey accounts).

## Backend Alignment (to be done after frontend plan is implemented)

- Session record in Redis will contain `allowed_users`.
- `/auth/refresh` and token issuance paths will support requesting tokens for any allowed user in the session.
- Login paths (FIDO, keychain via validate, HAS, etc.) will support "attach to existing session" when a valid refresh cookie is present.
- Revocation / logout will be at session level (or support removing individual users from a session).

## Success Criteria

- Much less code in `storeUser.js` related to cookie ownership fights.
- Switching between accounts that are part of the same browser session is fast and reliable, even after background resume.
- Adding a new account to the session is an explicit, understandable action.
- The "wrong balance for the wrong user" class of bugs is dramatically reduced.
- Code is easier for future developers to understand.

---

This document will be updated as implementation progresses.