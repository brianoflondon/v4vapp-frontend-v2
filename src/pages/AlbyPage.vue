<template>
  <div>Alby</div>
</template>

<script setup>
import { onMounted } from "vue"
import { auth, Client } from "@getalby/sdk"

onMounted(async () => {
  console.log("Alby page mounted")

  const authClient = new auth.OAuth2User({
    client_id: 12334,
    client_secret: 566778,
    callback: "http://localhost:8080/callback",
    scopes: [
      "invoices:read",
      "account:read",
      "balance:read",
      "invoices:create",
      "invoices:read",
      "payments:send",
    ],
    token: {
      access_token: undefined,
      refresh_token: undefined,
      expires_at: undefined,
    }, // initialize with existing token
  })

  const authUrl = await authClient.generateAuthURL({
    code_challenge_method: "S256",
    authorizeUrl: "https://getalby.com/oauth", // endpoint for authorization (replace with the appropriate URL based on the environment)
  })
  // open auth URL
  // `code` is passed as a query parameter when the user is redirected back after authorization
  const code = "code" // replace with the code from the query parameter
  await authClient.requestAccessToken(code)

  // access the token response. You can store this securely for future client initializations
  console.log(authClient.token)

  // initialize a client
  const client = new Client(authClient)

  const result = await client.accountBalance()
})
</script>

<style lang="scss" scoped></style>
