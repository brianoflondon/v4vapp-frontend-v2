# Upgrade plan: Quasar and Vue

## Completed — 2026-02-09 (PR #255)

### What was upgraded

| Package                    | Before                           | After  |
| -------------------------- | -------------------------------- | ------ |
| quasar                     | 2.17.5                           | 2.18.6 |
| @quasar/app-vite           | 1.11.0                           | 2.4.1  |
| vue                        | 3.5.13                           | 3.5.28 |
| vue-i18n                   | 9.14.2                           | 11.2.8 |
| @intlify/unplugin-vue-i18n | (was vite-plugin-vue-i18n 6.0.3) | 11.0.3 |
| vue-router                 | 4.5.0                            | 4.6.4  |
| pinia                      | 2.3.0                            | 2.3.1  |
| @vueuse/core               | 10.11.1                          | 12.8.2 |
| Node.js (min engine)       | 14/16/18                         | >=20   |

### Lessons learned

1. **Quasar 2.18 and @quasar/app-vite v1 are incompatible.** Quasar 2.18 uses `:has()`/`:is()` CSS selectors that require the Vite 5+ Sass toolchain in app-vite v2. They must be upgraded together.

2. **App-vite v2 assumes ESM.** Config files using CommonJS (`require`/`module.exports`) must be renamed to `.cjs`:
   - `quasar.config.js` → `quasar.config.cjs`
   - `postcss.config.js` → `postcss.config.cjs`
   - `.eslintrc.js` → `.eslintrc.cjs`

3. **App-vite v2 auto-loads .env files** for the app, so `build.env: require('dotenv').config().parsed` must be removed. However, `dotenv` must still be loaded at the top of `quasar.config.cjs` for config-time vars like `HTTPS`.

4. **workboxMode casing changed**: `generateSW` → `GenerateSW`.

5. **register-service-worker** is no longer bundled — must be installed as an explicit dependency.

6. **@intlify/vite-plugin-vue-i18n is deprecated** and incompatible with Vite 7. Replaced by `@intlify/unplugin-vue-i18n`, but only v11 works with Vite 7, which requires vue-i18n v11.

7. **vite** must be installed as a direct dev dependency for `@intlify/unplugin-vue-i18n` to resolve it (it's nested inside `@quasar/app-vite`).

8. **App-vite v2.4.1 bundles Vite 7**, which requires `crypto.hash()` — only available in Node 20.12+. Node 18 will crash.

### Deferred to follow-up PRs

- eslint 8→9 (requires flat config migration, significant effort)
- prettier 2→3 (reformats all code, noisy diff)
- workbox 6→7 (no peer warnings, app-vite v2 bundles its own)
- pinia 2→3 and vue-router 4→5 (new majors with breaking changes, review separately)
