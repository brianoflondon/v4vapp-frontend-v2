<template>
  <q-page>
    <div class="q-pa-md row items-start q-gutter-md justify-center">
      <q-card v-for="background in backgroundImage" :key="background">
        <q-card-section style="min-width: 400px">
          <q-img :src="'credit-card/backgrounds/' + background + '.webp'">
            <div class="absolute-bottom text-subtitle2 text-center">
              {{ background }}
            </div>
          </q-img>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
const backgroundImage = [
  "sealogo01",
  "sealogo02",
  "lightning01",
  "lightning02",
  "lightning03",
  "lightning04",
  "dolphins",
];
</script>

<style lang="scss" scoped></style>
