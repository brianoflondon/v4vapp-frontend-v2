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
        <div class="h6">Copy your Hive Name and Master Password to Hive Keychain</div>
        <div class="flex row justify-center">
          <div class="q-pa-md">
            <q-btn
              icon="content_copy"
              :label="accountName"
              @click="copyToClipboard(accountName)"
              :color="buttonActiveNot(true).color"
              :text-color="buttonActiveNot(true).textColor"
            />
          </div>
          <div class="q-pa-md">
            <q-btn
              icon="content_copy"
              label="Copy Master Password"
              @click="copyToClipboard(masterPassword)"
              :color="buttonActiveNot(true).color"
              :text-color="buttonActiveNot(true).textColor"
            />
          </div>
        </div>
        <div class="flex row justify-center">
          <div class="q-pa-md">
            <q-btn
              label="Download Keys"
              icon="download"
              :color="buttonActiveNot(true).color"
              :text-color="buttonActiveNot(true).textColor"
              @click="downloadKeys"
            ></q-btn>
          </div>
          <div class="q-pa-md">
            <q-btn
              label="Copy Keys"
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
          <div class="flex wrap items-center justify-center">
            <q-expansion-item
              expand-separator
              icon="qr_code_2"
              label="Scan your Keys with Keychain"
            >
              <CreateQRCode :qrText="keychainLink" :width="300" :height="300" />
            </q-expansion-item>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { useQuasar, copyToClipboard } from "quasar"
import { buttonActiveNot } from "src/use/useUtils"
import CreateQRCode from "src/components/qrcode/CreateQRCode.vue"
import { computed } from "vue"

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
})


const keychainLink = computed(() => {
  return `keychain://add_account=${JSON.stringify(props.keys.keychain)}`
})

function closeDialog() {
  console.log("closeDialog")
  emit("close")
}

function downloadKeys() {
  console.log("downloadKeys")
  emit("downloadKeys")
}
function copyKeys() {
  console.log("copyKeys")
  emit("copyKeys")
}

</script>

<style lang="scss" scoped>
.close-button-section {
  display: flex;
  justify-content: flex-end;
}
</style>
