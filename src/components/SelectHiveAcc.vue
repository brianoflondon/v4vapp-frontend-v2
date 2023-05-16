<template>
  <q-select
    v-model="model"
    clearable
    dense
    use-input
    hide-selected
    fill-input
    input-debounce="300"
    :label="label"
    :options="options"
    @filter="filterFnAutoselect"
    @filter-abort="abortFilterFn"
  >
    <template v-slot:before>
      <q-avatar>
        <img :src="avatar" />
      </q-avatar>
    </template>
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey"> No results </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup>
import { ref, watch } from "vue"
import {
  useLoadHiveAccountsReputation,
  useHiveAvatarURL,
} from "src/use/useHive"

const stringOptions = []
const options = ref(stringOptions)
const model = ref()
const avatar = ref(useHiveAvatarURL({ hiveAccname: "", size: "small" }))
const emit = defineEmits(["updateValue"])
const props = defineProps({
  label: {
    type: String,
    default: "Hive Account",
  },
})

watch(model, (newValue) => {
  avatar.value = useHiveAvatarURL({ hiveAccname: newValue, size: "samll" })
  emit("updateValue", newValue)
})

async function filterFnAutoselect(val, update, abort) {
  console.log("val", val)
  // await new Promise((resolve) => setTimeout(resolve, 300))
  update(
    async () => {
      if (val === "") {
        options.value = stringOptions
      } else {
        const needle = val.toLowerCase().replace(/\s+/g, "")
        options.value = await useLoadHiveAccountsReputation(needle, 10)
        avatar.value = useHiveAvatarURL({
          hiveAccname: options.value[0],
          size: "small",
        })
      }
    },
    (ref) => {
      if (val !== "" && ref.options.length > 0 && ref.getOptionIndex() === -1) {
        ref.moveOptionSelection(1, true)
        ref.toggleOption(ref.options[ref.optionIndex], true)
      }
    }
  )
}

const abortFilterFn = () => {
  console.log("delayed filter aborted")
}
</script>
