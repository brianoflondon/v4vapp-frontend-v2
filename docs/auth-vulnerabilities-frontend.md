# Frontend Vulnerabilities - Authentication System

**Repo**: `v4vapp-frontend-v2`  
**Related Backend Audit**: See `auth-security-audit.md` and the backend vulnerabilities document.

This document lists vulnerabilities primarily located in the frontend codebase.

---

## High Risk

### 1. JWTs Stored in localStorage (XSS Exposure)

- **Location**: `src/stores/storeUser.js` (HiveUser class + Pinia store using `@vueuse/core` `useStorage`)
- **Description**: The full bearer JWT (`apiToken`) is persisted in browser localStorage. Any successful XSS attack (malicious extension, supply-chain compromise in node_modules, or injected script) immediately gives an attacker a valid long-lived token for the API.
- **Impact**: Full account compromise on the API side (can perform any action the user is authorized for).

### 2. Insecure `clientId` Generation

- **Location**: `src/use/useUtils.js` (`generateUUID()` function)
- **Description**: The `clientId` used in the challenge-response flow is generated using `Math.random()` (classic non-cryptographic UUID pattern). It is also persisted forever in localStorage.
- **Impact**: Weakens the binding between the challenge request and the signed response. Predictable or low-entropy client IDs reduce the security of the login flow.

### 3. Long-lived, Weakly Bound `clientId`

- **Location**: `src/stores/storeUser.js` (state: `clientId: useStorage("clientId", generateUUID())`)
- **Description**: The client ID is generated once per browser profile and never rotated. It is sent with every login attempt and challenge request.
- **Impact**: Combined with the insecure generation above, this makes client binding less effective over time.

---

## Medium Risk

### 4. Code Bug in Error Handling (`useValidateApi`)

- **Location**: `src/use/useUtils.js` lines ~359-366
- **Description**: In the catch block of `useValidateApi`, the code references an undefined variable `validate`:
  ```js
  if (validate.status === 422) { ... }
  ```
- **Impact**: Potential runtime error during failed login attempts, which could mask real authentication failures or cause poor UX/error reporting.

---

## Low / Informational

- No other major frontend-only low-severity auth issues identified at this time.

---

**Recommendations (Frontend)**

- Move the API JWT out of localStorage into a more secure mechanism (short-lived in-memory token + HttpOnly refresh cookie, or at minimum document the XSS risk heavily).
- Replace `generateUUID()` with `crypto.randomUUID()` (or a proper CSPRNG-based implementation).
- Consider rotating or scoping the `clientId` (e.g., per-session or with additional entropy).
- Fix the undefined `validate` reference in `useValidateApi`.

---

*Extracted from the full authentication security audit (April 2026).*