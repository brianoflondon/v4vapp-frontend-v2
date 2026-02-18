<template>
  <q-page>
    <div class="flex column text-center items-center q-pa-none">
      <div class="pad-max-width full-width">
        <q-tabs
          v-model="currentTab"
          align="center"
          dense
          animated
          outside-arrows
          mobile-arrows
        >
          <q-tab name="realWallet" icon="wallet" :label="t('wallet')" />
          <q-tab name="send" icon="payments" :label="$t('send')" />
          <q-tab
            name="receive"
            icon="request_quote"
            :label="$t('receive')"
            :disable="!storeUser.currentUser"
          >
            <q-tooltip>{{ $t("receive_sats_on_v4vapp") }}</q-tooltip>
          </q-tab>
          <q-tab
            name="convert"
            icon="currency_exchange"
            :label="$t('convert')"
            :disable="!storeUser.currentUser"
          >
            <q-tooltip>{{ $t("convert_sats_from_v4vapp") }}</q-tooltip>
          </q-tab>
          <q-tab
            name="history"
            icon="receipt_long"
            :label="$t('history')"
            :disable="!storeUser.currentUser"
          >
            <q-tooltip>{{ $t("login_to_see_history") }}</q-tooltip>
          </q-tab>
          <!-- <q-tab name="other" :label="$t('other')" /> -->
        </q-tabs>
      </div>

      <!-- Q-tab-panels -->
      <q-tab-panels v-model="currentTab">
        <q-tab-panel name="realWallet">
          <q-slide-transition appear disappear :duration="500">
            <div
              class="div flex row pad-max-width full-width q-px-xs q-py-xs"
            ></div>
          </q-slide-transition>
        </q-tab-panel>
        <q-tab-panel name="history">
          <q-slide-transition appear disappear :duration="1500">
            <div class="div flex row pad-max-width full-width q-px-xs q-py-xs">
              <div class="full-width">
                <HiveLightningKeepSatsTrans :adminOverride="adminOverride" />
              </div>
            </div>
          </q-slide-transition>
        </q-tab-panel>
        <!-- Send panel -->
        <q-tab-panel name="send">
          <q-slide-transition appear disappear :duration="500">
            <div class="div flex row pad-max-width full-width q-px-xs q-py-xs">
              <div class="outer-wrapper row justify-center q-gutter-sm q-pt-lg">
                <!-- Camera  -->
                <div v-if="!cameraShow" class="q-pb-lg"></div>
                <div v-if="cameraShow">
                  <QRcodeCamera @result="onDecode" />
                  <!-- <qrcode-stream
                    @detect="onDecode"
                    @camera-on="onReady"
                    @error="onError"
                  ></qrcode-stream> -->
                </div>
                <!-- End Camera -->
                <!-- Progress screen -->
                <div class="progress-screen">
                  <ShowProgress v-model="dInvoice" />
                </div>
                <!-- End Progress screen -->
                <!-- Payment buttons Camera Toggle, paste and invoice input -->
                <div class="camera-toggle-invoice" v-if="currentTab === 'send'">
                  <div class="column flex-center">
                    <div class="row justify-between items-center q-gutter-lg">
                      <div class="camera-toggle">
                        <q-toggle
                          v-model="cameraOn"
                          @update:model-value="toggleCamera()"
                          icon="qr_code"
                          size="xl"
                          color="primary"
                          dense
                          flat
                          toggle-aria-label="Capture QR code with your camera"
                        />
                      </div>
                      <q-btn
                        @click="pasteClipboard()"
                        icon="content_paste_go"
                        color="primary"
                        size="md"
                        rounded
                        :label="t('paste')"
                        :aria-label="t('paste_tooltip')"
                      />
                      <div>
                        <q-toggle
                          v-model="privateMemo"
                          icon="lock"
                          size="xl"
                          color="primary"
                          dense
                          flat
                          toggle-aria-label="Use a Private Hive Memo (needs Memo Key)"
                        />
                        <q-tooltip>{{ $t("private_memo") }} </q-tooltip>
                      </div>
                    </div>
                    <!-- Invoice and multipurpose input box -->
                    <div class="q-py-sm" v-if="dInvoice?.askDetailsButton">
                      <q-btn
                        icon="price_check"
                        color="secondary"
                        size="md"
                        rounded
                        :label="t('set_amount')"
                        aria-label="Set the amount"
                        @click="dInvoice.askDetails = true"
                      >
                        <q-tooltip>{{ $t("set_amount") }}</q-tooltip>
                      </q-btn>
                    </div>
                    <div class="column flex q-pt-sm q-px-sm">
                      <div class="multi-input-q-input">
                        <q-input
                          for="invoice"
                          name="invoice"
                          class="invoice-input"
                          :label="invoiceLabel"
                          data-1p-ignore
                          v-model="invoiceText"
                          @clear="clearReset"
                          autogrow
                          :placeholder="$t('enter_invoice')"
                          debounce="1000"
                          filled
                          :loading="invoiceChecking"
                          clearable
                          @update:model-value="decodeInvoice"
                          :error-message="errorMessage"
                          :error="invoiceValid === false"
                          :bg-color="invoiceColor"
                          @keyup.esc="clearReset"
                          :hint="invoiceHint"
                          hide-bottom-space
                        >
                          <template
                            v-if="dInvoice?.v4vapp?.sendTo"
                            v-slot:prepend
                          >
                            <q-avatar rounded size="md">
                              <HiveAvatar
                                :hiveAccname="dInvoice?.v4vapp?.sendTo"
                              />
                            </q-avatar>
                          </template>
                          <template
                            v-slot:append
                            v-if="dInvoice?.askDetailsButton"
                          >
                            <q-btn
                              icon="price_check"
                              color="secondary"
                              size="md"
                              rounded
                              aria-label="Set the amount"
                              @click="dInvoice.askDetails = true"
                            >
                              <q-tooltip>{{ $t("set_amount") }}</q-tooltip>
                            </q-btn>
                          </template>
                          <!-- hide-bottom-space: stops the animation for the hint text-->
                        </q-input>
                      </div>
                    </div>
                    <!-- End Invoice and multipurpose input box -->
                    <CountdownBar
                      class="q-pt-xs"
                      :expiry="dInvoice?.timeExpireDate"
                      @message="(val) => (timeMessage = val)"
                      @time-left="(val) => checkInvoiceProgress(val)"
                    />
                    <div
                      v-show="CurrencyCalc.amount"
                      class="full-width q-px-md"
                    >
                      <AlternateCurrency v-model="CurrencyCalc" />
                    </div>
                  </div>
                  <!-- Payment Buttons -->
                  <div
                    class="payment-buttons column q-pt-sm"
                    v-show="invoiceValid"
                  >
                    <div
                      class="row justify-center q-pa-sm"
                      v-if="enoughKeepSats"
                    >
                      <div class="paywithsats-button flex column">
                        <q-btn
                          class="payment-button-sats q-ma-sm"
                          @click="confirmPayWithApi(payWithSatsButton)"
                          :loading="storeApiStatus.payInvoice"
                          :disable="storeApiStatus.payInvoice"
                          icon="fa-brands fa-btc"
                          :label="payWithSatsButton"
                          :color="buttonColor.buttonColor"
                          :text-color="buttonColor.textColor"
                          size="md"
                          rounded
                          icon-right="img:/site-logo/v4vapp-logo-shadows.svg"
                        />
                      </div>
                    </div>
                    <div
                      v-if="
                        dInvoice?.v4vapp?.type !== 'hiveAccname' &&
                        !payWithSatsOnly
                      "
                    >
                      <div
                        class="keychain-buttons row flex-center q-pb-sm q-gutter-lg"
                      >
                        <q-btn
                          class="payment-button-hbd"
                          @click="payInvoice('HBD', 'HiveKeychain')"
                          :loading="storeApiStatus.payInvoice"
                          :disable="storeApiStatus.payInvoice"
                          icon="img:/keychain/hive-keychain-round.svg"
                          icon-right="img:/avatars/hbd_logo.svg"
                          :label="HBD"
                          :color="buttonColor.buttonColor"
                          :text-color="buttonColor.textColor"
                          size="md"
                          rounded
                        />
                        <q-btn
                          class="payment-button-hive"
                          @click="payInvoice('HIVE', 'HiveKeychain')"
                          :loading="storeApiStatus.payInvoice"
                          :disable="storeApiStatus.payInvoice"
                          icon="img:/keychain/hive-keychain-round.svg"
                          icon-right="img:avatars/hive_logo_dark.svg"
                          :label="Hive"
                          :color="buttonColor.buttonColor"
                          :text-color="buttonColor.textColor"
                          size="md"
                          rounded
                        />
                      </div>
                      <div class="has-buttons row flex-center q-gutter-lg">
                        <q-btn
                          class="payment-button-hbd"
                          @click="payInvoice('HBD', 'HAS')"
                          :loading="storeApiStatus.payInvoice"
                          :disable="storeApiStatus.payInvoice"
                          icon="img:/has/hive-auth-logo.svg"
                          icon-right="img:/avatars/hbd_logo.svg"
                          :label="HBD"
                          :color="buttonColor.buttonColor"
                          :text-color="buttonColor.textColor"
                          size="md"
                          rounded
                        />
                        <q-btn
                          class="payment-button-hive"
                          @click="payInvoice('HIVE', 'HAS')"
                          :loading="storeApiStatus.payInvoice"
                          :disable="storeApiStatus.payInvoice"
                          icon="img:/has/hive-auth-logo.svg"
                          icon-right="img:avatars/hive_logo_dark.svg"
                          :label="Hive"
                          :color="buttonColor.buttonColor"
                          :text-color="buttonColor.textColor"
                          size="md"
                          rounded
                        />
                      </div>
                    </div>
                  </div>
                  <!-- End Payment Buttons -->
                  <AskHASDialog v-if="HASDialog.show" v-model="HASDialog" />
                  <KeychainShowQR v-model="KeychainDialog" />
                  <!-- Vote Button -->
                  <div v-if="false" class="vote-button q-pa-lg text-center">
                    <VoteProposal v-model="voteOptions" />
                    <div style="max-width: 265px">
                      <ExplanationBox class="q-pt-md"></ExplanationBox>
                    </div>
                  </div>
                </div>
                <!-- End Payment buttons Camera Toggle, paste and invoice input -->
              </div>
            </div>
          </q-slide-transition>
        </q-tab-panel>
        <!-- End Send panel -->
        <q-tab-panel name="receive">
          <q-slide-transition appear disappear :duration="500">
            <div class="div flex row pad-max-width full-width q-px-xs q-py-xs">
              <ReceiveKeepsats />
            </div>
          </q-slide-transition>
        </q-tab-panel>
        <q-tab-panel name="convert">
          <q-slide-transition appear disappear :duration="500">
            <div class="div flex row pad-max-width full-width q-px-xs q-py-xs">
              <ConvertWrapper />
            </div>
          </q-slide-transition>
        </q-tab-panel>
      </q-tab-panels>
      <!-- End Q-tab-panels -->
      <!-- Credit Card Display -->
      <div class="lower-credit-card row justify-center q-gutter-sm q-pt-lg">
        <CreditCard />
      </div>
      <!-- End Credit Card Display -->
    </div>
    <!-- Main page content for wallet with credit card and invoice entry -->
    <div
      class="outer-wrapper row justify-center q-gutter-sm q-pt-lg"
      v-if="storeUser.currentKeepSats?.admin"
    >
      <UnlimitedInvoice />
    </div>
    <!-- End Main page content for wallet with credit card and invoice entry -->
    <AskDetailsDialog
      v-model="dInvoice"
      @newInvoice="(val) => receiveNewInvoice(val)"
      @closeAskDialog="(val) => closeAskDialog(val)"
    />
  </q-page>
</template>

<style lang="scss" scoped>
.invoice-input,
.invoice-timer {
  width: 300px;
}

.input-amount-readonly {
  width: 7rem;
}

@media screen and (min-width: 500px) {
  .amounts-display {
    flex-direction: column;
  }
}

.lower-credit-card {
  transform: scale(1);
}
</style>

<script setup>
import { computed, ref, watch } from "vue";
import { tidyNumber } from "src/use/useUtils";
import { useStoreAPIStatus } from "src/stores/storeAPIStatus";
import { QrcodeStream } from "vue-qrcode-reader";
import { useDecodeLightningInvoice } from "src/use/useLightningInvoice";
import {
  useGetHiveTransactionHistory,
  useHiveAccountExists,
  useHiveAvatarURL,
} from "src/use/useHive.js";
import { useConfirmPayWithApi } from "src/use/useV4vapp";
import { useHiveKeychainTransfer } from "src/use/useKeychain";
import { useEVMAddressExists } from "src/use/useEVM";
import AskDetailsDialog from "components/lightning/AskDetailsDialog.vue";
import AskHASDialog from "components/hive/AskHASDialog.vue";
import KeychainShowQR from "components/hive/KeychainShowQR.vue";
import ShowProgress from "components/lightning/ShowProgress.vue";
import VoteProposal from "components/utils/VoteProposal.vue";
import CountdownBar from "components/utils/CountdownBar.vue";
import { useI18n } from "vue-i18n";
import { useQuasar, QSpinnerGears } from "quasar";
import CreditCard from "components/hive/CreditCard.vue";
import { useStoreUser } from "src/stores/storeUser";
import ExplanationBox from "components/utils/ExplanationBox.vue";
import { serverHiveAccount } from "boot/axios";
import AlternateCurrency from "src/components/hive/AlternateCurrency.vue";
import HiveLightningKeepSatsTrans from "src/components/v4vapp/HiveLightningKeepSatsTrans.vue";
import ReceiveKeepsats from "src/components/hive/ReceiveKeepsats.vue";
import ConvertWrapper from "src/components/hive/ConvertWrapper.vue";
import HiveAvatar from "components/utils/HiveAvatar.vue";
import UnlimitedInvoice from "components/utils/UnlimitedInvoice.vue";
import QRcodeCamera from "src/components/utils/QRcodeCamera.vue";

const invoiceText = ref(null);
const invoiceChecking = ref(false);
const invoiceValid = ref(null);
const dInvoice = ref(null);
const callbackResult = ref(null);
const errorMessage = ref("");
const voteOptions = ref({
  hiveUser: "",
  showButton: true,
  showDialog: false,
});

const cameraOn = ref(false);
const cameraShow = ref(false);
const cameraError = ref("");

const privateMemo = ref(false);

const currentTab = ref("wallet");

const t = useI18n().t;
const q = useQuasar();
const storeApiStatus = useStoreAPIStatus();
const storeUser = useStoreUser();
const payWithSatsAmount = ref(0);
const adminOverride = ref(false);

const payWithSatsButton = computed(() => {
  return (
    "Pay " +
    tidyNumber(payWithSatsAmount.value, 0) +
    " from " +
    storeUser.keepSatsBalance +
    " シ"
  );
});

const enoughKeepSats = computed(() => {
  if (storeUser.keepSatsBalanceNum >= CurrencyCalc.value.sats) {
    return true;
  }
  return false;
});

const payWithSatsOnly = computed(() => {
  if (dInvoice.value?.payWithSatsOnly) {
    return true;
  }
  return false;
});

const KeychainDialog = ref({ show: false });
const HASDialog = ref({ show: false });
const CurrencyCalc = ref({});

let timeMessage = ref("");
// Invoice hint shows expiry time and sats costs and fee
const invoiceHint = computed(() => {
  if (!invoiceValid.value) {
    return t("invoice_hint");
  } else {
    if (invoiceValid.value && dInvoice.value.timeLeft > 1) {
      const message = `${t("invoice")} ${sats.value} (${t("fee")}: ${
        satsFee.value
      }) - ${t("expires")} ${timeMessage.value}`;
      return message;
    }
    return t("invoice_hint");
  }
});

const sats = computed(() => {
  if (dInvoice.value?.millisatoshis) {
    return tidyNumber(dInvoice.value?.millisatoshis / 1000);
  }
  return "---";
});

const satsFee = computed(() => {
  if (dInvoice.value?.millisatoshis) {
    const sats = dInvoice.value?.millisatoshis / 1000;
    const satsFee = (calcSatsFee(sats) - sats).toFixed(0);
    return tidyNumber(satsFee);
  }
  return "---";
});

function calcSatsFee(sats) {
  let satsWithFees = sats;
  console.log(
    "conv_fee_percent",
    storeApiStatus.apiStatus.config.conv_fee_percent,
  );
  console.log("conv_fee_sats", storeApiStatus.apiStatus.config.conv_fee_sats);
  satsWithFees *= 1 + storeApiStatus.apiStatus.config.conv_fee_percent;
  satsWithFees += storeApiStatus.apiStatus.config.conv_fee_sats;
  return satsWithFees;
}

const HBD = computed(() => {
  if (dInvoice.value?.millisatoshis) {
    const sats = calcSatsFee(dInvoice.value?.millisatoshis / 1000);
    const HBD = (sats / storeApiStatus.HBDSatsNumber).toFixed(3);
    return tidyNumber(HBD) + " HUSD";
  }
  return "---";
});

const Hive = computed(() => {
  if (dInvoice.value?.millisatoshis) {
    const sats = calcSatsFee(dInvoice.value?.millisatoshis / 1000);
    const hive = (sats / storeApiStatus.hiveSatsNumber).toFixed(3);
    return tidyNumber(hive) + " Hive";
  }
  return "---";
});

async function pasteClipboard() {
  if (window.navigator.clipboard) {
    try {
      const text = await window.navigator.clipboard.readText();
      invoiceText.value = text;
      decodeInvoice();
    } catch (error) {}
  } else {
    console.error("Clipboard API not supported in this browser.");
  }
}

const invoiceColours = {
  // dark mode is true, light mode is false
  true: {
    empty: "blue-grey-9",
    valid: "green-9",
    invalid: "red-9",
  },
  false: {
    empty: "blue-grey-2",
    valid: "green-2",
    invalid: "red-2",
  },
};

const invoiceColor = computed(() => {
  const colours = invoiceColours[q.dark.isActive];
  if (invoiceValid.value === null) {
    return colours.empty;
  }
  if (invoiceValid.value) {
    return colours.valid;
  }
  return colours.invalid;
});

const buttonColors = {
  // dark mode is true, light mode is false
  true: {
    buttonColor: "grey-10",
    textColor: "white-4",
  },
  false: {
    buttonColor: "grey-6",
    textColor: "grey-9",
  },
};

const buttonColor = computed(() => {
  const colours = buttonColors[q.dark.isActive];
  return colours;
});

const invoiceLabels = {
  enter: t("enter_invoice"),
  bolt11: t("valid_invoice"),
  lightningAddress: t("valid_lightning_address"),
  invalid: t("invalid_invoice"),
  hiveAccname: "Hive Account",
};

const invoiceLabel = computed(() => {
  return invoiceLabels[invoiceType()];
});

function closeAskDialog(val) {
  invoiceChecking.value = false;
}

function checkInvoiceProgress(timeLeft) {
  dInvoice.value.timeLeft = timeLeft;
  if (timeLeft < 0) {
    // Check if invoice is expired return true if expired
    dInvoice.value.errors.expired = true;
    dInvoice.value.errors.text.push("invoice_expired");
    errorMessage.value = dInvoice.value?.errors.text
      .map((error) => t(error))
      .join(", ");
    dInvoice.value.timeLeft = 0;
    invoiceValid.value = false;
    invoiceChecking.value = false;
  }
}

function receiveNewInvoice(val) {
  if (val?.v4vapp?.type === "hiveAccname") {
    // we have a Hive account to send to.
    dInvoice.value = val;
    invoiceValid.value = true;
    invoiceChecking.value = false;
    invoiceText.value = `@${val.v4vapp.sendTo}`;
    validHiveAccountToPay();
    return;
  }
  if (val === null) {
    // Need to notify of problem with Lightning service of invoice provider
    console.debug("Lightning service provider not working");
    dInvoice.value.askDetails = false;
    q.notify({
      message: t("invoice_provider_not_working"),
      color: "warning",
      icon: "report_problem",
      position: "top",
      timeout: 3000,
    });
    return;
  }
  callbackResult.value = val;
  invoiceText.value = val.pr;
  decodeInvoice();
}

function invoiceType() {
  // Checks the type of the invoice returns bolt11 or lightningAddress
  if (invoiceValid.value === null) {
    return "enter";
  }
  const type = dInvoice.value?.v4vapp?.type;
  if (!type) {
    return "invalid";
  }
  if (type === "hiveAccname") {
    return "hiveAccname";
  }
  if (type === "bolt11") {
    return "bolt11";
  } else if (type === "lightningAddress") {
    return "lightningAddress";
  } else {
    return "invalid";
  }
}

function clearReset() {
  errorMessage.value = "";
  invoiceText.value = null;
  invoiceValid.value = null;
  invoiceChecking.value = false;
  dInvoice.value = {};
  cameraOn.value = false;
  cameraShow.value = false;
  CurrencyCalc.value.amount = 0;
  payWithSatsAmount.value = 0;
  HASDialog.value = { show: false };
}

watch(
  () => storeUser.currentUser,
  async (newVal) => {
    if (newVal === null || newVal === undefined) {
      currentTab.value = "wallet";
    }
    return;
  },
);

async function onDecode(content) {
  // Switch to better QR Code library, handle multiple QR codes
  // scan through them until a valid Lightning invoice is found.
  console.log("onDecode", content);
  let i = 0;
  while (i < content.length && !invoiceValid.value) {
    const rawValue = content[i].rawValue;

    invoiceText.value = rawValue;
    await decodeInvoice();

    i++;
  }
}

/**
 * Decodes an invoice.
 * @returns {Promise<void>} A promise that resolves when the invoice is decoded.
 */
async function decodeInvoice() {
  invoiceChecking.value = true;
  invoiceValid.value = null;
  if (!invoiceText.value) {
    clearReset();
    return true;
  }
  // Clean up invoice text input, strip prefixes
  invoiceText.value = invoiceText.value.toLowerCase();
  if (invoiceText.value.startsWith("lightning:")) {
    invoiceText.value = invoiceText.value.substring(10);
  }
  if (invoiceText.value.startsWith("bitcoin:")) {
    const lightningSection = invoiceText.value.match(/lightning=([^&]*)/);
    invoiceText.value = lightningSection[1];
  }
  try {
    // MARK: Decode the invoice
    // decode the invoice
    if (invoiceText.value.startsWith("@")) {
      invoiceText.value = invoiceText.value.substring(1);
    }
    // check if the string has the substring "@.*v4v.app"
    // convert to a Hive account so we don't do a pointless lightning
    // self payment
    if (invoiceText.value.match(/.*@sats.v4v.app/)) {
      invoiceText.value = invoiceText.value.replace(/@sats.v4v.app/, "");
    }
    // trim invoiceText
    invoiceText.value = invoiceText.value.trim();
    const [isHiveAccount, isEVMAccount, dInvoiceValue] = await Promise.all([
      useHiveAccountExists(invoiceText.value),
      useEVMAddressExists(invoiceText.value),
      useDecodeLightningInvoice(invoiceText.value),
    ]);
    dInvoice.value = dInvoiceValue;
    if (isHiveAccount.exists || isEVMAccount.valid) {
      if (!storeUser.keepSatsBalanceNum) {
        errorMessage.value = t("keepssats_error");
        dInvoice.value = {
          v4vapp: {
            type: "hiveAccname",
          },
        };
        invoiceValid.value = false;
        invoiceChecking.value = false;
        return;
      }
      if (storeUser.currentUser === isHiveAccount.hiveAccname) {
        errorMessage.value = t("cannot_send_to_self");
        dInvoice.value = {
          v4vapp: {
            type: "hiveAccname",
          },
        };
        invoiceValid.value = false;
        invoiceChecking.value = false;
        return;
      }
      invoiceValid.value = true;
      errorMessage.value = "";
      const amountToSend = storeUser.keepsatsBalanceNum > 1000 ? 1 : 1000;
      invoiceChecking.value = true;
      dInvoice.value = {
        v4vapp: {
          type: "hiveAccname",
          sendTo: isHiveAccount.hiveAccname,
          metadata: {
            "text/plain": `Send KeepSats to @${isHiveAccount.hiveAccname}`,
            "text/identifier": `@${isHiveAccount.hiveAccname}`,
            imgUrl: useHiveAvatarURL({
              hiveAccname: isHiveAccount.hiveAccname,
            }),
            requestString: `Send KeepSats to @${isHiveAccount.hiveAccname}`,
            minSats: 1,
            maxSats: storeUser.keepSatsBalanceNum,
            commentLength: 255,
          },
          amountToSend: amountToSend,
        },
        sending: true,
        askDetailsButton: true,
      };
      return;
    } else if (dInvoice.value) {
      CurrencyCalc.value.amount = dInvoice.value?.satoshis;
      CurrencyCalc.value.currency = "sats";
      payWithSatsAmount.value = CurrencyCalc.value.amount;
      dInvoice.value.progress = [];
      invoiceValid.value = true;
      invoiceChecking.value = false;
      cameraOn.value = false;
      cameraShow.value = false;
      if (invoiceType() === "lightningAddress") {
        // need to ask for details including amount
        // make sure we clear any earlier errors
        invoiceValid.value = null;
        errorMessage.value = "";
        dInvoice.value.sending = true; // Flag to show this is for sending Hive to Lightning
        invoiceChecking.value = true;
        dInvoice.value.askDetailsButton = true;
        // dInvoice.value.askDetails = true
        return;
      } else {
        if (dInvoice.value?.errors.text.length > 0) {
          errorMessage.value = dInvoice.value?.errors.text
            .map((error) => t(error))
            .join(", ");
          q.notify({
            color: "negative",
            timeout: 2000,
            message: errorMessage.value,
            position: "top",
          });
          invoiceValid.value = false;
          invoiceChecking.value = false;
          return errorMessage.value;
        }
      }
      return true;
    }
    errorMessage.value = t("invalid_invoice");
    invoiceValid.value = false;
    invoiceChecking.value = false;
  } catch (e) {
    invoiceValid.value = false;
    invoiceChecking.value = false;
    errorMessage.value = t("invalid_invoice");
    return false;
  }
}

function validHiveAccountToPay() {
  CurrencyCalc.value.amount = dInvoice.value?.satoshis;
  CurrencyCalc.value.currency = "sats";
  payWithSatsAmount.value = CurrencyCalc.value.amount;
  dInvoice.value.progress = [];
  invoiceValid.value = true;
  invoiceChecking.value = false;
  cameraOn.value = false;
  cameraShow.value = false;
}

const cameraErrors = [
  "NotAllowedError",
  "NotFoundError",
  "NotSupportedError",
  "NotReadableError",
  "OverconstrainedError",
  "StreamApiNotSupportedError",
  "InsecureContextError",
];

function onReady(capabilities) {
  invoiceChecking.value = true;

  cameraOn.value = true;
  cameraShow.value = true;
}

function onError(error) {
  console.error("onError", error.name);
  if (cameraErrors.includes(error.name)) {
    cameraError.value = `${t("error")}: ${t(error.name)}`;
  } else {
    cameraError.value = `${t("error")}: ${t("OtherError")} ${
      error.name
    } ${error}`;
  }
  invoiceChecking.value = false;
  q.notify({
    color: "negative",
    timeout: 4000,
    message: cameraError.value,
    position: "top",
  });
  setTimeout(() => {
    cameraError.value = "";
    cameraOn.value = false;
    cameraShow.value = false;
  }, 500);
  cameraOn.value = false;
  cameraShow.value = false;
  invoiceChecking.value = false;
}

function toggleCamera() {
  invoiceChecking.value = !invoiceChecking.value;
  cameraShow.value = cameraOn.value;
}

async function confirmPayWithApi(message) {
  let apiPayData = {};
  if (dInvoice.value?.v4vapp.type === "hiveAccname") {
    apiPayData = {
      type: "hiveAccname",
      sendTo: dInvoice.value.v4vapp.sendTo,
      sats: dInvoice.value.satoshis,
      comment: dInvoice.value.v4vapp.comment,
    };
  } else {
    apiPayData = {
      type: "bolt11",
      paymentRequest: dInvoice.value.paymentRequest,
    };
  }
  let response = useConfirmPayWithApi(message, apiPayData);
  if (response) {
    storeUser.updateSatsBalance(false);
    await new Promise((resolve) => setTimeout(resolve, 4000));
    clearReset();
  }
  return;
}

/**
 * Pay the invoice using the specified currency and method.
 *
 * @param {string} currency - The currency to use for payment.
 * @param {string} method - The payment method to use.
 * @returns {Promise} - A promise that resolves when the payment is completed.
 */
async function payInvoice(currency, method) {
  // Pay the invoice using Hive Keychain
  // Use dynamic fee calculation with a 1% uplift for safety margin
  let baseSats = dInvoice.value?.millisatoshis / 1000 || 0;
  let satsWithFees = calcSatsFee(baseSats);
  console.log("satsWithFees", satsWithFees);
  let uplift = 1.01; // 1% uplift
  satsWithFees *= uplift; // Apply 1% uplift
  satsWithFees += 100; // Add fixed fee
  console.log("satsWithFees with uplift and fixed fee", satsWithFees);

  let amountNum = 0;
  if (currency === "HIVE") {
    amountNum = (satsWithFees / storeApiStatus.hiveSatsNumber).toFixed(3);
  } else if (currency === "HBD") {
    amountNum = (satsWithFees / storeApiStatus.HBDSatsNumber).toFixed(3);
  }

  CurrencyCalc.value.amount = parseFloat(amountNum);
  CurrencyCalc.value.currency = currency.toLowerCase();
  // next tick which allows currency calc to catch up.
  await new Promise((resolve) => setTimeout(resolve, 0));
  let amount = amountNum;

  // if payWithSats is true add #paywithsats to the end of the memo
  // adds encryption to the memo 2024-02-23
  // add control for encryption 2024-03-06
  let memo = `${dInvoice.value.paymentRequest}`;
  if (privateMemo.value) {
    memo = "#" + memo;
  }

  dInvoice.value.progress.push(`${t("requesting")} ${amount} ${currency}`);
  // replace null with logged in user
  let username = null;
  if (storeUser.currentUser) {
    username = storeUser.currentUser;
  }
  let result = {};
  if (method === "HiveKeychain" && !storeApiStatus.isKeychainIn) {
    method = "HiveKeychainQR";
  }
  switch (method) {
    case "HiveKeychainQR":
      // This is where we can show the Hive QR code
      q.notify({
        color: "positive",
        timeout: 2000,
        message: t("keychain_missing"),
        position: "top",
        actions: [
          {
            icon: "close",
            round: true,
            color: "white",
            handler: () => {},
          },
        ],
      });
      KeychainDialog.value.hiveAccFrom = storeUser.currentUser
        ? storeUser.currentUser
        : "";
      KeychainDialog.value.memo = memo;
      KeychainDialog.value.currencyToSend = currency;
      KeychainDialog.value.hiveAccTo = serverHiveAccount;
      KeychainDialog.value.display = "hive";
      KeychainDialog.value.currencyCalc = CurrencyCalc.value;
      KeychainDialog.value.show = true;
      // After this we need to watch for the result from the KeychainDialog
      break;

    case "HiveKeychain":
      // Hive Keychain process
      result = await useHiveKeychainTransfer(username, amount, currency, memo);
      if (result.success) {
        const notif = q.notify({
          avatar: "/site-logo/v4vapp-logo.svg",
          color: "positive",
          group: false,
          timeout: 0,
          message: result.message,
          position: "top",
        });
        dInvoice.value.progress.push(result.message);
        // Set the username for the Voting Button
        voteOptions.value.hiveUser = result.data.username;
        checkHiveTransaction(result.data.username, result.result.id, notif);
      } else {
        dInvoice.value.progress.push(result.message);
        q.notify({
          color: "negative",
          avatar: "/site-logo/v4vapp-logo.svg",
          timeout: 2000,
          message: result.message,
          position: "top",
          actions: [
            {
              icon: "close",
              round: true,
              color: "white",
              handler: () => {},
            },
          ],
        });
        return;
      }
      break;
    case "HAS":
      HASDialog.value.show = true;
      HASDialog.value.payment = {
        username: username,
        amount: amount,
        currency: currency,
        memo: memo,
      };

      // result = await useHASTransfer(username, amount, currency, memo)
      dInvoice.value.progress.push(`${t("open_HAS")}`);
      // Code will finish within the useHAS code
      break;
  }
}

watch(
  HASDialog,
  async (value) => {
    if (value) {
      if (value.resolvedHAS && value.resolvedHAS.cmd === "sign_nack") {
        const message = `${t("rejected_payment")}`;
        dInvoice.value.progress.push(message);
        q.notify({
          color: "negative",
          avatar: "/site-logo/v4vapp-logo.svg",
          timeout: 5000,
          message: message,
          position: "top",
          actions: [
            {
              icon: "close",
              round: true,
              color: "white",
              handler: () => {},
            },
          ],
        });
      }
      if (value.resolvedHAS && value.resolvedHAS.cmd === "sign_ack") {
        const message = `${t("payment_sent")}`;
        dInvoice.value.progress.push(message);
        const notif = q.notify({
          avatar: "/site-logo/v4vapp-logo.svg",
          color: "positive",
          group: false,
          timeout: 0,
          message: message,
          position: "top",
          actions: [
            {
              icon: "close",
              round: true,
              color: "white",
              handler: () => {},
            },
          ],
        });
        await checkHiveTransaction(
          value.payment.username,
          value.resolvedHAS.data,
          notif,
        );
      }
    }
  },
  { deep: true },
);

// Watching for a payment result from the KeychainDialog
watch(
  KeychainDialog,
  async (value) => {
    if (value) {
      if (value.paid) {
        // get most recent transactions for v4vapp account
        const transactions = await useGetHiveTransactionHistory("v4vapp");
        // get most recent trxId  from transactions
        const trx_id = transactions[0].trx_id;
        const message = t("payment_sent_hive_keychain");
        const notif = q.notify({
          avatar: "/site-logo/v4vapp-logo.svg",
          color: "positive",
          group: false,
          timeout: 0,
          message: message,
          position: "top",
          actions: [
            {
              icon: "close",
              round: true,
              color: "white",
              handler: () => {},
            },
          ],
        });
        dInvoice.value.progress.push(message);
        dInvoice.value.progress.push(`${t("check_lightning")}`);
        KeychainDialog.value = { show: false };
        checkHiveTransaction("v4vapp", trx_id, notif);
      } else {
        // Ignore the result
        return;
      }
    }
  },
  { deep: true },
);

async function checkHiveTransaction(username, trx_id, notif) {
  if (trx_id == null) {
    return;
  }
  const maxRetries = 20;
  let count = 0;
  let transaction_found;
  while (count < maxRetries) {
    count++;
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds
    const transactions = await useGetHiveTransactionHistory(username);
    transaction_found = findObjectBefore(transactions, trx_id);

    if (transaction_found) {
      break; // Exit the loop if the transaction is found
    }

    // If transaction is not found, show the waiting message
    const message = `${t("waiting_for")} ${count}/20`;
    const progressList = dInvoice.value.progress;
    if (count > 1) {
      progressList[progressList.length - 1] = message; // Overwrite the last item
    } else {
      progressList.push(message); // Add the message as the first item if the list is empty
    }
    notif({
      color: "positive",
      avatar: "/site-logo/v4vapp-logo.svg",
      timeout: 0,
      message: message,
      position: "top",
      actions: [
        {
          icon: "close",
          round: true,
          color: "white",
          handler: () => {},
        },
      ],
    });
  }
  let memo = "";
  if (!transaction_found) {
    // If the transaction wasn't found after maxRetries
    memo = `${t("transfer")}: ${t("not_found")}:`;
    notif({
      color: "negative",
      avatar: "/site-logo/v4vapp-logo.svg",
      timeout: 10000,
      message: memo,
      position: "top",
    });
  } else {
    memo = `${t("transfer")}: ${transaction_found?.op[1].amount}\n${
      transaction_found?.op[1].memo
    }`;
    dInvoice.value.progress.push(memo);

    // check if the transaction contains the string "Your Lightning Invoice of 1234 sats has been paid"

    let regex = /(Deducting|Your payment of) ([\d,]+).*/;
    console.log("Checking transaction memo:", transaction_found?.op[1].memo);
    let match = transaction_found?.op[1].memo.match(regex);
    if (match) {
      let satsPaid = match[2].replace(",", "");
      await storeUser.updateSatsBalance(false);
      memo = `${t("transfer")}: ${t("paid")}: ${satsPaid} sats`;
      dInvoice.value.progress.push(memo);
      notif({
        color: "positive",
        avatar: "/site-logo/v4vapp-logo.svg",
        timeout: 10000,
        message: memo,
        position: "top",
      });
    } else {
      // extract the text after the : ""Something went wrong with paying the Lightning Invoice: invoice is already paid, returning all Hive funds"
      regex = /Lightning error: (.*)/;
      match = transaction_found?.op[1].memo.match(regex);
      if (match && match[1]) {
        // if match exists and match[1] has a value, include it in the message
        memo = `${t("transfer")}: ${t("lightning_failed")}: ${match[1]}`;
      } else {
        // if match[1] does not have a value, exclude it from the message
        memo = `${t("transfer")}: ${t("lightning_failed")}`;
      }
      notif({
        color: "negative",
        avatar: "/site-logo/v4vapp-logo.svg",
        timeout: 0,
        message: memo,
        position: "top",
        actions: [
          {
            label: t("ok"),
            color: "yellow",
            handler: () => {
              /* ... */
            },
          },
        ],
      });
    }
    voteOptions.value.showButton = true;
    voteOptions.value.showDialog = false;
    // pause for 5 seconds to allow the transaction to be found
    await new Promise((resolve) => setTimeout(resolve, 10000));
    clearReset();
    return;
  }
}

/**
 * Finds the object in the 'data' array that occurs before the object with the specified 'target_trx_id'.
 *
 * @param {Array} data - The array of objects to search.
 * @param {string} target_trx_id - The transaction ID to search for.
 * @returns {Object|null} - The object that occurs before the target object, or null if not found.
 */
function findObjectBefore(data, target_trx_id) {
  for (let i = 1; i < data.length; i++) {
    if (data[i].trx_id === target_trx_id) {
      return data[i - 1];
    }
  }
  return null;
}
</script>
