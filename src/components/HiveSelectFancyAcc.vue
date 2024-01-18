<template>
  <q-select
    class="hive-select-account"
    v-model="modelValue"
    hide-selected
    use-input
    fill-input
    input-debounce="500"
    spellcheck="false"
    :label="modelValue?.caption ? modelValue.caption : label"
    :options="options"
    @filter="filterFnAutoselect"
    @filter-abort="abortFilterFn"
    @keydown.enter="enterFn"
    @keydown.tab="enterFn"
    @keydown.esc="escFn"
    @input-value="inputFn"
  >
    <template v-slot:prepend>
      <q-avatar rounded size="md">
        <HiveAvatar :hiveAccname="avatarName" />
      </q-avatar>
    </template>
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey"> No results </q-item-section>
      </q-item>
    </template>
    <template v-if="fancyOptions" v-slot:option="scope">
      <q-item v-bind="scope.itemProps" v-ripple>
        <q-item-section side>
          <q-avatar rounded size="sm">
            <HiveAvatar :hiveAccname="scope.opt.label" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label> {{ scope.opt.label }} </q-item-label>
          <q-item-label caption> {{ scope.opt.caption }} </q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <!-- Use my Own code for the clearable button -->
    <template v-if="modelValue" v-slot:append>
      <q-icon name="cancel" @click="escFn" class="cursor-pointer" />
    </template>
  </q-select>
</template>

<script setup>
/**
 * SelectHiveAcc
 * A select component for picking Hive accounts
 *
 * @defineModel {object} modelValue - The selected value of the q-select
 * @props {string} label - The prompt label to show in the Select box
 * @props {number} maxOptions - Default: 10 - Maximum number of options to show in the dropdown
 * @props {string} size - Default: small - small, medium, large size of the avatar
 * @props {boolean} fancyOptions - Default: false - Whether to use the fancy options template
 */
import { ref } from "vue"
import HiveAvatar from "components/utils/HiveAvatar.vue"
import { useI18n } from "vue-i18n"
import {
  useLoadHiveAccountsReputation,
  useBlankProfileURL,
  useHiveProfile,
} from "src/use/useHive"

const t = useI18n().t

const options = ref([])
const modelValue = defineModel({
  default: { label: "", value: "", caption: "" },
})
const avatarName = ref("")
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

function enterFn(input) {}

function escFn(input) {
  // If Esc is pressed, the model is cleared
  // modelValue.value = null
  modelValue.value = { label: "", value: "", caption: "" }
}

function inputFn(input) {
  // Change the avatar to match the input value
  avatarName.value = input
}

function handleImageError(event) {
  avatar.value = useBlankProfileURL()
}

async function filterFnAutoselect(val, update, abort) {
  // Finds relevant Hive accounts for the options drop down
  // Fills in the options data structure
  update(
    async () => {
      if (val === "") {
        options.value = []
      } else {
        const needle = val.toLowerCase().replace(/\s+/g, "")
        const simpleList = await useLoadHiveAccountsReputation(
          needle,
          props.maxOptions
        )
        if (simpleList) {
          avatarName.value = simpleList[0]
        }
        options.value = buildOptions(simpleList)
      }
      await slowFillCaptions()
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

function buildOptions(simpleList) {
  // Builds the options data structure
  if (!simpleList) {
    return []
  }
  const objectList = simpleList.map((item) => {
    return { value: item, label: item, caption: t("loading") }
  })
  return objectList
}

async function slowFillCaptions() {
  // Fills in the captions for the options drop down
  options.value = await Promise.all(
    options.value.map(async (item) => {
      const result = await useHiveProfile(item.value)
      const caption = result?.metadata?.profile?.name
      return {
        ...item,
        caption: caption,
      }
    })
  )
}

const abortFilterFn = () => {}
</script>

<style lang="scss" scoped>
.fill-item {
  flex: 1;
}
</style>
```
