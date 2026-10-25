import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["test/setup.js"],
    fileParallelism: false,
    include: ["test/**/*.test.js"],
  },
  resolve: {
    alias: {
      src: fileURLToPath(new URL("./src", import.meta.url)),
      boot: fileURLToPath(new URL("./src/boot", import.meta.url)),
      stores: fileURLToPath(new URL("./src/stores", import.meta.url)),
      components: fileURLToPath(new URL("./src/components", import.meta.url)),
      "#q-app": fileURLToPath(new URL("./test/stubs/q-app.js", import.meta.url)),
    },
  },
})
