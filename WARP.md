# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

V4V.app is a **Quasar Vue 3** application serving as a bridge between Hive blockchain and Lightning Network for value-for-value payments. The app enables users to:

- Send/receive Lightning Network invoices and payments
- Integrate with Hive blockchain accounts via Keychain and HAS (Hive Authentication Services)
- Manage a KeepSats balance (Lightning sats stored on V4V.app)
- Run point-of-sale (POS) functionality
- Support for alternative login methods (EVM wallets, passkeys)

## Development Commands

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
# or
quasar dev
```

The dev server runs on port 9200 by default with HTTPS support when `.env` has `HTTPS=true`.

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

### Build for production

```bash
npm run build
# or
quasar build
```

Builds a PWA (Progressive Web App) to `dist/pwa/`.

### Version and release

```bash
npm run patch
```

Bumps patch version, commits, tags, and pushes to remote.

## Architecture

### Technology Stack

- **Framework**: Quasar v2 with Vue 3 Composition API
- **State Management**: Pinia stores with localStorage persistence via `@vueuse/core`
- **API**: Axios for HTTP requests to `api.v4v.app` (prod) or `devapi.v4v.app` (dev)
- **Styling**: Quasar components + SCSS with dark mode support (auto-detected)
- **Internationalization**: vue-i18n with multiple language support
- **Build**: Vite (via @quasar/app-vite)

### Directory Structure

- `src/boot/` - Quasar boot files (axios, i18n initialization)
- `src/components/` - Vue components organized by domain:
  - `lightning/` - Lightning Network payment components
  - `hive/` - Hive blockchain integration components
  - `v4vapp/` - V4V.app-specific components
  - `qrcode/` - QR code scanning/generation
  - `utils/` - Utility components
- `src/layouts/` - Layout components (MainLayout with TopBar, SideMenu, PriceBar)
- `src/pages/` - Route page components
- `src/stores/` - Pinia stores for state management
- `src/use/` - Composable functions (business logic)
- `src/router/` - Vue Router configuration
- `src/i18n/` - Translation files per locale
- `src-pwa/` - PWA configuration (service worker, manifest)

### Key Architectural Patterns

#### Composables (src/use/)

Reusable business logic organized by domain:

- `useHive.js` - Hive blockchain operations (accounts, profiles, avatars)
- `useV4vapp.js` - V4V.app API integration (KeepSats balance, transfers, payment flows)
- `useKeychain.js` - Hive Keychain integration
- `useHAS.js` - Hive Authentication Services integration
- `useLightningInvoice.js` - Lightning invoice parsing and validation
- `useEVM.js` - Ethereum/EVM wallet support
- `usePasskeys.js` - WebAuthn/Passkey authentication
- `useCoinGecko.js` - Cryptocurrency price data
- `useUtils.js` - General utilities (UUID, number formatting, caching)

#### Pinia Stores (src/stores/)

State management with localStorage persistence:

- `storeUser.js` - User authentication, profiles, API tokens (defines HiveUser class)
- `storeAPIStatus.js` - API health and status
- `storeSales.js` - POS sales data
- `storeCoingecko.js` - Cryptocurrency prices

The `HiveUser` class in `storeUser.js` is central to authentication, supporting multiple login types (Hive Keychain, HAS, EVM, passkeys).

#### API Configuration (src/boot/axios.js)

Two axios instances:

- `api` - Main API v1 endpoints (`apiURL`)
- `apiLogin` - Authentication endpoints (`apiLoginURL`)

Environment detection via `.env` or URL inspection determines API base:

- Production: `https://api.v4v.app/v1`
- Development: `https://devapi.v4v.app/v1`
- Local: `http://localhost:1818/v1`

API tokens stored in Pinia and set as Bearer auth headers.

#### Routing

Routes support Hive account patterns: `/@username` dynamically matches Hive accounts. POS routes include nested paths like `/pos/sales/@username`.

### External Integrations

- **Hive blockchain**: Uses `hive-tx.min.js` library (global `hiveTx` object) configured to use `api.deathwing.me` node
- **Lightning Network**: Invoice parsing via `useLightningInvoice.js`
- **Hive Keychain**: Browser extension integration via `keychain-sdk`
- **Hive Auth (HAS)**: Secure authentication via `hive-auth-wrapper`
- **CoinGecko**: Price data for crypto conversions
- **QR Code**: Scanning with `vue-qrcode-reader`, generation with `qr-code-styling`

## Common Development Patterns

### Adding a new composable

Create in `src/use/useFeatureName.js` and export functions. Import in components as needed. Keep domain-specific (Hive, Lightning, V4V.app API, etc.).

### Adding a new Pinia store

1. Create `src/stores/storeFeatureName.js`
2. Use `useStorage()` from `@vueuse/core` for localStorage persistence
3. Export store definition via `defineStore()`
4. Import in components: `const storeFeatureName = useStoreFeatureName()`

### API requests with authentication

Use `apiLogin` instance for authenticated endpoints:

```javascript
import { apiLogin } from "src/boot/axios";
const response = await apiLogin.get("/endpoint", { params });
```

Bearer token is automatically included if user is logged in.

### Working with Hive accounts

Always validate Hive account names using the regex from `useHive.js` (`useHiveAccountRegex`). Use `useHiveDetails()` to fetch account data or `useHiveProfile()` for profile-specific data.

### Dark mode

Dark mode is auto-detected via Quasar's `Dark.isActive`. Check this when serving different assets (e.g., avatars in `useBlankProfileURL()`).

## Environment Configuration

`.env` controls API routing:

- `VUE_APP_LOCAL_API=true` - Use localhost:1818
- `VUE_APP_DEV_API=true` - Use devapi.v4v.app
- `HTTPS=true` - Enable HTTPS in dev server

## Docker & CI/CD

### Docker

Multi-stage Dockerfile:

1. Build stage: Node 18, npm ci, quasar build --mode pwa
2. Serve stage: nginx:stable serves from `dist/pwa`

Build image:

```bash
docker build -t v4vapp-frontend-v2 .
```

### GitHub Actions

`.github/workflows/docker_publish.yml` auto-builds and publishes to Docker Hub (`brianoflondon/v4vapp-frontend-v2`) on:

- Push to main/develop branches
- Version tags (e.g., v1.25.2)
- PRs to main/develop

## Testing

Currently no automated tests configured (`npm test` exits 0). Consider adding Vitest or Playwright for future test coverage.

## Important Notes

### Authentication Flow

Users can log in via:

1. **Hive Keychain** (browser extension) - Sets apiToken, no authKey
2. **Hive Auth (HAS)** - Sets apiToken + authKey + expire time
3. **EVM wallet** (MetaMask, etc.) - loginType="evm"
4. **Passkeys** (WebAuthn) - Future authentication method

User state persists in localStorage via Pinia stores. Check `storeUser.currentUser` to determine logged-in state.

### KeepSats

Users maintain a Lightning sats balance on V4V.app called "KeepSats". Functions in `useV4vapp.js` handle balance queries, transfers, and payment processing. Always use `apiLogin` instance for KeepSats operations.

### PWA Configuration

App is built as PWA with service worker. Manifest and SW config in `src-pwa/`. Pay attention to iOS/iPhone-specific handling in MainLayout.vue (standalone mode detection).

### Internationalization

All user-facing strings should use `$t('key')` or `i18n.global.t('key')` for translation. Translation files in `src/i18n/[locale]/`.

### Hive Transaction IDs

Use `useGenerateTxUrl(txId)` from `useHive.js` to generate block explorer links (hivehub.dev).
