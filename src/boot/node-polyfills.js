import { defineBoot } from "#q-app"
import processShim from "vite-plugin-node-polyfills/shims/process"
import bufferShim from "vite-plugin-node-polyfills/shims/buffer"

// hive-auth-wrapper / hive-tx / bolt11 still expect Node globals in the browser.
// Set them before any route (and therefore those deps) loads.
globalThis.process = globalThis.process || processShim
globalThis.Buffer = globalThis.Buffer || bufferShim
globalThis.global = globalThis.global || globalThis

export default defineBoot(() => {})
