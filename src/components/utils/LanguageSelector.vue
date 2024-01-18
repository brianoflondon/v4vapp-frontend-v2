<template>
  <div class="language-selector">
    <q-btn-dropdown flat dense dropdown-icon="language">
      <q-list>
        <q-item
          v-for="(option, index) in localeOptions"
          :key="index"
          clickable
          @click="onItemClick(option.value)"
        >
          <q-item-section>
            {{ option.label }} {{ option.flag  }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n"
const { locale } = useI18n({ useScope: "global" })

const localeOptions = [
  { value: "en-US", label: "En", flag: "🇬🇧" },
  { value: "es-ES", label: "Es", flag: "🇪🇸" },
  { value: "de-DE", label: "De", flag: "🇩🇪" },
  { value: "pt-BR", label: "Pt", flag: "🇧🇷" },
]

function onItemClick(label) {
  // Handle item click logic here
  locale.value = label
}
</script>

<style lang="scss" scoped></style>
