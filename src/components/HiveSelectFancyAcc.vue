<template>
  <q-select
    class="fill-item"
    v-model="model"
    hide-selected
    use-input
    fill-input
    options-html
    input-debounce="300"
    spellcheck="false"
    :label="label"
    :options="options"
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
    <template v-if="fancyOptions" v-slot:option="scope">
      <q-item v-bind="scope.itemProps" v-ripple>
        <q-item-section side>
          <q-avatar rounded size="sm">
            <img
              :src="
                useHiveAvatarURL({
                  hiveAccname: scope.opt.label,
                  size: 'small',
                  reason: 'select',
                })
              "
              @error="handleImageError"
            />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label> {{ scope.opt.label }} </q-item-label>
          <q-item-label caption> {{ scope.opt.caption }} </q-item-label>
        </q-item-section>
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
 * @props {boolean} fancyOptions - Default: false - Whether to use the fancy options template
 * @emits {string} updateValue - Emitted value of selected Hive Account
 */
import { ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import {
  useLoadHiveAccountsReputation,
  useBlankProfileURL,
  useHiveAvatarURL,
  useHiveProfile,
} from "src/use/useHive"

const t = useI18n().t

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
  fancyOptions: {
    type: Boolean,
    default: false,
  },
})

watch(model, (newValue) => {
  // Watches the model which holds the selected value
  console.log("watch model", newValue)
  avatar.value = useHiveAvatarURL({
    hiveAccname: newValue.value,
    size: props.size,
  })
  emit("updateValue", newValue.value)
})

function enterFn(input) {
  // If Enter or tab is pressed before selecting from the options, the first option is selected
  if (!model.value.value && options.value.length > 0) {
    model.value.value = options.value[0]
  }
}

function escFn(input) {
  // If Esc is pressed, the model is cleared
  model.value = ""
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
          setHiveAvatar(simpleList[0])
        }
        options.value = buildOptions(simpleList)
        await slowFillCaptions()
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

const abortFilterFn = () => {
  console.log("delayed filter aborted")
}
</script>

<style lang="scss" scoped>
.fill-item {
  flex: 1;
}
</style>
```
