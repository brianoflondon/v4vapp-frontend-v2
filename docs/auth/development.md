# Frontend Development Guide – Auth System

This document covers practical information for working on the authentication-related parts of the frontend.

## Verbose Auth Debug Logging

The frontend contains many `[AUTH-DEBUG]` log statements to help trace the hardened auth flow (silent refresh, multi-user attach, token storage, etc.).

By default, most of these are **suppressed** so they don't spam the console during normal development.

### How to Enable Verbose Logging

In the browser console, run:

```js
localStorage.setItem('verboseAuthDebug', '1')
```

Then **hard refresh** the page (Ctrl/Cmd + Shift + R).

To turn it off again:

```js
localStorage.setItem('verboseAuthDebug', '0')
```

There is also a convenience helper available in development:

```js
toggleAuthDebug()
```

### What Gets Logged

- When `verboseAuthDebug` is **enabled**: All `authDebug(...)` calls (most of the previous `[AUTH-DEBUG]` noise) will appear.
- `authWarn(...)` and `authError(...)` are **always** visible, regardless of the flag. These are used for actual problems and important state changes.

### Implementation

The helpers live in:

```
src/utils/authDebug.js
```

They are controlled by:
- `import.meta.env.DEV` (only active in development)
- The `verboseAuthDebug` localStorage key

## Cookie Behavior in Local Development

When running the frontend against a local backend over plain HTTP (`http://localhost`), you will typically need these settings in your local environment:

```env
SECURE_COOKIES=false
REFRESH_COOKIE_SAMESITE=lax
# REFRESH_COOKIE_DOMAIN=   (usually leave empty or commented for pure localhost)
```

**Important**: `SameSite=none` requires `Secure`. You cannot use `SameSite=none` over plain HTTP — the browser will reject the cookie. This is why local development usually uses `lax` + `SECURE_COOKIES=false`.

For cross-subdomain development (e.g. `dev.v4v.app` frontend talking to `devapi.v4v.app`), you will need:
- Proper HTTPS (even self-signed)
- `SECURE_COOKIES=true`
- `REFRESH_COOKIE_SAMESITE=none`
- `REFRESH_COOKIE_DOMAIN=.v4v.app` (or appropriate domain)

## Related Backend Documentation

For the server-side side of local development (environment variables, Redis setup, cookie settings behavior, etc.), see the backend documentation:

- [Backend Development Guide](https://github.com/brianoflondon/v4vapp-api-ext/blob/auth-refresh/docs/auth/development.md)

## Common Issues

### Refresh cookie not being sent

- Check `SECURE_COOKIES` vs whether you're on HTTP or HTTPS.
- Check `SameSite` value.
- Verify the cookie is visible in DevTools → Application → Cookies (it should be `HttpOnly`).
- Make sure `withCredentials: true` is set on the relevant axios instance (especially `apiLogin`).

### Too much noise in the console

Use the `verboseAuthDebug` flag (see above). Most routine auth flow logs are now hidden by default.

### Multi-account / attach not working locally

Make sure the backend has the latest attach logic and that you're using a recent build of the frontend that includes the attach success paths in both Keychain and FIDO flows.

---

**Last updated**: 2026-05-31 (as part of auth hardening + logging cleanup work)