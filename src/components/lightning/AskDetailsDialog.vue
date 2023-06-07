<template>
  <div v-if="dInvoice">
    <q-dialog v-model="dInvoice.askDetails">
      <q-card>
        <q-card-section> Ask Details</q-card-section>
        <q-card-section>{{ textRequest }}</q-card-section>
        <q-card-section>
          {{ metadata.decoded }}
        </q-card-section>
        <q-card-section>
          <q-img
            :src="imgUrl"
            spinner-color="red"
            style="height: 150px; max-width: 150px"
          />
        </q-card-section>
        <q-card-section>
          <pre>{{ metadata }} {{ imgUrl }}</pre>
        </q-card-section>
        <q-card-section>
          <pre>{{ dInvoice }}</pre>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup></q-btn>
          <q-btn flat label="Ok" color="primary" v-close-popup></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from "vue"
const dInvoice = defineModel({})
const metadata = ref("")
const imgUrl = ref("")
const textRequest = ref("")

decodeMetadata()

function getImage() {
  // if the payment request has an image in it, return it
  console.log(dInvoice)
}

async function decodeMetadata() {
  // Decode the metadata field of the payment request
  console.log('------------------')
  console.log("unique ", dInvoice.value?.v4vapp?.metadata["text/plain"])
  console.log('------------------')
  let result = await JSON.parse(dInvoice.value.metadata)
  metadata.value = result

  // Transform the two-dimensional array into an object where
  // the first element of each sub-array is the key and the second element is the value.
  let decoded = result.reduce((obj, item) => {
    obj[item[0]] = item[1]
    return obj
  }, {})
  metadata.value.decoded = decoded
  metadata.value.decoded.imageKey = Object.keys(decoded).find((key) =>
    key.includes("image/")
  )
  metadata.value.decoded.textKey = Object.keys(decoded).find((key) =>
    key.includes("text/")
  )
  if (metadata.value.decoded.imageKey) {
    imgUrl.value = `data:${metadata.value.decoded.imageKey},${
      decoded[metadata.value.decoded.imageKey]
    }`
  } else {
    imgUrl.value = ""
  }
  if (metadata.value.decoded.textKey) {
    textRequest.value = decoded[metadata.value.decoded.textKey]
  }
  console.log(imgUrl.value)
}
</script>

<style lang="scss" scoped></style>
