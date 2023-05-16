import { boot } from "quasar/wrappers"
import { Buffer } from "buffer"

export default boot(({ app }) => {
  app.config.globalProperties.$Buffer = Buffer
})
