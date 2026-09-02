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

9. **Never delete `package-lock.json` when upgrading packages.** Deleting the lockfile and running `npm install` fresh can resolve different sub-dependency versions (especially Vite internals) that break Node.js polyfilling for browser code. Libraries like `hive-tx.min.js` and `bolt11.min.js` depend on Node.js built-ins (`Buffer`, `util`, `stream`) being available — a regenerated lockfile can silently change how Vite handles these. Always use incremental `npm install` or `--legacy-peer-deps` to work around peer dependency conflicts while preserving the lockfile.

10. **`eslint-plugin-vue@10` requires `vue-eslint-parser` and `typescript` as peer dependencies.** When using `--legacy-peer-deps`, these must be installed explicitly since automatic peer dep installation is skipped.

### Deferred to follow-up PRs

- ~~eslint 8→9 (requires flat config migration, significant effort)~~ Done in PR #257
- ~~prettier 2→3 (reformats all code, noisy diff)~~ Done in PR #256
- ~~workbox 6→7 (no peer warnings, app-vite v2 bundles its own)~~ Done with app-vite v3 (moved under `/src-pwa`)
- ~~pinia 2→3 and vue-router 4→5 (new majors with breaking changes, review separately)~~ Already on pinia 4 and vue-router 5 before this upgrade

---

## Completed — 2026-09-02 (Quasar 2.28 + @quasar/app-vite v3)

### What was upgraded

| Package                    | Before  | After  |
| -------------------------- | ------- | ------ |
| quasar                     | 2.23.3  | 2.28.0 |
| @quasar/app-vite           | 2.4.1   | 3.8.1  |
| @quasar/cli                | 5.0.4   | 5.0.7  |
| @quasar/extras             | ^2.0.2  | ^2.0.4 |
| vite                       | ^7.3.2  | ^8.2.1 |
| workbox-*                  | ^6.6.0  | ^7.4.1 (now in `/src-pwa`) |
| Node.js (min engine)       | >=20    | >=22   |

### Notable migration steps (app-vite v2 → v3)

1. **`quasar.config.cjs` is no longer supported.** Converted to ESM `quasar.config.js` using `defineConfig` from `#q-app`.
2. **`process.env` → `import.meta.env`** in app/PWA code. Quasar-supplied flags are now `QUASAR_*` (`QUASAR_PROD`, `QUASAR_SERVER`, `QUASAR_SERVICE_WORKER_FILE`, …).
3. **Wrappers** import from `#q-app` instead of `quasar/wrappers`, and were renamed: `boot` → `defineBoot`, `route` → `defineRouter`, `store` → `defineStore`.
4. **Old path aliases** (`src/`, `boot/`, `components/`, …) were removed by Quasar. Re-injected via `build.alias` so existing imports keep working; `@/` is also available.
5. **Client env prefix** defaults to `QCLI_`. Set `build.env.clientPrefix` to also expose `VUE_APP_*`.
6. **PWA deps** (`register-service-worker`, workbox 7) live in `/src-pwa/package.json` with an isolated `pnpm-workspace.yaml`.
7. **`vueOptionsAPI` is false by default.** Left `true` because third-party Vue components may still use Options API.
8. **Build target** is now `baseline-widely-available` / `node22` (Quasar 2.28 floor: Chrome/Edge 121, Firefox 123, Safari 17.2).
9. **Removed pinned esbuild/lightningcss overrides** that would conflict with Vite 8 / Rolldown. Kept `sass-embedded → sass` for macOS 13.
10. **`package.json` is `"type": "module"`.** Config-time `HTTPS` still comes from Node `process.env` in `quasar.config.js` (dotenv files are auto-loaded).
11. **Vite 8 does not polyfill Node globals.** `hive-auth-wrapper` (via `assert`/`util`) crashes in `quasar dev` with `process is not defined` unless `vite-plugin-node-polyfills` is installed. A first boot file (`src/boot/node-polyfills.js`) also assigns `process`/`Buffer` on `globalThis` before any route loads, because ESM import hoisting can evaluate `util` before an in-bundle assignment runs. Also define `process.env.NODE_ENV` as a string (Vite 8 `define` no longer accepts a raw object for `process.env`). Restart `quasar dev` after this change so the Vite optimize-deps cache is rebuilt.

### Still deferred

- eslint 9 → 10 (9.x is already deprecated; 10 is a new major)
- TypeScript 5 → 7 (this repo is JS-first; no urgent need)
- `@github/webauthn-json` is deprecated in favor of native WebAuthn JSON methods
