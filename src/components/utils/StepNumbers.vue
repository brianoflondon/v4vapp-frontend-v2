<template>
  <div class="row">
    <q-list style="display: flex; flex-direction: row">
      <q-item v-for="n in props.numItems" :key="n">
        <q-item-section>
          <q-item-label>
            <q-avatar
              :color="buttonActiveNot(n === props.activeItem).color"
              :text-color="buttonActiveNot(n === props.activeItem).textColor"
            >
              <div class="text-h6">{{ n }}</div>
            </q-avatar>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
import { buttonActiveNot } from "src/use/useUtils";
import { ref } from "vue";

const props = defineProps({
  numItems: {
    type: Number,
    default: 4,
  },
  activeItem: {
    type: Number,
    default: 1,
  },
});
</script>

<style lang="scss" scoped></style>
