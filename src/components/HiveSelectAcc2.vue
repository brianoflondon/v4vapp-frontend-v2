<template>
  <q-select
    class="hive-select-account"
    v-model="modelValue"
    hide-selected
    use-input
    fill-input
    options-html
    input-debounce="300"
    spellcheck="false"
    :label="label"
    :options="options"
    @focus="focusFn"
    @filter="filterFnAutoselect"
    @filter-abort="abortFilterFn"
    @keydown.enter="enterFn"
    @keydown.tab="enterFn"
    @keydown.esc="escFn"
    @input-value="inputFn"
  >
    <template v-slot:before>
      <q-avatar rounded size="md">
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
 * @props {number} maxOptions - Default: 10 - Maximum number of options to show in the dropdown
 * @props {string} size - Default: small - small, medium, large size of the avatar
 * @emits {string} updateValue - Emitted value of selected Hive Account
 */
import { ref } from "vue"
import {
  useLoadHiveAccountsReputation,
  useBlankProfileURL,
  useHiveAvatarURL,
} from "src/use/useHive"

const options = ref([])
const modelValue = defineModel()
const avatar = ref(useBlankProfileURL())

// Using a computed property to set the avatar does not work
// There is no good way to handle an image error during load.
// const avatar = computed(() => {
//   return useHiveAvatarURL({ hiveAccname: modelValue.value, size: props.size })
// })

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
  fancyOptions: {
    type: Boolean,
    default: false,
  },
})

function enterFn(input) {
  // If Enter or tab is pressed before selecting from the options, the first option is selected
  if (!modelValue.value && options.value.length > 0) {
    modelValue.value = options.value[0]
  }
}

async function focusFn(input) {
  // When the input is focused, the options are updated
  await updateOptions(input.srcElement._value)
}

function escFn(input) {
  // If Esc is pressed, the model is cleared
  modelValue.value = ""
}

function inputFn(input) {
  // Change the avatar to match the input value
  setHiveAvatar(input)
}

function setHiveAvatar(hiveAccname) {
  avatar.value = useHiveAvatarURL({ hiveAccname, size: props.size })
}

function handleImageError(event) {
  avatar.value = useBlankProfileURL()
}

async function updateOptions(val) {
  // Finds relevant Hive accounts for the options drop down
  console.log("updateOptions", val)
  console.log("modelValue.value", modelValue.value)
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
}

async function filterFnAutoselect(val, update, abort) {
  // Finds relevant Hive accounts for the options drop down
  // console.log("filter", val, update, abort)
  update(
    async () => {
      console.log("delayed filter")
      await updateOptions(val)
      // if (val === "") {
      //   options.value = []
      // } else {
      //   const needle = val.toLowerCase().replace(/\s+/g, "")
      //   options.value = await useLoadHiveAccountsReputation(
      //     needle,
      //     props.maxOptions
      //   )
      //   if (options.value) {
      //     setHiveAvatar(options.value[0])
      //   }
      // }
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

<style lang="scss" scoped></style>
```
