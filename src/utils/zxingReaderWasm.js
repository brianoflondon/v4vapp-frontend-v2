import { setZXingModuleOverrides } from "vue-qrcode-reader"
import zxingReaderWasmAsset from "../../node_modules/zxing-wasm/dist/reader/zxing_reader.wasm?url"

export const zxingReaderWasmUrl = zxingReaderWasmAsset

// vue-qrcode-reader decodes with ZXing and otherwise fetches
// zxing_reader.wasm from fastly.jsdelivr.net. That host is outside connect-src,
// so the camera preview stays up and no code is ever detected.
export function installZxingReaderWasm(url = zxingReaderWasmUrl) {
  if (typeof url !== "string" || url.includes("jsdelivr.net")) {
    throw new Error("ZXing reader wasm must be a same-origin asset")
  }
  setZXingModuleOverrides({
    locateFile: () => url,
  })
  return url
}

installZxingReaderWasm()
