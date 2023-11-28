<template>
  <div>
    {{ expiryList }}
  </div>
  <div v-for="item in expiryList" :key="item.id">
    <CountdownBar
      :width="300"
      :expiry="item.expiry"
      @message="(val) => gotMessage(val, item.id)"
    />
    {{ expiryMessage[item.id] }}
  </div>

  <div>
    <CreateHASQRCode :qr-text="qrText"></CreateHASQRCode>
  </div>
  <div class="">
    <div>
      <q-input v-model="qrText" style="max-width: 300px"></q-input>
    </div>
    <div>
      <q-btn-toggle
        v-model="loading"
        rounded
        flat
        dense
        glossy
        :options="[
          { label: 'True', value: true },
          { label: 'False', value: false },
        ]"
      />
    </div>
  </div>
  <div>
    <CreateQRCode
      :qr-text="qrText"
      hiveAccname="v4vapp"
      :loading="loading"
      @qr-code="(val) => (qrCode = val)"
    />
  </div>
  <div v-if="qrCode?._container">
    <div v-html="qrCode._container.innerHTML"></div>
  </div>
  <div ref="gearsTest"></div>
</template>

<script setup>
import CreateQRCode from "src/components/qrcode/CreateQRCode.vue"
import CreateHASQRCode from "src/components/qrcode/CreateHASQRCode.vue"
import { onMounted, ref, watch } from "vue"
import CountdownBar from "src/components/utils/CountdownBar.vue"
import { useHiveAvatarBlob } from "src/use/useHive"

const qrText = ref("lightning:v4vapp@v4v.app")
const loading = ref(false)
const qrCode = ref()
const gearsTest = ref()

const expiryList = ref([])
const expiryMessage = ref({})

const htmlText =
  '<svg class="q-spinner text-primary" width="300px" height="300px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" xmlns="http://www.w3.org/2000/svg"><g transform="translate(-20,-20)"><path d="M79.9,52.6C80,51.8,80,50.9,80,50s0-1.8-0.1-2.6l-5.1-0.4c-0.3-2.4-0.9-4.6-1.8-6.7l4.2-2.9c-0.7-1.6-1.6-3.1-2.6-4.5 L70,35c-1.4-1.9-3.1-3.5-4.9-4.9l2.2-4.6c-1.4-1-2.9-1.9-4.5-2.6L59.8,27c-2.1-0.9-4.4-1.5-6.7-1.8l-0.4-5.1C51.8,20,50.9,20,50,20 s-1.8,0-2.6,0.1l-0.4,5.1c-2.4,0.3-4.6,0.9-6.7,1.8l-2.9-4.1c-1.6,0.7-3.1,1.6-4.5,2.6l2.1,4.6c-1.9,1.4-3.5,3.1-5,4.9l-4.5-2.1 c-1,1.4-1.9,2.9-2.6,4.5l4.1,2.9c-0.9,2.1-1.5,4.4-1.8,6.8l-5,0.4C20,48.2,20,49.1,20,50s0,1.8,0.1,2.6l5,0.4 c0.3,2.4,0.9,4.7,1.8,6.8l-4.1,2.9c0.7,1.6,1.6,3.1,2.6,4.5l4.5-2.1c1.4,1.9,3.1,3.5,5,4.9l-2.1,4.6c1.4,1,2.9,1.9,4.5,2.6l2.9-4.1 c2.1,0.9,4.4,1.5,6.7,1.8l0.4,5.1C48.2,80,49.1,80,50,80s1.8,0,2.6-0.1l0.4-5.1c2.3-0.3,4.6-0.9,6.7-1.8l2.9,4.2 c1.6-0.7,3.1-1.6,4.5-2.6L65,69.9c1.9-1.4,3.5-3,4.9-4.9l4.6,2.2c1-1.4,1.9-2.9,2.6-4.5L73,59.8c0.9-2.1,1.5-4.4,1.8-6.7L79.9,52.6 z M50,65c-8.3,0-15-6.7-15-15c0-8.3,6.7-15,15-15s15,6.7,15,15C65,58.3,58.3,65,50,65z" fill="currentColor"><animateTransform attributeName="transform" type="rotate" from="90 50 50" to="0 50 50" dur="1s" repeatCount="indefinite"></animateTransform></path></g><g transform="translate(20,20) rotate(15 50 50)"><path d="M79.9,52.6C80,51.8,80,50.9,80,50s0-1.8-0.1-2.6l-5.1-0.4c-0.3-2.4-0.9-4.6-1.8-6.7l4.2-2.9c-0.7-1.6-1.6-3.1-2.6-4.5 L70,35c-1.4-1.9-3.1-3.5-4.9-4.9l2.2-4.6c-1.4-1-2.9-1.9-4.5-2.6L59.8,27c-2.1-0.9-4.4-1.5-6.7-1.8l-0.4-5.1C51.8,20,50.9,20,50,20 s-1.8,0-2.6,0.1l-0.4,5.1c-2.4,0.3-4.6,0.9-6.7,1.8l-2.9-4.1c-1.6,0.7-3.1,1.6-4.5,2.6l2.1,4.6c-1.9,1.4-3.5,3.1-5,4.9l-4.5-2.1 c-1,1.4-1.9,2.9-2.6,4.5l4.1,2.9c-0.9,2.1-1.5,4.4-1.8,6.8l-5,0.4C20,48.2,20,49.1,20,50s0,1.8,0.1,2.6l5,0.4 c0.3,2.4,0.9,4.7,1.8,6.8l-4.1,2.9c0.7,1.6,1.6,3.1,2.6,4.5l4.5-2.1c1.4,1.9,3.1,3.5,5,4.9l-2.1,4.6c1.4,1,2.9,1.9,4.5,2.6l2.9-4.1 c2.1,0.9,4.4,1.5,6.7,1.8l0.4,5.1C48.2,80,49.1,80,50,80s1.8,0,2.6-0.1l0.4-5.1c2.3-0.3,4.6-0.9,6.7-1.8l2.9,4.2 c1.6-0.7,3.1-1.6,4.5-2.6L65,69.9c1.9-1.4,3.5-3,4.9-4.9l4.6,2.2c1-1.4,1.9-2.9,2.6-4.5L73,59.8c0.9-2.1,1.5-4.4,1.8-6.7L79.9,52.6 z M50,65c-8.3,0-15-6.7-15-15c0-8.3,6.7-15,15-15s15,6.7,15,15C65,58.3,58.3,65,50,65z" fill="currentColor"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="90 50 50" dur="1s" repeatCount="indefinite"></animateTransform></path></g></svg>'

onMounted(async () => {
  const blobUrl = await useHiveAvatarBlob({ hiveAccname: "v4vapp.dev" })
  console.log("got avatar", blobUrl)

  // for (let i = 0; i < 3; i++) {
  //   expiryList.value.push({
  //     id: i,
  //     expiry: Math.floor(Date.now() / 1000) + 30 * (i + 1),
  //   })
  // }
})

function gotMessage(val, itemId) {
  console.log("got message", val, itemId)
  expiryMessage.value[itemId] = val
}

watch(
  () => loading.value,
  (val) => {
    console.log("loading changed", val)
    if (val) {
      gearsTest.value.innerHTML = htmlText
    } else {
      gearsTest.value.innerHTML = "<p>goodbye world</p>"
    }
  }
)
</script>

<style lang="scss" scoped></style>
