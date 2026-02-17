<template>
  <q-page>
    <div class="outer-wrapper row justify-center q-pt-lg">
      <div class="q-pa-md status-page-container">
        <!-- Header Card -->
        <q-card flat bordered class="q-mb-lg">
          <q-card-section horizontal>
            <q-card-section class="col">
              <div class="text-overline text-orange-9">V4V.app</div>
              <div class="text-h5 q-mt-sm q-mb-xs">{{ $t("status") }}</div>
              <div class="text-body2 q-mt-sm">
                <a href="https://peakd.com/created/v4vapp-v2" target="_blank">
                  Building the next v4v.app v2
                </a>
              </div>
              <p class="text-right text-caption q-mt-sm q-mb-none">
                {{ appName }} v{{ appVersion }}
              </p>
            </q-card-section>
            <a
              href="https://peakd.com/hive-110369/@v4vapp/hive-to-lightning-gateway-fees"
              target="_blank"
            >
              <q-img
                src="/site-logo/v4vapp-logo-shadows.svg"
                style="max-width: 150px; min-width: 100px"
                class="q-ma-sm"
              />
            </a>
          </q-card-section>
        </q-card>

        <!-- Loading -->
        <div v-if="loading" class="text-center q-pa-xl">
          <q-spinner-dots size="40px" color="primary" />
          <p class="q-mt-md text-body2">Loading gateway status...</p>
        </div>

        <template v-if="hiveConfig">
          <!-- Gateway Status -->
          <q-card flat bordered class="q-mb-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">Gateway Status</div>
              <div class="row q-gutter-md">
                <q-chip
                  :color="!hiveConfig.closed_get_lnd ? 'green' : 'red'"
                  text-color="white"
                  icon="flash_on"
                  size="lg"
                >
                  Hive → Lightning:
                  {{ !hiveConfig.closed_get_lnd ? "OPEN" : "CLOSED" }}
                </q-chip>
                <q-chip
                  :color="!hiveConfig.closed_get_hive ? 'green' : 'red'"
                  text-color="white"
                  icon="flash_on"
                  size="lg"
                >
                  Lightning → Hive:
                  {{ !hiveConfig.closed_get_hive ? "OPEN" : "CLOSED" }}
                </q-chip>
              </div>
              <div class="q-mt-sm text-body2">
                <p v-if="!hiveConfig.closed_get_lnd">
                  You can swap Hive or HBD for sats at:
                  <a href="https://v4v.app" target="_blank">v4v.app</a>
                </p>
                <p v-if="!hiveConfig.closed_get_hive">
                  You can send Lightning as Hive or HBD to any Hive account:
                  <a href="https://v4v.app/pos" target="_blank"
                    >v4v.app/pos</a
                  >
                </p>
              </div>
            </q-card-section>
          </q-card>

          <!-- Current Fees -->
          <q-card flat bordered class="q-mb-lg" v-if="storeAPI.apiStatus">
            <q-card-section>
              <div class="text-h6 q-mb-xs">Current Fees</div>
              <div class="text-caption q-mb-md">UTC: {{ currentUTCTime }}</div>
              <p class="text-body2">
                These are the current fees charged by
                <strong>@V4VApp</strong> when swapping Hive or HBD into or from
                Lightning. All fees are converted from Sats to Hive/HBD using
                live rates which are averaged from a number of sources including
                CoinGecko, Binance and Hive's internal HBD market:
                <a href="https://api.v4v.app/v1/cryptoprices/" target="_blank"
                  >@V4VApp's API</a
                >.
              </p>
              <q-markup-table flat bordered separator="cell" wrap-cells>
                <thead>
                  <tr>
                    <th class="text-left">Fee</th>
                    <th class="text-right">Sats</th>
                    <th class="text-right">Hive</th>
                    <th class="text-right">HBD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Conversion fee (flat)</td>
                    <td class="text-right">
                      {{ tidyNumber(hiveConfig.conv_fee_sats, 0) }} sats
                    </td>
                    <td class="text-right">{{ convFeeHive }} Hive</td>
                    <td class="text-right">{{ convFeeHBD }} HBD</td>
                  </tr>
                  <tr>
                    <td>Conversion fee (percentage)</td>
                    <td class="text-right">
                      {{ (hiveConfig.conv_fee_percent * 100).toFixed(2) }}%
                    </td>
                    <td class="text-right"></td>
                    <td class="text-right"></td>
                  </tr>
                  <tr>
                    <td>Minimum invoice</td>
                    <td class="text-right">
                      {{ tidyNumber(storeAPI.minMax?.sats?.min, 0) }} sats
                    </td>
                    <td class="text-right">
                      {{ tidyNumber(storeAPI.minMax?.HIVE?.min, 2) }} Hive
                    </td>
                    <td class="text-right">
                      {{ tidyNumber(storeAPI.minMax?.HBD?.min, 2) }} HBD
                    </td>
                  </tr>
                  <tr>
                    <td>Maximum invoice</td>
                    <td class="text-right">
                      {{ tidyNumber(storeAPI.minMax?.sats?.max, 0) }} sats
                    </td>
                    <td class="text-right">
                      {{ tidyNumber(storeAPI.minMax?.HIVE?.max, 2) }} Hive
                    </td>
                    <td class="text-right">
                      {{ tidyNumber(storeAPI.minMax?.HBD?.max, 2) }} HBD
                    </td>
                  </tr>
                </tbody>
              </q-markup-table>
            </q-card-section>
          </q-card>

          <!-- Rate Limits -->
          <q-card flat bordered class="q-mb-lg" v-if="rateLimits.length">
            <q-card-section>
              <div class="text-h6 q-mb-md">Rate Limits</div>
              <p class="text-body2">
                Each Hive user is limited to the following amounts per period:
              </p>
              <q-markup-table flat bordered separator="cell" wrap-cells>
                <thead>
                  <tr>
                    <th class="text-left">Period</th>
                    <th class="text-right">Limit (sats)</th>
                    <th class="text-right">Hive</th>
                    <th class="text-right">HBD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="limit in rateLimits" :key="limit.hours">
                    <td>{{ limit.hours }} hours</td>
                    <td class="text-right">{{ tidyNumber(limit.sats, 0) }}</td>
                    <td class="text-right">{{ limit.hive }} Hive</td>
                    <td class="text-right">{{ limit.hbd }} HBD</td>
                  </tr>
                </tbody>
              </q-markup-table>
            </q-card-section>
          </q-card>

          <!-- HBD to Sats Examples -->
          <q-card flat bordered class="q-mb-lg" v-if="hbdExamples.length">
            <q-card-section>
              <div class="text-h6 q-mb-md">HBD to Sats Examples</div>
              <p class="text-body2">
                The following amounts of HBD will give approximately this many
                sats:
              </p>
              <q-markup-table flat bordered separator="cell">
                <thead>
                  <tr>
                    <th class="text-right">HBD</th>
                    <th class="text-right">Sats</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ex in hbdExamples" :key="ex.hbd">
                    <td class="text-right">{{ ex.hbd }}</td>
                    <td class="text-right">{{ ex.sats }}</td>
                  </tr>
                </tbody>
              </q-markup-table>
            </q-card-section>
          </q-card>

          <!-- Notes -->
          <q-card flat bordered class="q-mb-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">Notes</div>
              <q-list separator>
                <q-item v-for="(note, i) in feeNotes" :key="i">
                  <q-item-section avatar top>
                    <q-icon name="info_outline" color="primary" size="sm" />
                  </q-item-section>
                  <q-item-section>
                    <div class="text-body2" v-html="note" />
                  </q-item-section>
                </q-item>
              </q-list>
              <p class="text-body2 q-mt-md text-italic">
                This service is offered as an experimental service: if you have
                any issues using it the utmost efforts will be made to make you
                happy.
              </p>
            </q-card-section>
          </q-card>
        </template>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useAppDetails } from "src/use/useAppDetails.js"
import { useStoreAPIStatus } from "src/stores/storeAPIStatus"
import { useHiveDetails } from "src/use/useHive"
import { tidyNumber } from "src/use/useUtils"
import { serverHiveAccount } from "boot/axios"

const { appName, appVersion } = useAppDetails()
const storeAPI = useStoreAPIStatus()

// Vote options removed
// const voteOptions = ref({
//   hiveUser: "",
//   showButton: true,
// })

const loading = ref(true)
const hiveConfig = ref(null)

// Force fresh data every time the page is visited
onMounted(async () => {
  // Refresh live prices from the API
  await storeAPI.update()

  // Fetch the v4vapp_hiveconfig fresh from the Hive blockchain
  try {
    const details = await useHiveDetails(serverHiveAccount)
    if (details?.posting_json_metadata) {
      const metadata = JSON.parse(details.posting_json_metadata)
      console.debug("Raw posting_json_metadata:", metadata)
      console.debug("v4vapp_hiveconfig:", metadata.v4vapp_hiveconfig)
      hiveConfig.value = metadata.v4vapp_hiveconfig || null
    }
  } catch (e) {
    console.error("Failed to fetch hive config:", e)
  } finally {
    loading.value = false
  }
})

// Current UTC time string
const currentUTCTime = computed(() => {
  const now = new Date()
  const hours = String(now.getUTCHours()).padStart(2, "0")
  const minutes = String(now.getUTCMinutes()).padStart(2, "0")
  const day = now.getUTCDate()
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  const month = months[now.getUTCMonth()]
  const year = now.getUTCFullYear()
  return `${hours}:${minutes} ${day} ${month} ${year}`
})

// Conversion fee in Hive
const convFeeHive = computed(() => {
  if (!hiveConfig.value || !storeAPI.hiveSatsNumber) return "—"
  const fee = hiveConfig.value.conv_fee_sats / storeAPI.hiveSatsNumber
  return tidyNumber(fee.toFixed(3), 3)
})

// Conversion fee in HBD
const convFeeHBD = computed(() => {
  if (!hiveConfig.value || !storeAPI.HBDSatsNumber) return "—"
  const fee = hiveConfig.value.conv_fee_sats / storeAPI.HBDSatsNumber
  return tidyNumber(fee.toFixed(3), 3)
})

// Rate limits with Hive/HBD equivalents
const rateLimits = computed(() => {
  if (!hiveConfig.value?.lightning_rate_limits) return []
  if (!storeAPI.hiveSatsNumber || !storeAPI.HBDSatsNumber) return []

  return hiveConfig.value.lightning_rate_limits.map((limit) => ({
    hours: limit.hours,
    sats: limit.sats,
    hive: tidyNumber((limit.sats / storeAPI.hiveSatsNumber).toFixed(1), 1),
    hbd: tidyNumber((limit.sats / storeAPI.HBDSatsNumber).toFixed(1), 1),
  }))
})

// HBD to Sats example amounts
const hbdExamples = computed(() => {
  if (!hiveConfig.value || !storeAPI.HBDSatsNumber) return []

  const amounts = [1, 2, 5, 10, 20, 50]
  return amounts.map((hbd) => {
    const grossSats = hbd * storeAPI.HBDSatsNumber
    const netSats =
      (grossSats - hiveConfig.value.conv_fee_sats) *
      (1 - hiveConfig.value.conv_fee_percent)
    return {
      hbd: hbd,
      sats: tidyNumber(Math.round(netSats), 0),
    }
  })
})

// Fee notes (static text matching the original status page)
const feeNotes = [
  "Fees are only charged when converting Hive/HBD into sats or vice versa.",
  "Depositing Sats and Paying With Sats (<strong>PayWithSats</strong> and <strong>KeepSats</strong>) will not have significant fees (there is a 0.001 Hive fee for notifications).",
  'If sats are sent to the Lightning Address <code>yourhivename@sats.v4v.app</code> they will be held as <strong>KeepSats</strong> on <a href="https://v4v.app" target="_blank">v4v.app</a>. You can use these sats to pay for a Lightning invoice without being charged a conversion fee.',
  "If sats are sent to <code>yourhivename@v4v.app</code> you will receive <strong>Hive</strong> after a fee is deducted. If they are sent to <code>yourhivename@hbd.v4v.app</code> you will receive <strong>HBD</strong> again after a fee.",
  'Converting a sats balance held as <strong>KeepSats</strong> on <a href="https://v4v.app" target="_blank">v4v.app</a> to Hive/HBD will carry a fee.',
  "Rates are taken from publicly available rate APIs as close to the transaction time as possible.",
]
</script>

<style lang="sass" scoped>
.status-page-container
  max-width: 800px
  width: 100%

a
  color: $primary
  text-decoration: none
  &:hover
    text-decoration: underline
</style>
