<template>
  <div class="flex column text-center items-center q-pa-none">
    <div class="content-container">
      <!-- MARK: Main page start -->
      <div class="main-content">
        <div class="flex column text-center items-center q-pa-none">
          <q-toggle v-model="accountConfirm" label="Confirm Account" />
          <!-- MARK: NUMBERs -->
          <p class="text-h6" style="word-wrap: break-word">
            Install Hive Keychain first.
          </p>
          <StepNumbers :num-items="4" :active-item="activeItem" />
          <transition
            appear
            move
            enter-active-class="animated fadeInDown"
            leave-active-class="animated fadeOutUp"
          >
            <q-form @submit="handleSubmit" @reset="handleReset">
              <div class="text-h6">1. Pick Hive Name</div>
              <q-input
                class="large-font"
                v-model="accountName"
                label="Hive Account Name"
                outlined
                debounce="500"
                @clear="handleReset"
                @update:model-value="checkHiveAccountName"
                :error="!nameCheck"
                :error-message="nameCheckError"
                clearable
              >
                <template #prepend>
                  <q-icon name="person" />
                </template>
                <template #append>
                  <q-icon name="check" v-if="nameCheck" />
                </template>
              </q-input>
              <div v-if="false" class="flex items-center">
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
              <div
                class="fit row wrap justify-center items-center content-start"
              >
                <div class="col">
                  <q-input
                    class=""
                    v-model="masterPassword"
                    label="Master Password"
                    outlined
                    dense
                    debounce="500"
                    @update:model-value="generateKeys"
                  ></q-input>
                </div>
                <div class="col-2">
                  <q-btn
                    class="q-ma-sm"
                    icon="autorenew"
                    color="primary"
                    @click="randomMasterPassword"
                  ></q-btn>
                </div>
              </div>
              <div>
                <div class="text-h6">2. Download Keys</div>
              </div>
              <div class="flex row wrap justify-center">
                <div class="q-ma-sm">
                  <q-btn
                    label="Download Keys"
                    :disable="activeItem < 2"
                    icon="download"
                    :color="buttonActiveNot(!activeItem < 2).color"
                    :text-color="buttonActiveNot(!activeItem < 2).textColor"
                    @click="downloadKeys"
                  ></q-btn>
                </div>
                <div class="q-ma-sm">
                  <q-btn
                    label="Copy Keys"
                    :disable="activeItem < 2"
                    icon="content_copy"
                    :color="buttonActiveNot(!activeItem < 2).color"
                    :text-color="buttonActiveNot(!activeItem < 2).textColor"
                    @click="copyKeys"
                  ></q-btn>
                </div>
              </div>
              <div>
                <div class="text-h6 q-pa-md">3. Confirm Download</div>
                <q-checkbox
                  v-model="downloadedKeys"
                  label="YES! I have downloaded and saved my keys"
                  :text-color="buttonActiveNot(!activeItem < 3).textColor"
                  :disable="activeItem < 3"
                  @update:model-value="downloadedKeys"
                />
              </div>
              <div>
                <div class="text-h6 q-pa-md">4. Pay</div>
                <div
                  class="flex col wrap justify-center items-center content-start"
                >
                  <div class="q-px-md">
                    <q-input label="Voucher" v-model="voucher" outlined dense>
                    </q-input>
                  </div>
                  <div class="q-px-md">
                    <q-btn
                      label="Pay"
                      icon="bolt"
                      :disable="activeItem < 4"
                      :color="buttonActiveNot(!activeItem < 4).color"
                      :text-color="buttonActiveNot(!activeItem < 4).textColor"
                      type="submit"
                    />
                  </div>
                </div>
              </div>
            </q-form>
          </transition>
        </div>
      </div>
      <div class="sidebar">
        <GetKeychain :active-item="activeItem" />
      </div>
    </div>
  </div>

  <!-- MARK: The Payment Dialog screen -->
  <q-dialog v-model="showPayment" persistent>
    <q-card>
      <q-card-section>
        <div class="text-h6">Lightning Invoice</div>
        <div class="text-subtitle">
          Pay this invoice to create <strong>@{{ accountName }}</strong> on Hive
        </div>
      </q-card-section>
      <q-card-section>
        <!-- Green tick -->
        <div
          class="row text-center justify-center overlay-container"
          :class="{ 'show-tick': invoicePaid }"
        >
          <CreateQRCode
            :qrText="paymentRequest?.payment_request || 'loading'"
            :width="maxUseableWidth"
            :height="maxUseableWidth"
            hiveAccname="v4vapp.api"
            :color="dotColor"
            :loading="invoiceLoading"
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
      <q-card-section>
        <div class="flex q-gutter-sm items-center">
          <div class="q-px-sm">
            <q-btn
              icon="content_copy"
              round
              @click="copyToClipboard(paymentRequest?.payment_request)"
            >
              <q-tooltip>{{ t("copy_qrcode") }}</q-tooltip>
            </q-btn>
          </div>
          <div class="col-grow text-right">
            <pre>@{{ accountName }}</pre>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" justify="end">
        <q-btn
          label="Paid"
          icon="check"
          color="positive"
          @click="checkPayment(false)"
        />
        <q-btn
          label="Cancel"
          icon="cancel"
          color="negative"
          @click="handleCancel"
        ></q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
  <!-- Mark: End of Payment Dialog screen -->
  <!-- Mark: Confirm new account screen -->
  <q-dialog v-model="accountConfirm" persistent>
    <ConfirmNewAccount
      :accountName="accountName"
      :masterPassword="masterPassword"
      :keys="keys"
      @close="handleReset"
      @downloadKeys="downloadKeys"
      @copyKeys="copyKeys"
    />
  </q-dialog>
</template>

<script setup>
//MARK: script setup

import { ref, computed, watch } from "vue"
import { useQuasar, copyToClipboard } from "quasar"
import { useHiveAccountExists } from "src/use/useHive"
import { buttonActiveNot } from "src/use/useUtils"
import { PrivateKey } from "@hiveio/dhive"
import { genRandAlphaNum } from "src/use/useUtils"
import { api } from "src/boot/axios"
import { useAppStr } from "src/use/useAppDetails"
import { useStoreUser } from "src/stores/storeUser"
import { QRLightningHiveColor } from "src/use/useUtils"
import { Notify } from "quasar"
import { useI18n } from "vue-i18n"
import { nextTick } from "vue"
import CreateQRCode from "src/components/qrcode/CreateQRCode.vue"
import StepNumbers from "src/components/utils/StepNumbers.vue"
import ConfirmNewAccount from "src/components/hive/ConfirmNewAccount.vue"
import GetKeychain from "src/components/hive/GetKeychain.vue"

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
const voucher = ref("")
const respPaid = ref({})
const paymentRequest = ref({}) // Payment request object
const invoiceLoading = ref(false) // Loading state for the invoice
const activeItem = ref(1) // Active item in the stepper
const downloadedKeys = ref(false) // Checks if the keys have been downloaded
const showPayment = ref(false) // Shows the payment dialog
const invoicePaid = ref(false)
let initialTime = 0
const accountConfirm = ref(false) // Dialog to confirm account creation

// Watch for changes in downloadedKeys
watch(downloadedKeys, (newVal) => {
  if (newVal) {
    activeItem.value = 4
  }
})

const maxUseableWidth = computed(() => {
  if (q.screen.width < 460) {
    return q.screen.width - 120
  }
  return 350
})

const dotColor = computed(() => {
  return QRLightningHiveColor(true, false)
})

async function checkHiveAccountName() {
  if (accountName.value === null || accountName.value === "") {
    accountName.value = ""
    nameCheck.value = true
    nameCheckError.value = ""
    activeItem.value = 1
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
    activeItem.value = 2
  } else {
    // error
  }
}

function randomMasterPassword() {
  // Generate a random master password
  masterPassword.value = genRandAlphaNum(32)
  generateKeys()
  return
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
  downloadedKeys.value = false
  showPayment.value = false
  accountConfirm.value = false
}

async function handleSubmit() {
  requestInvoice()
}

async function handleCancel() {
  console.log("handleCancel")
  clearTimeout(checkTimeout)
  showPayment.value = false
  paymentRequest.value = {}
  progress.value = 1
  activeItem.value = 2
  downloadedKeys.value = false
  Notify.create({
    message: t("invoice_canceled"),
    color: "negative",
    position: "top",
    timeout: 2000,
  })
  invoiceLoading.value = false
  invoicePaid.value = false
  randomMasterPassword()
  generateKeys()
}

async function requestInvoice() {
  // First call to get an invoice
  showPayment.value = true
  invoiceLoading.value = true
  const accountData = {
    accountName: accountName.value,
    appId: useAppStr(),
    clientId: storeUser.clientId,
  }
  try {
    let resp
    while (true) {
      try {
        console.log("Trying /account/create")
        resp = await api.post("/account/create", accountData)
        console.log("resp", resp)
        if (resp.status !== 429) {
          break
        }
      } catch (error) {
        console.error("error in first /account/create", error)
      }
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
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

// used to cancel payment
let checkTimeout = null

// MARK: CheckPayment
// function to loop and call api invoice/check every second to check if payment is made
async function checkPayment(expiresAt) {
  try {
    const resp = await api.post(`check_invoice`, {
      r_hash: paymentRequest.value.r_hash,
    })
    if (resp.data.paid) {
      respPaid.value = resp.data
      console.log("paid")
      handlePaid()
      return
    }
    console.log("resp", resp.data)
    console.log("voucher", voucher.value)
    if (voucher.value) {
      respPaid.value = resp.data
      console.log("paid by voucher")
      handlePaid()
      return
    }
    if (resp.data.expired) {
      handleExpired()
      return
    }
    // Calculate progress
    if (expiresAt) {
      console.log("Checking payment", expiresAt)
      const currentTime = Math.floor(Date.now() / 1000) // get current time in seconds
      const totalDuration = expiresAt - currentTime
      const totalTime = expiresAt - initialTime
      progress.value = totalDuration / totalTime
      checkTimeout = setTimeout(() => checkPayment(expiresAt), 1000)
    }
  } catch (error) {
    clearTimeout(checkTimeout)
    console.error("error", error)
  }
}
function handleExpired() {
  console.log("handleExpired")
  clearTimeout(checkTimeout)
  invoiceLoading.value = true
  paymentRequest.value = {}
  progress.value = 1
  activeItem.value = 2
  downloadedKeys.value = false
  Notify.create({
    message: t("invoice_expired"),
    color: "negative",
    position: "top",
    timeout: 5000,
  })
  invoiceLoading.value = true
  showPayment.value = false
  invoiceLoading.value = false
  invoicePaid.value = false
  randomMasterPassword()
  generateKeys()
}

async function handlePaid() {
  console.log("paid")
  clearTimeout(checkTimeout)
  nextTick(() => {
    invoicePaid.value = true
  })
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
  if (voucher.value) {
    accountData["paymentVoucher"] = voucher.value
  }
  try {
    let resp
    while (true) {
      try {
        resp = await api.post("/account/create_complete", accountData)
        console.log("resp", resp)
        if (resp.status !== 429) {
          break
        }
      } catch (error) {
        console.error("error", error)
      }
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
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
      console.log("show successes and next steps")
      accountConfirm.value = true
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
    keychain: {
      name: accountName.value,
      keys: {
        active: activeKey.toString(),
        activePubkey: activeKey.createPublic().toString(),
        posting: postingKey.toString(),
        postingPubkey: postingKey.createPublic().toString(),
        memo: memoKey.toString(),
        memoPubkey: memoKey.createPublic().toString(),
      },
    },
  }
}

function copyKeys() {
  // Copy the keys to the clipboard
  activeItem.value = 3
  copyToClipboard(keysText.value)
}
function downloadKeys() {
  // Generate the text file
  activeItem.value = 3

  // Create a Blob from the data
  const blob = new Blob([keysText.value], { type: "text/plain" })
  const url = URL.createObjectURL(blob)

  // Create a link and programmatically click it
  const link = document.createElement("a")
  link.href = url
  link.download = `HIVE_${accountName.value.toUpperCase()}_KEYS.txt`
  document.body.appendChild(link) // Append the link to the body
  link.click()

  // Remove the link from the DOM
  document.body.removeChild(link)

  // Revoke the URL to free up memory
  URL.revokeObjectURL(url)
}

const keysText = computed(() => {
  const data = `
  Hive Username: ${accountName.value}

  Owner Key: ${keys.value.private.owner}

  Active Key: ${keys.value.private.active}

  Posting Key: ${keys.value.private.posting}

  Memo Key: ${keys.value.private.memo}

  Backup (Master) Password: ${masterPassword.value}
  `
  return data
})
</script>

<style lang="scss" scoped>
.content-container {
  display: flex;
  flex-direction: column;
}

.main-content {
  // border: 1px solid #ccc;
  /* Your main content styles */
}

.sidebar {
  // border: 1px solid #cccccc;
  /* Your sidebar styles */
}

/* Media query for screens wider than 460px */
@media (min-width: 650px) {
  .content-container {
    flex-direction: row;
  }

  .main-content {
    flex: 1;
  }

  .sidebar {
    width: 200px; /* Adjust as needed */
  }
}

.large-font {
  font-size: 1.8rem;
}

.border-div {
  border: 1px solid #ccc;
  border-radius: 5px;
}

.full-width {
  width: 100%;
}

.overlay-container {
  position: relative;
}

.overlay-container::after {
  content: "";
  display: none;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  transform: translate(-50%, -50%);
  background-image: url("/avatars/green-tick.svg"); /* Replace with the path to your green tick image */
  background-size: contain;
  background-repeat: no-repeat;
  animation: fadeIn 0.2s ease-in-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.9;
  }
}

.overlay-container.show-tick::after {
  display: block;
  opacity: 0.9;
}

.animated {
  animation-duration: 1s; /* Adjust this value to change the animation speed */
}
</style>
