<template>
  <div>
    <q-card>
      <!-- Top Close Button -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Your Account has been created</div>
        <q-space />
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>
      <q-card-section>
        <div class="flex row">
          <div class="text wrap">
            <div>This is the last chance to save your keys!</div>
            <div class="text-h6">Recommendation:</div>
            <div>Put Username and Master Password direct into Hive Keychain.</div>
            <div>Store the master password safely in a Password manager.</div>
            <div>There is no "I forgot my keys option" on Hive.</div>
          </div>
        </div>
        <div class="flex row justify-center q-pt-md">
          <div class="q-pa-sm">
            <q-btn
              icon="content_copy"
              :label="`@${accountName}`"
              @click="copyToClipboard(accountName)"
              :color="buttonActiveNot(true).color"
              :text-color="buttonActiveNot(true).textColor"
              no-caps
            />
          </div>
          <div class="q-pa-sm">
            <q-btn
              icon="content_copy"
              :label="$t('copy_master_password')"
              @click="copyToClipboard(masterPassword)"
              :color="buttonActiveNot(true).color"
              :text-color="buttonActiveNot(true).textColor"
            />
          </div>
        </div>
        <div class="flex row justify-center">
          <div class="q-pa-sm">
            <q-btn
              :label="t('download_keys')"
              icon="download"
              :color="buttonActiveNot(true).color"
              :text-color="buttonActiveNot(true).textColor"
              @click="downloadKeys"
            ></q-btn>
          </div>
          <div class="q-pa-sm">
            <q-btn
              :label="t('copy_keys')"
              icon="content_copy"
              :color="buttonActiveNot(true).color"
              :text-color="buttonActiveNot(true).textColor"
              @click="copyKeys"
            ></q-btn>
          </div>
        </div>
      </q-card-section>
      <q-card-section>
        <div class="flex row justify-center">
          <div
            v-if="keychainLink"
            class="flex wrap items-center justify-center"
          >
            <q-expansion-item
              expand-separator
              icon="qr_code_2"
              label="Scan your Keys with Keychain"
            >
              <CreateQRCode
                :qr-text="keychainLink"
                :width="350"
                :height="350"
              />
            </q-expansion-item>
          </div>
        </div>
      </q-card-section>
      <q-card-section>
        <div class="flex row justify-center q-pa-md">
          <q-btn
            label="Close"
            icon="close"
            @click="closeDialog"
            :color="buttonActiveNot(true).color"
            hive-accname="v4vapp"
            :text-color="buttonActiveNot(true).textColor"
          ></q-btn>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { copyToClipboard } from "quasar"
import { buttonActiveNot } from "src/use/useUtils"
import CreateQRCode from "src/components/qrcode/CreateQRCode.vue"
import { onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { ref } from "vue"
const t = useI18n().t

const emit = defineEmits(["close", "downloadKeys", "copyKeys"])

const accountNameForm = ref()
const masterPasswordForm = ref()

const props = defineProps({
  accountName: {
    type: String,
    required: true,
  },
  masterPassword: {
    type: String,
    required: true,
  },
  keys: {
    type: Object,
    required: true,
  },
  keychainLink: {
    type: String,
    default: "",
  },
})

onMounted(() => {
  console.log("props", props)
  accountNameForm.value = props.accountName
  masterPasswordForm.value = props.masterPassword
  console.log("accountNameForm", accountNameForm.value)
  console.log("masterPasswordForm", masterPasswordForm.value)
})

function closeDialog() {
  emit("close")
}

function downloadKeys() {
  emit("downloadKeys")
}
function copyKeys() {
  emit("copyKeys")
}
</script>

<style lang="scss" scoped>
.close-button-section {
  display: flex;
  justify-content: flex-end;
}
</style>
