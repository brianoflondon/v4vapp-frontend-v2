<template>
  <q-select
    v-model="model"
    clearable
    use-input
    hide-selected
    fill-input
    input-debounce="300"
    spellcheck="false"
    :label="label"
    :options="options"
    @filter="filterFnAutoselect"
    @filter-abort="abortFilterFn"
    @input-value="
      (input) => {
        setHiveAvatar(input)
      }
    "
  >
    <template v-slot:before>
      <q-avatar>
        <img :src="avatar" @error="handleImageError" />
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
/**
 * SelectHiveAcc
 * A select component for picking Hive accounts
 *
 * @props {string} label - The prompt label to show in the Select box
 * @props {number} maxOptions - Maximum number of options to show in the dropdown
 * @props {string} size - small, medium, large size of the avatar default is small
 * @emits {string} updateValue - Emitted value of selected Hive Account
 */
import { ref, watch } from "vue"
import {
  useLoadHiveAccountsReputation,
  useBlankProfileURL,
  useHiveAvatarURL,
} from "src/use/useHive"

const options = ref([])
const model = ref()
const avatar = ref(useBlankProfileURL())
const emit = defineEmits(["updateValue"])
const props = defineProps({
  label: {
    type: String,
    default: "Hive Account",
  },
  maxOptions: {
    type: Number,
    default: 10,
  },
  size: {
    type: String,
    default: "small",
  },
})

watch(model, (newValue) => {
  // Watches the model which holds the selected value
  avatar.value = useHiveAvatarURL({ hiveAccname: newValue, size: props.size })
  emit("updateValue", newValue)
})

function setHiveAvatar(hiveAccname) {
  avatar.value = useHiveAvatarURL({ hiveAccname, size: props.size })
}

function handleImageError(event) {
  avatar.value = useBlankProfileURL()
}

async function filterFnAutoselect(val, update, abort) {
  // Finds relevant Hive accounts for the options drop down
  update(
    async () => {
      if (val === "") {
        options.value = []
      } else {
        const needle = val.toLowerCase().replace(/\s+/g, "")
        options.value = await useLoadHiveAccountsReputation(
          needle,
          props.maxOptions
        )
        if (options.value) {
          setHiveAvatar(options.value[0])
        }
      }
    },
    (ref) => {
      if (val !== "" && ref.options.length > 0 && ref.getOptionIndex() === -1) {
        ref.moveOptionSelection(1, true)
        ref.toggleOption(ref.options[ref.optionIndex], true)
      }
    }
  )
  abort(() => {
    abortFilterFn
  })
}

const abortFilterFn = () => {
  console.log("delayed filter aborted")
}
</script>
