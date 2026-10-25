import axios from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createPinia, setActivePinia } from "pinia"

vi.mock("../src/use/useHive.js", () => ({
  useHiveDetails: vi.fn(async (name) => ({
    profile: { name },
    balance: "1.000 HIVE",
    hbd_balance: "1.000 HBD",
    savings_balance: "0.000 HIVE",
    savings_hbd_balance: "0.000 HBD",
  })),
}))

vi.mock("../src/use/useV4vapp.js", () => ({
  useKeepSats: vi.fn(async () => null),
}))

import { useHiveDetails } from "../src/use/useHive.js"
import {
  apiLogin,
  refreshAccessToken,
  refreshInterceptor,
  serverHiveAccount,
} from "../src/boot/axios.js"
import { readAllowedUsers } from "../src/utils/authSession.js"
import { useStoreUser } from "../src/stores/storeUser.js"

function fakeJwt(username) {
  const payload = btoa(JSON.stringify({ username }))
  return `e30.${payload}.sig`
}

function usernameOf(token) {
  return JSON.parse(atob(token.split(".")[1])).username
}

function make401(username) {
  return {
    config: {
      url: "/v2/v4vapp/keepsats",
      method: "get",
      headers: { Authorization: `Bearer ${fakeJwt(username)}` },
    },
    response: { status: 401, data: { detail: "Could not validate credentials" } },
  }
}

function refusedRefreshError() {
  const error = new Error("Request failed with status code 401")
  error.response = {
    status: 401,
    data: { detail: "Requested account is not on this session" },
  }
  return error
}

let refreshCalls

function installRefresh(handler) {
  refreshCalls = []
  apiLogin.post = async (url, body, config) => {
    refreshCalls.push({ url, body, config })
    if (handler) return handler(url, body, config)
    const user = body?.for_user || "v4vapp"
    return {
      status: 200,
      data: {
        access_token: fakeJwt(user),
        token_type: "bearer",
        expire: 0,
        allowed_users: ["v4vapp", "v4vapp.dev"],
      },
    }
  }
}

async function loginAccount(store, name, allowedUsers, authKey = "webauthn") {
  await store.login(
    name,
    "posting",
    authKey,
    null,
    null,
    fakeJwt(name),
    "hive",
    { access_token: fakeJwt(name), token_type: "bearer", allowed_users: allowedUsers },
  )
}

describe("multi-account refresh session", () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    installRefresh()
    useHiveDetails.mockClear()
    // The interceptor retries the original request with the default axios
    // instance. Keep that retry local so a 401 test never opens a socket.
    axios.defaults.adapter = async (config) => ({
      data: {},
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    })
  })

  it("keeps two accounts refreshable after logging in one after the other", async () => {
    expect(serverHiveAccount).toBe("devser.v4vapp")
    const store = useStoreUser()

    await loginAccount(store, "v4vapp", ["v4vapp"])
    expect([...store.sessionAccounts]).toEqual(["v4vapp"])
    expect(store.users["v4vapp"]).toBeTruthy()

    await loginAccount(store, "v4vapp.dev", ["v4vapp", "v4vapp.dev"])
    expect([...store.sessionAccounts]).toEqual(["v4vapp", "v4vapp.dev"])
    expect(store.users["v4vapp"]).toBeTruthy()
    expect(store.users["v4vapp.dev"]).toBeTruthy()

    store.accessTokens = {}
    refreshCalls = []

    const first = await store.ensureAccessToken("v4vapp")
    const second = await store.ensureAccessToken("v4vapp.dev")

    expect(usernameOf(first)).toBe("v4vapp")
    expect(usernameOf(second)).toBe("v4vapp.dev")
    expect(refreshCalls.map((call) => call.body)).toEqual([
      { for_user: "v4vapp" },
      { for_user: "v4vapp.dev" },
    ])
    expect(refreshCalls.every((call) => call.config.withCredentials === true)).toBe(
      true,
    )
    expect(store.reauthNeeded["v4vapp"]).toBeFalsy()
    expect(store.reauthNeeded["v4vapp.dev"]).toBeFalsy()
    expect([...store.sessionAccounts]).toEqual(["v4vapp", "v4vapp.dev"])
  })

  it("does not invent session membership when the login response omits the list", async () => {
    const store = useStoreUser()
    store.sessionAccounts = ["v4vapp"]

    await store.login(
      "v4vapp.dev",
      "posting",
      "webauthn",
      null,
      null,
      fakeJwt("v4vapp.dev"),
      "hive",
      { access_token: fakeJwt("v4vapp.dev"), token_type: "bearer" },
    )

    expect(store.users["v4vapp.dev"]).toBeTruthy()
    expect([...store.sessionAccounts]).toEqual(["v4vapp"])
    expect(readAllowedUsers({ access_token: "present" })).toBeNull()
  })

  it("does not seed sessionAccounts from every saved user", () => {
    const store = useStoreUser()
    store.users = {
      v4vapp: { hiveAccname: "v4vapp", authKey: "webauthn" },
      "v4vapp.dev": { hiveAccname: "v4vapp.dev", authKey: "webauthn" },
    }
    store.sessionAccounts = []
    store.currentUser = "v4vapp"

    store.initialize()

    expect([...store.sessionAccounts]).toEqual([])
    expect(refreshCalls).toEqual([])
  })

  it("marks reauthNeeded and keeps the account when refresh is refused", async () => {
    const store = useStoreUser()
    await loginAccount(store, "v4vapp", ["v4vapp", "v4vapp.dev"])
    await loginAccount(store, "v4vapp.dev", ["v4vapp", "v4vapp.dev"])
    store.currentUser = "v4vapp"

    const logoutUser = vi.spyOn(store, "logoutUser")
    const logout = vi.spyOn(store, "logout")
    installRefresh(() => {
      throw refusedRefreshError()
    })

    await refreshInterceptor(make401("v4vapp")).catch(() => {})

    expect(logoutUser).not.toHaveBeenCalled()
    expect(logout).not.toHaveBeenCalled()
    expect(refreshCalls).toHaveLength(1)
    expect(refreshCalls[0].body).toEqual({ for_user: "v4vapp" })
    expect(store.users["v4vapp"]).toBeTruthy()
    expect(store.users["v4vapp.dev"]).toBeTruthy()
    expect(store.currentUser).toBe("v4vapp")
    expect(store.reauthNeeded["v4vapp"]).toBe(true)
    expect([...store.sessionAccounts]).not.toContain("v4vapp")
    expect(store.currentReauthNeeded).toBe(true)
  })

  it("uses one refresh call for parallel 401s and still refreshes the other account", async () => {
    const store = useStoreUser()
    store.currentUser = "v4vapp"
    store.users = {
      v4vapp: { hiveAccname: "v4vapp", authKey: "webauthn" },
      "v4vapp.dev": { hiveAccname: "v4vapp.dev", authKey: "webauthn" },
    }

    let releaseFirst
    const gate = new Promise((resolve) => {
      releaseFirst = resolve
    })
    installRefresh(async (_url, body) => {
      if (body?.for_user === "v4vapp") await gate
      return {
        status: 200,
        data: {
          access_token: fakeJwt(body.for_user),
          token_type: "bearer",
          allowed_users: ["v4vapp", "v4vapp.dev"],
        },
      }
    })

    const pending = Promise.all(
      Array.from({ length: 5 }, () =>
        refreshInterceptor(make401("v4vapp")).catch(() => {}),
      ),
    )
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(refreshCalls).toHaveLength(1)
    expect(refreshCalls[0].body).toEqual({ for_user: "v4vapp" })

    const other = store.ensureAccessToken("v4vapp.dev")
    const otherToken = await Promise.race([
      other,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("ensureAccessToken(B) waited on A's refresh")),
          50,
        ),
      ),
    ])
    expect(usernameOf(otherToken)).toBe("v4vapp.dev")
    expect(refreshCalls.map((call) => call.body.for_user)).toEqual([
      "v4vapp",
      "v4vapp.dev",
    ])

    releaseFirst()
    await pending
    expect(refreshCalls.filter((call) => call.body.for_user === "v4vapp")).toHaveLength(
      1,
    )
    expect([...store.sessionAccounts]).toEqual(["v4vapp", "v4vapp.dev"])
  })

  it("does not request a token for the server hive account", async () => {
    const store = useStoreUser()
    store.currentUser = serverHiveAccount
    store.users = {
      [serverHiveAccount]: { hiveAccname: serverHiveAccount, authKey: "webauthn" },
    }
    store.sessionAccounts = [serverHiveAccount]
    refreshCalls = []

    expect(await store.ensureAccessToken(serverHiveAccount)).toBeNull()
    expect(await refreshAccessToken(serverHiveAccount)).toBeNull()
    await refreshInterceptor(make401(serverHiveAccount)).catch(() => {})

    expect(refreshCalls).toEqual([])
    expect(store.users[serverHiveAccount]).toBeTruthy()
  })

  it("does not refresh on 403", async () => {
    const store = useStoreUser()
    await loginAccount(store, "v4vapp", ["v4vapp"])
    refreshCalls = []

    await refreshInterceptor({
      config: {
        url: "/v2/v4vapp/keepsats",
        method: "get",
        headers: { Authorization: `Bearer ${fakeJwt("v4vapp")}` },
      },
      response: { status: 403, data: { detail: "Not allowed" } },
    }).catch(() => {})

    expect(refreshCalls).toEqual([])
    expect(store.reauthNeeded["v4vapp"]).toBeFalsy()
    expect(store.users["v4vapp"]).toBeTruthy()
    expect([...store.sessionAccounts]).toEqual(["v4vapp"])
  })

  it("sends the refresh cookie on login and session routes only", async () => {
    const handler = apiLogin.interceptors.request.handlers.find(
      (entry) => entry && entry.fulfilled,
    )
    expect(handler).toBeTruthy()

    const paths = [
      "/token",
      "/authenticate/complete/",
      "/auth/validate/",
      "/auth/refresh",
      "/auth/logout",
    ]
    for (const url of paths) {
      const config = await handler.fulfilled({ url, method: "post" })
      expect(config.withCredentials).toBe(true)
    }

    const challenge = await handler.fulfilled({
      url: "/auth/v4vapp",
      method: "get",
      withCredentials: false,
    })
    expect(challenge.withCredentials).toBe(false)
  })
})
