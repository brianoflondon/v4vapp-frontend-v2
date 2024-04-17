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
        @clear="handleReset"
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
      <div class="flex items-center">
        <div class="q-pa-sm col-shrink large-font">
          {{ accountName.length }}
        </div>
        <div class="q-pa-sm col-grow">
          <q-slider
            v-model="accountName.length"
            caption="Account Name Length"
            track-size="8px"
            :step="1"
            :min="0"
            :inner-min="3"
            :inner-max="16"
            markers
            :max="20"
            :color="nameCheck ? 'primary' : 'negative'"
            dense
            readonly
            switch-label-side
          >
          </q-slider>
        </div>
      </div>
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
        label="Download Keys"
        :disable="!nameCheck"
        color="primary"
        @click="downloadKeys"
      ></q-btn>

      <q-btn
        label="Get Account"
        :disable="!nameCheck"
        color="primary"
        type="submit"
      />
    </q-form>
    <div v-show="paymentRequest?.payment_request">
      <q-card>
        <q-card-section>
          <!-- Green tick -->
          <div
            class="row text-center justify-center overlay-container"
            :class="{ 'show-tick': false }"
          >
            <CreateQRCode
              :qrText="paymentRequest?.payment_request || 'No payment request'"
              :width="maxUseableWidth"
              :height="maxUseableWidth"
              hiveAccname="v4vapp.api"
              :color="dotColor"
              :loading="false"
              @qr-code="(val) => (qrCode = val)"
            />
          </div>
          <div class="q-pt-none">
            <q-linear-progress
              :width="maxUseableWidth"
              class="invoice-timer"
              size="10px"
              :value="progress"
              color="positive"
            >
            </q-linear-progress>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
  <pre>
    {{ paymentRequest }}
  </pre>
</template>

<script setup>
import { ref, computed } from "vue"
import { useQuasar, copyToClipboard } from "quasar"
import { useHiveAccountExists } from "src/use/useHive"
import { PrivateKey } from "@hiveio/dhive"
import { genRandAlphaNum } from "src/use/useUtils"
import { api } from "src/boot/axios"
import { useAppStr } from "src/use/useAppDetails"
import { useStoreUser } from "src/stores/storeUser"
import CreateQRCode from "src/components/qrcode/CreateQRCode.vue"
import { tidyNumber, QRLightningHiveColor } from "src/use/useUtils"
import { Notify } from "quasar"
import { useI18n } from "vue-i18n"

const t = useI18n().t

const storeUser = useStoreUser()
const q = useQuasar()
// Define the account name and master password
const accountName = ref("")
const nameCheck = ref(true)
const nameCheckError = ref("")
const masterPassword = ref("")
const keys = ref({})
const progress = ref(0)
const respPaid = ref({})
const paymentRequest = ref({})
const invoiceLoading = ref(false)
let initialTime = 0

const maxUseableWidth = computed(() => {
  if (q.screen.width < 460) {
    return q.screen.width - 120
  }
  return 350
})

const dotColor = computed(() => {
  return QRLightningHiveColor(true, false)
})

async function handleSubmit() {
  requestInvoice()
}

async function requestInvoice() {
  // First call to get an invoice
  invoiceLoading.value = true
  const accountData = {
    accountName: accountName.value,
    appId: useAppStr(),
    clientId: storeUser.clientId,
  }
  try {
    const resp = await api.post("/account/create", accountData)
    console.log("resp", resp)
    paymentRequest.value = resp.data
    paymentRequest.value["payment_request"] =
      "lightning:" + resp.data.payment_request
    progress.value = 100
    initialTime = Math.floor(Date.now() / 1000) // Store the initial time
    invoiceLoading.value = false
    checkPayment(resp.data.expires_at)
  } catch (error) {
    console.error("error", error)
  }
}

// function to loop and call api invoice/check every second to check if payment is made
async function checkPayment(expiresAt) {
  console.log("checkPayment")
  console.log("paymentRequest", paymentRequest.value)
  try {
    const resp = await api.post(`check_invoice`, {
      r_hash: paymentRequest.value.r_hash,
    })
    console.log("resp", resp)
    if (resp.data.paid) {
      respPaid.value = resp.data
      console.log("paid")
      handlePaid()
      return
    }
    if (resp.data.expired) {
      console.log("expired")
      handleExpired()
      return
    }
    // Calculate progress
    const currentTime = Math.floor(Date.now() / 1000) // get current time in seconds
    const totalDuration = expiresAt - currentTime
    const totalTime = expiresAt - initialTime
    progress.value = totalDuration / totalTime
    console.log("progress", progress.value)

    setTimeout(() => checkPayment(expiresAt), 1000)
  } catch (error) {
    console.error("error", error)
  }
}
function handleExpired() {
  console.log("expired")
  Notify.create({
    message: t("invoice_expired"),
    color: "negative",
    position: "top",
    timeout: 5000,
  })
  paymentRequest.value = ""
  progress.value = 1
  randomMasterPassword()
  generateKeys()
}

async function handlePaid() {
  console.log("paid")
  Notify.create({
    message: t("invoice_paid"),
    color: "positive",
    position: "top",
    timeout: 5000,
  })
  const accountData = {
    accountName: accountName.value,
    appId: useAppStr(),
    clientId: storeUser.clientId,
    masterPassword: masterPassword.value,
    r_preimage: respPaid.value.r_preimage,
    payment_hash: paymentRequest.value.payment_hash,
    r_hash: paymentRequest.value.r_hash,
  }
  try {
    const resp = await api.post("/account/create_complete", accountData)
    console.log("resp", resp)
    // This is where we have to enforce key download and checks.
    if (resp.data.masterPassword === masterPassword.value) {
      console.log("Master Passwords match")
    }
    if (resp.data.accountName === accountName.value) {
      console.log("Account Names match")
    }
    if (resp.data.success) {
      Notify.create({
        message: t("account_created"),
        color: "positive",
        position: "top",
        timeout: 5000,
      })
    } else {
      Notify.create({
        message: t("account_not_created"),
        color: "negative",
        position: "top",
        timeout: 5000,
      })
    }
  } catch (error) {
    console.error("error", error)
  }
  paymentRequest.value = ""
  progress.value = 1
  // Copy the ke
}

function handleReset() {
  console.log("reset pressed")
  accountName.value = ""
  nameCheck.value = true
  nameCheckError.value = ""
  masterPassword.value = ""
  keys.value = {}
  progress.value = 1
  paymentRequest.value = ""
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
  masterPassword.value = genRandAlphaNum(32)
  generateKeys()
  return
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
