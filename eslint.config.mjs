import pluginVue from "eslint-plugin-vue";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
  // Vue 3 essential rules (includes vue-eslint-parser setup)
  ...pluginVue.configs["flat/essential"],

  // Prettier config — disables ESLint rules that conflict with Prettier
  eslintConfigPrettier,

  // Project-wide settings
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ga: "readonly",
        cordova: "readonly",
        __statics: "readonly",
        __QUASAR_SSR__: "readonly",
        __QUASAR_SSR_SERVER__: "readonly",
        __QUASAR_SSR_CLIENT__: "readonly",
        __QUASAR_SSR_PWA__: "readonly",
        process: "readonly",
        Capacitor: "readonly",
        chrome: "readonly",
      },
    },
    rules: {
      "prefer-promise-reject-errors": "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    },
  },

  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      "dist/",
      "src-capacitor/",
      "src-cordova/",
      ".quasar/",
      "node_modules/",
      "*.temporary.compiled.*",
    ],
  },
];
