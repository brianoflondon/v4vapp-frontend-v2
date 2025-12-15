# Upgrade plan: Quasar and Vue

As of 2025-12-14

Snapshot (from package.json)
- Quasar: ^2.17.0
- Vue: ^3.3.8
- @quasar/app-vite: ^1.10.0

Latest on npm
- Quasar: 2.18.6  (delta: +1 minor, +6 patches)
- Vue: 3.5.25     (delta: +2 minors)
- @quasar/app-vite: 2.4.0 (delta: +1 major)
- vue-router: 4.6.4 (optional align)
- pinia: 3.0.4 (optional align)
- @vueuse/core: 14.1.0 (optional align)

Notes
- Quasar 2.18.x is a safe in-series upgrade from 2.17.x.
- @quasar/app-vite 2.x is a major CLI upgrade; expect small config changes and Vite 5+.
- Vue 3.3 → 3.5 is usually low risk; watch for stricter typings and minor behavior tweaks.

Recommended sequence (no actions taken yet)
1) Prep
- Create a feature branch and ensure Node 18+ locally and in CI.
- Run/record current behavior (dev, build, PWA flows) for comparison.

2) Step 1: Upgrade Quasar core to 2.18.x
```bash
npm i quasar@^2.18.6
npm run dev && npm run build
```
- Fix any minor styling/icon regressions if they surface.

3) Step 2: Upgrade Vue to 3.5.x
```bash
npm i vue@^3.5.25
npm run dev && npm run build
```
- <!-- gitleaks:allow --> Verify key flows: Keychain/HAS login, KeepSats fetch/transfer, QR scan, invoice parsing, POS routes.
- If peer warnings appear (i18n/router), plan upgrades in Step 5.

4) Step 3: Upgrade Quasar CLI (@quasar/app-vite) to 2.x
```bash
npm i -D @quasar/app-vite@^2
npm run dev && npm run build
```
- Address any warnings in `quasar.config.js` (devServer, vitePlugins etc.).
- Expect Vite 5+; ensure Node >=18.

5) Optional ecosystem alignments (as needed)
```bash
# only if peer warnings suggest
npm i pinia@^3
npm i vue-router@^4
npm i @vueuse/core@^14
```
- Update `@intlify/vite-plugin-vue-i18n` if Vite plugin API warnings appear.

6) Engines and CI
- In `package.json`, update engines to require Node ">=18" after CLI upgrade.
- Ensure GitHub Actions and local dev use Node >=18.

7) Validation checklist (after each step)
- Dev: hot reload, i18n load, axios boot files OK.
- Build: `quasar build` (PWA) emits `dist/pwa/`; service worker registers.
- Features: login (Keychain/HAS), KeepSats, QR scanning, invoice parsing, POS.
- Visual: dark mode, icons from `@quasar/extras`.
- Docker image still serves built PWA under nginx.

Helper commands (read-only)
```bash
npm outdated quasar vue @quasar/app-vite pinia vue-router @vueuse/core
npx npm-check-updates '/^(quasar|@quasar\/app-vite|vue|pinia|vue-router|@vueuse\/core)$/' -u && npm install
```

Rollback plan
- Revert the branch or selectively reset `package.json` and `package-lock.json` to previous commit if issues arise.

Notes captured from codebase
- PWA build targets `dist/pwa/` and is served via nginx in Dockerfile.
- Dev server uses port 9200 with optional HTTPS and custom WS URL; validate after upgrades.
