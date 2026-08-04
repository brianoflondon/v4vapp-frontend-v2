<template>
  <div>
    <ConfettiExplosion v-if="visible" />
  </div>
  <q-card
    @click="changeBackground"
    class="credit-card-background q-ma-xs"
    v-touch-swipe.mouse="handleSwipe"
    draggable="false"
  >
    <q-img
      :src="creditCardBackground"
      width="365px"
      basic
      style="border-radius: 15px"
    />
    <div class="stored-sats">
      <div class="credit-card-shading" :style="creditCardShading">
        <div class="items-end flex row">
          <div class="card-spacer row col-12"></div>
          <!-- Binance balance on the face of the credit card -->
          <div
            class="row col-12 binance-balance"
            v-if="storeUser.currentKeepSats?.binance"
          >
            <div class="col-7"></div>
            <div class="text-h6 credit-card-text embossed-text text-right">
              {{ tidyNumber(storeUser?.currentKeepSats?.binance?.SATS) }}
              sats<br />
              {{ tidyNumber(storeUser?.currentKeepSats?.binance?.HIVE, 0) }}
              Hive
            </div>
          </div>
          <div class="row col-12" v-if="false">
            <div class="text-h6 credit-card-text embossed-text"></div>
          </div>
          <!-- Sats balance on the face of the credit card -->
        </div>
      </div>
    </div>
    <q-img
      :src="creditCardOverlay"
      width="365px"
      style="position: absolute; top: 0; left: 0; border-radius: 15px"
    />
    <q-spinner-rings
      v-if="storeUser.dataLoading"
      color="white"
      size="lg"
      style="position: absolute; top: 30%; left: 8%"
    />

    <!-- Prominent re-auth warning on the card body (near where the reload spinner appears).
         Only shown after an actual refresh failure. Click to open the auth flow for this account. -->
    <div
      v-if="storeUser.currentReauthNeeded && !storeUser.dataLoading"
      class="reauth-warning cursor-pointer"
      style="
        position: absolute;
        top: 24%;
        left: 7%;
        z-index: 20;
        background: rgba(0, 0, 0, 0.45);
        border-radius: 50%;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      "
      @click="triggerReauth"
    >
      <q-icon
        name="warning"
        color="orange"
        size="2.6rem"
      >
        <q-tooltip>
          Session problem for @{{ storeUser.currentUser }}.<br>
          Tap to log back in with Passkey
        </q-tooltip>
      </q-icon>
    </div>

    <q-card-section
      v-if="storeUser.currentUser"
      class="credit-card-strip absolute-bottom q-py-xs q-px-sm text-subtitle2 text-left"
      :style="creditCardStripStyle"
    >
      <div class="credit-card-text row items-top justify-between">
        <!-- Name avatar and buttons -->
        <div class="profile-details col-7 flex items-center">
          <div class="credit-card-avatar">
            <q-avatar v-if="storeUser.loginType === 'hive'" rounded size="lg">
              <HiveAvatar :hiveAccname="storeUser.hiveAccname" />
            </q-avatar>
            <q-avatar v-if="storeUser.loginType === 'evm'" round size="lg">
              <i class="fa-brands fa-ethereum"></i>
              <q-tooltip>
                {{ storeUser.profileName }}<br />
                @{{ storeUser.currentUser }}
              </q-tooltip>
            </q-avatar>
          </div>
          <div class="credit-card-text q-pl-sm">
            <div class="profile-name text-h7 embossed-text">
              {{ storeUser.profileName }}
            </div>
            <div v-if="storeUser.loginType === 'hive'" class="text-subtitle2">
              {{ storeUser.hiveAccname }}@v4v.app
            </div>
          </div>

          <!-- No visual re-auth nag here. With the new short-token model + proactive cookie restore,
               balances for cookie-capable accounts load silently. Legacy keychain accounts will simply
               have no KeepSats until the user performs a fresh keychain signature for them. -->
          <div class="row">
            <div style="font-size: 1.2rem">
              <q-checkbox
                v-model="currencyToggle"
                size="sm"
                unchecked-icon="currency_exchange"
                checked-icon="currency_exchange"
                :label="storeUser.localCurrency.unit"
              >
              </q-checkbox>
              <q-tooltip>{{ $t("savings_tooltip") }}</q-tooltip>
            </div>
            <div class="q-px-sm" style="font-size: 0.7rem">
              <q-checkbox
                v-model="savingsToggle"
                size="sm"
                checked-icon="savings"
                unchecked-icon="savings"
                :label="$t('savings')"
              >
              </q-checkbox>
              <q-tooltip>{{ $t("savings_tooltip") }}</q-tooltip>
            </div>
          </div>
        </div>
        <!-- End Name avatar and buttons -->
        <!-- Table for the balances  -->
        <div class="col-5 text-right">
          <div class="row justify-end">
            <table>
              <tbody>
                <tr>
                  <td class="keepsats-table-cell">KeepSats</td>
                </tr>
                <tr v-if="nonZeroKeepSats">
                  <td class="numeric-cell-lg">
                    <span v-if="currencyToggle" style="font-size: 1rem">
                      {{ storeUser.localCurrency.unit }}
                    </span>
                    {{ balances["keepSats"] }}<br />
                  </td>
                  <td class="numeric-cell">
                    <div v-if="!balances['bitcoinDisplay']">
                      <span>シ</span>
                      <q-tooltip>シ = {{ $t("sats") }}</q-tooltip>
                    </div>
                    <div v-else>
                      <span><i class="fa-brands fa-btc" /></span>
                      <q-tooltip>Bitcoin</q-tooltip>
                    </div>
                  </td>
                  <td class="keepsats-table-cell numeric-cell q-pl-sm">
                    <div v-if="!balances['bitcoinDisplay']">sats</div>
                    <div v-else>BTC</div>
                  </td>
                </tr>
                <tr>
                  <td class="numeric-cell">
                    <span v-if="currencyToggle">
                      {{ storeUser.localCurrency.unit }}
                    </span>
                    {{ balances["hive"] }}<br />
                  </td>
                  <td>
                    <q-icon name="fa-brands fa-hive" />
                  </td>
                  <td class="keepsats-table-cell numeric-cell q-pl-sm">Hive</td>
                </tr>
                <tr>
                  <td class="numeric-cell">
                    <span v-if="currencyToggle">
                      {{ storeUser.localCurrency.unit }}
                    </span>
                    {{ balances["hbd"] }}
                  </td>
                  <td class="numeric-cell q-pl-sm">
                    <HbdLogoIcon />
                  </td>
                  <td class="keepsats-table-cell numeric-cell q-pl-sm">HUSD</td>
                </tr>
                <!-- VSC app liability HBD (pay-with-HBD deposits held on books)
                <tr v-if="vscHbdBalance !== null">
                  <td class="numeric-cell">
                    {{ vscHbdBalance }}
                  </td>
                  <td class="numeric-cell q-pl-sm">
                    <HbdLogoIcon />
                  </td>
                  <td class="keepsats-table-cell numeric-cell q-pl-sm">
                    App HBD
                    <q-tooltip
                      >HBD held in v4vapp (ledger), not your on-chain wallet</q-tooltip
                    >
                  </td>
                </tr> -->
                <!-- <tr v-if="vscHiveBalance !== null">
                  <td class="numeric-cell">
                    {{ vscHiveBalance }}
                  </td>
                  <td>
                    <q-icon name="fa-brands fa-hive" />
                  </td>
                  <td class="keepsats-table-cell numeric-cell q-pl-sm">
                    App Hive
                    <q-tooltip
                      >Hive held in v4vapp (ledger), not your on-chain wallet</q-tooltip
                    >
                  </td>
                </tr> -->
                <!-- Lower summation of Hive amounts -->
                <tr v-if="false">
                  <td
                    class="table-border-top numeric-cell q-pt-xs"
                    style="border-top: 1px solid"
                  >
                    <strong>{{ balances["sats"] }}</strong
                    ><br />
                    <div style="font-size: 0.7rem; line-height: 0.3rem">
                      +<q-icon name="savings"></q-icon>&nbsp;{{
                        balances["totalSats"]
                      }}
                    </div>
                  </td>
                  <td>
                    シ
                    <q-tooltip>シ = {{ $t("sats") }}</q-tooltip>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Lower summation of Hive amounts -->
        </div>
        <!-- Table for the balances  -->
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { useStoreUser } from "src/stores/storeUser"
import HiveAvatar from "components/utils/HiveAvatar.vue"
import { nextTick, computed, ref, onMounted, watch } from "vue"
import { useQuasar } from "quasar"
import HbdLogoIcon from "../utils/HbdLogoIcon.vue"
import { tidyNumber } from "src/use/useUtils"
import { useI18n } from "vue-i18n"
import { useCoingeckoStore } from "src/stores/storeCoingecko"
import { useKeychainLoginFlow } from "src/use/useKeychain"
import { usePasskeyLogin } from "src/use/usePasskeys"
import { authError, authDebug } from "src/utils/authDebug"
import {
  creditCardBackgrounds,
  creditCardBackgroundUrl,
} from "src/utils/creditCardBackgrounds"
const storeCoingecko = useCoingeckoStore()

// import { useLocalCurrencyBalances } from "src/use/useCurrencyCalc"
import ConfettiExplosion from "vue-confetti-explosion"

const storeUser = useStoreUser()
const q = useQuasar()
const savingsToggle = ref(false)
const currencyToggle = ref(false)
const t = useI18n().t

// emit balances to the parent component
const emit = defineEmits(["balances"])

const backgroundImage = creditCardBackgrounds

/**
 * ConfettiExplosion component
 */
const visible = ref(false)
async function explode() {
  visible.value = false
  await nextTick()
  visible.value = true
}

let timeoutId = null

const maxValue = backgroundImage.length
// generate random number between 0 and 1
const backgroundIndex = ref(Math.floor(Math.random() * maxValue))

onMounted(async () => {
  scheduleUpdate()
})

watch(
  () => storeUser.keepSatsBalanceNum,
  (newVal, oldVal) => {
    // This function will be called whenever `storeUser.keepSatsBalance` changes
    if (oldVal === "💰💰💰") {
      oldVal = 0
    }
    if (newVal === "💰💰💰") {
      newVal = 0
    }
    authDebug(
      "keepSatsBalance changed from",
      oldVal,
      "to",
      newVal,
      "delta:",
      newVal - oldVal,
    )
    const satsChange = tidyNumber(newVal - oldVal, 0)
    // check if satsChange is a number and not 0

    if (oldVal !== undefined && satsChange !== 0) {
      const color = newVal - oldVal > 0 ? "positive" : "negative"
      explode()
      q.notify({
        message: `${t("balance_changed")} ${satsChange} sats`,
        color: color,
        position: "top-left",
        icon: "savings",
        timeout: 5000,
        actions: [
          {
            icon: "close",
            round: true,
            color: "white",
            handler: () => {},
          },
        ],
      })
    }
    // You can add your own code here to do something when `storeUser.keepSatsBalance` changes
  },
)

function handleSwipe(e) {
  const users = Object.values(storeUser.users)
  const currentUser = storeUser.currentUser

  if (!Array.isArray(users)) {
    authError("storeUser.users is not an array")
    return
  }

  const currentIndex = users.findIndex(
    (user) => user.hiveAccname === currentUser,
  )

  if (e.direction === "left") {
    // Switch to the next user
    const nextIndex = (currentIndex + 1) % users.length
    storeUser.switchUser(users[nextIndex].hiveAccname)
  } else if (e.direction === "right") {
    // Switch to the previous user
    const nextIndex = (currentIndex - 1 + users.length) % users.length
    storeUser.switchUser(users[nextIndex].hiveAccname)
  }
}

async function scheduleUpdate() {
  // In the new model we only periodically refresh the current user if they
  // are part of the current browser session. This reduces unnecessary
  // /auth/refresh traffic when the user has multiple accounts attached.
  if (storeUser.currentUser && storeUser.isAccountInCurrentSession?.(storeUser.currentUser)) {
    await storeUser.update(false)
  }
  // Schedule the next update after 5 minutes
  timeoutId = setTimeout(scheduleUpdate, 5 * 60 * 1000)
}

/**
 * Trigger re-authentication for the current account.
 * - For webauthn/passkey accounts: asks for confirmation then triggers the passkey flow directly.
 * - For keychain accounts: starts the keychain signature flow.
 *
 * This is called when the user taps the warning icon on the CreditCard,
 * or can be called programmatically when we detect a refresh/auth failure
 * for the current account.
 */
async function triggerReauth() {
  if (!storeUser.currentUser) return

  const acc = storeUser.currentUser
  storeUser.clearReauthNeeded(acc)

  const isWebauthn = storeUser.authKey === 'webauthn'

  if (isWebauthn) {
    // Ask the user before popping the passkey prompt (good UX on mobile)
    q.dialog({
      title: 'Session expired',
      message: `Your passkey session for @${acc} needs to be refreshed. Log back in now?`,
      cancel: true,
      persistent: true,
    }).onOk(async () => {
      try {
        const result = await usePasskeyLogin(acc)
        if (result.success) {
          await storeUser.login(
            acc,
            'active',
            'webauthn',
            null,
            null,
            result.token,
            'hive'
          )
          q.notify({
            message: 'Re-authenticated successfully with Passkey',
            color: 'positive',
            timeout: 3000,
          })
        } else {
          q.notify({
            message: `Passkey re-auth failed: ${result.message || 'Unknown error'}`,
            color: 'negative',
          })
        }
      } catch (err) {
        authError('Passkey re-auth error:', err)
        q.notify({
          message: 'Failed to start passkey re-authentication',
          color: 'negative',
        })
      }
    })
    return
  }

  // Keychain (or other non-passkey hive login)
  try {
    const hiveAccObj = { value: acc }
    const keyType = storeUser.user?.keySelected || 'Active'
    const props = { keyType }
    await useKeychainLoginFlow(hiveAccObj, props)
  } catch (err) {
    authError('Re-auth keychain flow error:', err)
    q.notify({
      message: `Failed to start re-auth for @${acc}. Please try from the side menu.`,
      color: 'negative',
    })
  }
}

const lightDark = computed(() => {
  if (q.dark.isActive) {
    return "dark"
  }
  return "light"
})

const nonZeroKeepSats = computed(() => {
  authDebug("[DEBUG-KeepSats] nonZeroKeepSats — currentKeepSats:", storeUser.currentKeepSats, "keepSatsBalance:", storeUser.keepSatsBalance, "keepSatsBalanceNum:", storeUser.keepSatsBalanceNum)
  if (storeUser.currentKeepSats) {
    if (storeUser.currentKeepSats !== "0") {
      return true
    }
  }
  return false
})

/** VSC liability HBD held on the app (not on-chain wallet HBD). */
const vscHbdBalance = computed(() => {
  const v = Number(storeUser.currentKeepSats?.net_hbd ?? 0)
  if (!Number.isFinite(v) || Math.abs(v) < 0.0005) return null
  return tidyNumber(v, 3)
})

/** VSC liability HIVE held on the app (not on-chain wallet HIVE). */
const vscHiveBalance = computed(() => {
  const v = Number(storeUser.currentKeepSats?.net_hive ?? 0)
  if (!Number.isFinite(v) || Math.abs(v) < 0.0005) return null
  return tidyNumber(v, 3)
})

// needsReauth removed per user feedback — visual warnings/tags for re-keychain were
// cluttering the design. The underlying restore logic (ensureAccessToken etc.) remains
// so cookie-backed accounts (webauthn/passkey) continue to work silently after reloads.

const balances = computed(() => {
  if (currencyToggle.value) {
    if (savingsToggle.value) {
      return {
        hive: storeUser.savingsHiveBalanceLocal,
        hbd: storeUser.savingsHbdBalanceLocal,
        sats: storeUser.savingsSatsBalance,
        totalSats: storeUser.totalSatsBalance,
        keepSats: storeUser.keepSatsBalanceLocal,
        bitcoinDisplay: storeUser.bitcoinDisplay,
      }
    } else {
      return {
        hive: storeUser.hiveBalanceLocal,
        hbd: storeUser.hbdBalanceLocal,
        sats: storeUser.satsBalance,
        totalSats: storeUser.totalSatsBalance,
        keepSats: storeUser.keepSatsBalanceLocal,
        bitcoinDisplay: storeUser.bitcoinDisplay,
      }
    }
  } else {
    if (savingsToggle.value) {
      return {
        hive: storeUser.savingsHiveBalance,
        hbd: storeUser.savingsHbdBalance,
        sats: storeUser.savingsSatsBalance,
        totalSats: storeUser.totalSatsBalance,
        keepSats: storeUser.keepSatsBalance,
        bitcoinDisplay: storeUser.bitcoinDisplay,
      }
    } else {
      return {
        hive: storeUser.hiveBalance,
        hbd: storeUser.hbdBalance,
        sats: storeUser.satsBalance,
        totalSats: storeUser.totalSatsBalance,
        keepSats: storeUser.keepSatsBalance,
        bitcoinDisplay: storeUser.bitcoinDisplay,
      }
    }
  }
})

const creditCardStripStyle = computed(() => {
  if (q.dark.isActive) {
    return "background: rgba(0, 0, 0, 0.4)"
  } else {
    return "background: rgba(200, 200, 200, 0.8)"
  }
})
const creditCardOverlay = computed(() => {
  return `/credit-card/overlay/${lightDark.value}/credit-card.webp`
})
const creditCardBackground = computed(() => {
  return creditCardBackgroundUrl(backgroundImage[backgroundIndex.value])
})
const creditCardShading = computed(() => {
  if (q.dark.isActive) {
    return "background: rgba(0, 0, 0, 0.6)"
  } else {
    return "background: rgba(0, 0, 0, 0)"
  }
})

function changeBackground() {
  backgroundIndex.value = (backgroundIndex.value + 1) % maxValue
  storeUser.update(false)
  explode()
}

watch([() => storeUser.localCurrency, () => storeUser.pos.fixedRate], () => {
  storeCoingecko.getCoingeckoRate(storeUser.localCurrency.value)
  storeUser.update()
})
</script>

<style lang="scss" scoped>
.div-border {
  border: 1px solid black;
}

.profile-name {
  font-weight: bold;
  word-wrap: break-word;
}

.card-spacer {
  height: 4.5rem;
}
.credit-card-background {
  position: relative;
  width: 365px;
  height: auto;
  border-radius: 15px;
  overflow: hidden;
}

.credit-card-shading {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border-radius: 15px;
}

.credit-card-aspect-ratio {
  width: 100%;
  height: 0;
  padding-bottom: calc(
    100% / 1.586
  ); /* Set the padding-bottom to achieve the desired aspect ratio */
  background-size: cover;
  border-radius: 12px;
  opacity: 1;
}

.numeric-cell {
  text-align: right;
  line-height: 0.9rem;
}

.numeric-cell-lg {
  text-align: right;
  font-size: 1.5rem;
  padding: 0px;
  margin: 0px;
  line-height: 1.3rem;
}

.keepsats-table-cell {
  padding: 0px;
  margin: 0px;
  text-align: left;
  font-size: 0.6rem;
  line-height: 0.6rem;
}
</style>
