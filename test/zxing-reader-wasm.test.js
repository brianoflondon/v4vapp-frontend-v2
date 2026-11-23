import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("vue-qrcode-reader", () => ({
  setZXingModuleOverrides: vi.fn(),
}))

import { setZXingModuleOverrides } from "vue-qrcode-reader"
import {
  installZxingReaderWasm,
  zxingReaderWasmUrl,
} from "../src/utils/zxingReaderWasm.js"

describe("wallet QR scanner wasm", () => {
  beforeEach(() => {
    setZXingModuleOverrides.mockClear()
  })

  it("loads ZXing from this app instead of jsDelivr", () => {
    expect(zxingReaderWasmUrl).toMatch(/zxing_reader.*\.wasm/)
    expect(zxingReaderWasmUrl).not.toContain("jsdelivr")

    const url = installZxingReaderWasm()
    const overrides = setZXingModuleOverrides.mock.calls.at(-1)[0]

    expect(url).toBe(zxingReaderWasmUrl)
    expect(overrides.locateFile("zxing_reader.wasm", "")).toBe(zxingReaderWasmUrl)
  })
})
