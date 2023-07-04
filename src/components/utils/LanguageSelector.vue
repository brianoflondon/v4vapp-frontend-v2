<template>
  <div class="language-selector">
    <q-btn-dropdown flat dense dropdown-icon="language">
      <q-list>
        <q-item
          v-for="localeOption in localeOptions"
          :key="localeOption.value"
          clickable
          v-close-popup
          @click="onItemClick(localeOption.value)"
        >
          <q-item-section>
            <q-item-label>{{ localeOption.label }}</q-item-label>
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
  { value: "en-US", label: "En" },
  { value: "es-ES", label: "Es" },
]

function onItemClick(label) {
  // Handle item click logic here
  locale.value = label
}
</script>

<style lang="scss" scoped></style>
