import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  DHIVE_REGENERATOR_SAFE,
  DHIVE_REGENERATOR_UNSAFE,
  patchDhiveForCsp,
} from "../build/dhiveCspPlugin.js"

const dhiveBundle = path.resolve(
  "node_modules/@hiveio/dhive/dist/dhive.js",
)

describe("dhive CSP patch", () => {
  it("replaces regenerator-runtime's Function() fallback in the installed browser build", () => {
    const source = readFileSync(dhiveBundle, "utf8")
    expect(source).toContain(DHIVE_REGENERATOR_UNSAFE)

    const patched = patchDhiveForCsp(source)

    expect(patched).toContain(DHIVE_REGENERATOR_SAFE)
    expect(patched).not.toContain('Function("r","regeneratorRuntime = r")')
  })
})
