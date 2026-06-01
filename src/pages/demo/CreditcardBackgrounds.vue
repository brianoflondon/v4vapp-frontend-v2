<template>
  <q-page>
    <div class="q-pa-md row items-start q-gutter-md justify-center">
      <q-card v-for="background in backgroundImage" :key="background">
        <q-card-section style="min-width: 400px">
          <q-img :src="creditCardBackgroundUrl(background)">
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
import {
  creditCardBackgrounds,
  creditCardBackgroundUrl,
} from "src/utils/creditCardBackgrounds"

const backgroundImage = creditCardBackgrounds
</script>

<style lang="scss" scoped></style>
