<template>
  <div class="flex column text-center items-center q-pa-none">
    <q-form @submit="handleSubmit" @reset="handleReset">
      <q-input
        class="large-font"
        v-model="accountName"
        label="Hive Account Name"
        outlined
        debounce="500"
        clearable
        @update:model-value="checkHiveAccountName"
        :error="!nameCheck"
        :error-message="nameCheckError"
      >
        <template v-slot:prepend>
          <q-icon name="person" />
        </template>
        <template v-slot:append>
          <q-icon name="check" v-if="nameCheck" />
        </template>
      </q-input>
      <q-slider
        v-model="accountName.length"
        :label-value="accountName.length"
        :step="1"
        :min="0"
        :inner-min="3"
        :inner-max="16"
        :max="20"
        :color="nameCheck ? 'primary' : 'negative'"
        dense
        readonly
      >
      </q-slider>
      <q-input
        class="q-my-md"
        v-model="masterPassword"
        label="Master Password"
        outlined
        dense
        debounce="500"
        @update:model-value="generateKeys"
      ></q-input>
      <q-btn
        class="q-ma-sm"
        label="Random Master Password"
        color="primary"
        @click="randomMasterPassword"
      ></q-btn>
      <q-btn
        class="q-ma-sm"
        label="Generate Keys"
        color="primary"
        @click="generateKeys"
      ></q-btn>
      <q-btn
        class="q-ma-sm"
        label="Download Keys"
        :disable="!nameCheck"
        color="primary"
        @click="downloadKeys"
      ></q-btn>
      <input type="submit" value="Sign In" />
      <!-- <div v-if="nameCheck">
        <input name="ownerKey" type="password" :value="keys?.private.owner" />
        <input name="activeKey" type="password" :value="keys?.private.active" />
        <input name="postingKey" type="password" :value="keys?.private.posting" />
        <input name="memoKey" type="password" :value="keys?.private.memo" />
        <input name="ownerPubKey" :value="keys?.public.owner" />
        <input name="activePubKey" :value="keys?.public.active" />
        <input name="postingPubKey" :value="keys?.public.posting" />
        <input name="memoPubKey" :value="keys?.public.memo" />
      </div> -->
    </q-form>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useHiveAccountExists } from "src/use/useHive"
import { PrivateKey } from "@hiveio/dhive"

// Define the account name and master password
const accountName = ref("")
const nameCheck = ref(true)
const nameCheckError = ref("")
const masterPassword = ref("")
const keys = ref({})

function handleSubmit() {
  console.log("submit pressed")
}

function handleReset() {
  console.log("reset pressed")
}

async function checkHiveAccountName() {
  if (accountName.value === null || accountName.value === "") {
    accountName.value = ""
    nameCheck.value = true
    nameCheckError.value = ""
    return
  }
  accountName.value = accountName.value.toLowerCase()
  const resp = await useHiveAccountExists(accountName.value)
  nameCheck.value = resp.valid
  nameCheckError.value = resp.error
  if (resp.exists) {
    keys.value = {}
  } else if (resp.valid) {
    randomMasterPassword()
    generateKeys()
  } else {
    console.error("resp.error", resp.error)
  }
}

function randomMasterPassword() {
  // Generate a random master password
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  masterPassword.value = result
  generateKeys()
}

function generateKeys() {
  // Generate the keys
  const ownerKey = PrivateKey.fromLogin(
    accountName.value,
    masterPassword.value,
    "owner"
  )
  const activeKey = PrivateKey.fromLogin(
    accountName.value,
    masterPassword.value,
    "active"
  )
  const postingKey = PrivateKey.fromLogin(
    accountName.value,
    masterPassword.value,
    "posting"
  )
  const memoKey = PrivateKey.fromLogin(
    accountName.value,
    masterPassword.value,
    "memo"
  )

  // Store the keys
  keys.value = {
    accountName: accountName.value,
    masterPassword: masterPassword.value,
    private: {
      owner: ownerKey.toString(),
      active: activeKey.toString(),
      posting: postingKey.toString(),
      memo: memoKey.toString(),
    },
    public: {
      owner: ownerKey.createPublic().toString(),
      active: activeKey.createPublic().toString(),
      posting: postingKey.createPublic().toString(),
      memo: memoKey.createPublic().toString(),
    },
  }
}

function downloadKeys() {
  // Generate the text file
  const data = `
Hive Username: ${accountName.value}

Owner Key: ${keys.value.private.owner}

Active Key: ${keys.value.private.active}

Posting Key: ${keys.value.private.posting}

Memo Key: ${keys.value.private.memo}

Backup (Master) Password: ${masterPassword.value}
`

  // Create a Blob from the data
  const blob = new Blob([data], { type: "text/plain" })
  const url = URL.createObjectURL(blob)

  // Create a link and programmatically click it
  const link = document.createElement("a")
  link.href = url
  link.download = `HIVE_${accountName.value.toUpperCase()}_KEYS.txt`
  link.click()

  // Revoke the URL to free up memory
  URL.revokeObjectURL(url)
}
</script>

<style lang="scss" scoped>
.large-font {
  font-size: 1.8rem;
}
</style>
