// @hiveio/dhive's browser build (dist/dhive.js) inlines an old
// regenerator-runtime. In an ES module the sloppy `regeneratorRuntime = runtime`
// assignment throws, and the fallback calls Function(), which the site CSP
// rejects because script-src has no 'unsafe-eval'. The signup route is the only
// importer, so that rejection leaves /signup blank on v4v.app and dev.v4v.app.
// This file lives outside build/ because .dockerignore excludes that directory.

export const DHIVE_REGENERATOR_UNSAFE =
  'try{regeneratorRuntime=runtime}catch(accidentalStrictMode){Function("r","regeneratorRuntime = r")(runtime)}'

export const DHIVE_REGENERATOR_SAFE = "globalThis.regeneratorRuntime=runtime"

export function patchDhiveForCsp(code) {
  if (!code.includes(DHIVE_REGENERATOR_UNSAFE)) return null
  return code.replaceAll(DHIVE_REGENERATOR_UNSAFE, DHIVE_REGENERATOR_SAFE)
}

export function dhiveCspPlugin() {
  return {
    name: "dhive-csp",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0]
      if (!file.includes("/@hiveio/dhive/dist/dhive.js")) return null
      const patched = patchDhiveForCsp(code)
      if (patched == null) {
        this.error(
          "@hiveio/dhive no longer contains the regenerator-runtime Function() fallback. /signup stays blank under the site Content-Security-Policy until tools/dhiveCspPlugin.js matches the installed bundle.",
        )
      }
      return { code: patched, map: null }
    },
  }
}
