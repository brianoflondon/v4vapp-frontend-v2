/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from "#q-app"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"
import { nodePolyfills } from "vite-plugin-node-polyfills"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

export default defineConfig(function (ctx) {
  return {
    // https://v2.quasar.dev/quasar-cli/boot-files
    boot: ["node-polyfills", "i18n", "axios"],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#css
    css: ["app.scss"],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      "fontawesome-v7",
      "roboto-font",
      "material-icons",
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#build
    build: {
      // Keep existing `src/`, `boot/`, `components/` imports working after
      // app-vite v3 dropped those aliases in favor of `@/`.
      alias: {
        src: ctx.appPaths.srcDir,
        app: ctx.appPaths.appDir,
        components: ctx.appPaths.resolve.src("components"),
        layouts: ctx.appPaths.resolve.src("layouts"),
        pages: ctx.appPaths.resolve.src("pages"),
        assets: ctx.appPaths.resolve.src("assets"),
        boot: ctx.appPaths.resolve.src("boot"),
        stores: ctx.appPaths.resolve.src("stores"),
      },

      target: {
        browser: "baseline-widely-available",
        node: "node22",
      },

      vueRouterMode: "history",

      // Third-party Vue components (qrcode-reader, confetti, leaflet wrappers)
      // may still use Options API.
      vueOptionsAPI: true,

      // Vite 8 / Rolldown no longer injects Node's `process` into the browser
      // bundle. hive-auth-wrapper, hive-tx and bolt11 still pull in Node shims
      // (util, assert, Buffer). Values must be JSON-stringified.
      define: {
        "process.env.NODE_ENV": JSON.stringify(
          ctx.dev ? "development" : "production",
        ),
        "process.env.NODE_DEBUG": JSON.stringify(""),
      },

      // Expose VUE_APP_* from .env to client code (default prefix is QCLI_).
      env: {
        clientPrefix: ["QCLI_", "VUE_APP_"],
      },

      // Use the pure JS 'sass' implementation instead of sass-embedded.
      // This avoids native binary compatibility problems on older macOS (13).
      extendViteConf(viteConf) {
        viteConf.css = viteConf.css || {}
        viteConf.css.preprocessorOptions = viteConf.css.preprocessorOptions || {}

        const scssOpts = viteConf.css.preprocessorOptions.scss || {}
        viteConf.css.preprocessorOptions.scss = {
          ...scssOpts,
          implementation: require("sass"),
        }

        const sassOpts = viteConf.css.preprocessorOptions.sass || {}
        viteConf.css.preprocessorOptions.sass = {
          ...sassOpts,
          implementation: require("sass"),
        }

        return {
          resolve: {
            alias: {
              "sass-embedded": require.resolve("sass"),
            },
          },
        }
      },

      vitePlugins: [
        ...nodePolyfills({
          include: [
            "assert",
            "buffer",
            "events",
            "process",
            "stream",
            "util",
          ],
          globals: {
            Buffer: true,
            global: true,
            process: true,
          },
        }),
        [
          "@intlify/unplugin-vue-i18n/vite",
          {
            include: path.resolve(__dirname, "./src/i18n/**"),
          },
        ],
      ],
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#devServer
    devServer: {
      https: process.env.HTTPS === "true",
      port: 9200,
      host: "0.0.0.0",
      open: false,
      historyApiFallback: {
        rewrites: [{ from: /./, to: "/index.html" }],
      },
      allowedHosts: true,
      client: {
        webSocketURL: "wss://dev.h.v4v.app/ws",
      },
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#framework
    framework: {
      config: {},
      lang: "en-US",
      plugins: ["Notify", "LocalStorage", "SessionStorage", "Dialog"],
    },

    animations: "all",

    // Keep existing PWA filenames instead of the v3 defaults
    // (src-pwa/register-sw, src-pwa/sw/custom-sw).
    sourceFiles: {
      pwaRegisterServiceWorker: "src-pwa/register-service-worker",
      pwaServiceWorker: "src-pwa/custom-service-worker",
    },

    // https://v2.quasar.dev/quasar-cli/developing-ssr/configuring-ssr
    ssr: {
      pwa: false,
      prodPort: 3000,
      middlewares: ["render"],
    },

    // https://v2.quasar.dev/quasar-cli/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: "GenerateSW",
      injectPWAMetaTags: true,
      swFilename: "sw.js",
      manifestFilename: "manifest.json",
      useCredentialsForManifestTag: false,
      extendPWAManifestJson(json) {
        json.name = "V4V.app"
        json.short_name = "V4V.app"
        json.description = "V4V.app Hive Lightning Bridge"
      },
    },

    cordova: {},

    capacitor: {
      hideSplashscreen: false,
      iosStatusBarPadding: true,
    },

    electron: {
      inspectPort: 5858,
      bundler: "packager",
      packager: {},
      builder: {},
    },

    bex: {
      contentScripts: ["my-content-script"],
    },
  }
})
