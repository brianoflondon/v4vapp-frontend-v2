<template>
  <div>
    <q-card>
      <!-- Top Close Button -->
      <q-card-section class="close-button-section">
        <div></div>
        <q-btn icon="close" dense round @click="closeDialog" />
      </q-card-section>
      <q-card-section>
        <div>
            <div>
                <q-img
                  style="width: 25%; height: auto"
                  src="public/keychain/hive-keychain-add-account.gif"
                />
            </div>
            {{  keychainLink }}
            <div>
                <CreateQRCode
                  :qrText="keychainLink"
                  :width="300"
                  :height="300"
                />
            </div>
        </div>
        <div class="text-h6">Your Hive Account has been created</div>
      </q-card-section>
      <q-card-section>
        <div>Copy your Hive Name and Master Password to Hive Keychain</div>
        <div class="flex col">
          <div class="q-pa-sm">
            <q-btn
              icon="content_copy"
              :label="accountName"
              @click="copyToClipboard(accountName)"
            />
          </div>
          <div class="q-pa-sm">
            <q-btn
              icon="content_copy"
              label="Copy Mater Password"
              @click="copyToClipboard(masterPassword)"
            />
          </div>
        </div>
      </q-card-section>

      <a href="keychain://add_account={{ JSON.stringify(keys.keychain) }}"
        >Add to Hive Keychain</a
      >
    </q-card>
  </div>
</template>

<script setup>
import { useQuasar, copyToClipboard } from "quasar"
import CreateQRCode from "src/components/qrcode/CreateQRCode.vue"
import { ref } from "vue"

const emit = defineEmits(["close"])

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

const keychainLink = ref(
  `keychain://add_account=${JSON.stringify(props.keys.keychain)}`
)

function closeDialog() {
  console.log("closeDialog")
  emit("close")
}
</script>

<style lang="scss" scoped>
.close-button-section {
  display: flex;
  justify-content: flex-end;
}
</style>
