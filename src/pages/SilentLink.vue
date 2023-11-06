<template>
  <q-page>
    <div class="q-pa-lg text-center">Silent Link</div>
    <q-list bordered separator>
      <q-item clickable v-ripple v-for="(url, name) in orderUrls" :key="name">
        <q-item-section>{{ name }}</q-item-section>
        <q-item-section>{{ getToken(url) }}</q-item-section>
        <q-item-section>
          <pre>{{ getOrders(url) }}</pre>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { ref } from "vue"
import { axios } from "boot/axios"

const orderUrls = ref({
  "GB Data Plus eSim Silent Link":
    "https://silent.link/order/34aPTLYPeCxURPhYwV0y2jridLFLkYvN8AorflHxxu",
})

function getToken(url) {
  return url.split("/").pop()
}

async function getOrders(url) {
  let data = JSON.stringify({
    token: getToken(url),
  })

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://silent.link/api/v1/getmyorder",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  }

  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data))
    })
    .catch((error) => {
      console.log(error)
    })
}
</script>

<style lang="scss" scoped></style>
