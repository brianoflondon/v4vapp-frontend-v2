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
          <div class="text-h7 wrap">
            <p>This is the last chance to save your keys!</p>
            <p>If you lose them, you will lose access to your account.</p>
            <p>There is no "I forgot my keys option" on Hive.</p>
            <p>Please make sure you've saved them in a safe place</p>
          </div>
        </div>
        <div class="h6">
          Copy your Hive Name and Master Password to Hive Keychain
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

const t = useI18n().t

const emit = defineEmits(["close", "downloadKeys", "copyKeys"])

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

onMounted(() => {})

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
