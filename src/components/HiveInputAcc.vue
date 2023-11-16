<template>
  <div>
    <q-input
      v-model="simpleInput"
      :label="modelValue?.caption ? modelValue.caption : label"
      map-options
      @update:model-value="(val) => updateHiveAccTo(val)"
      dense
      clearable
      debounce="500"
    >
      <template v-slot:prepend>
        <q-avatar rounded size="md">
          <HiveAvatar :hiveAccname="avatarName" />
        </q-avatar>
      </template>
    </q-input>
  </div>
</template>

<script setup>
/**
 * HiveAccountInput
 * A Vue.js component for inputting and displaying Hive blockchain account information.
 * It uses the Quasar Framework's `q-input` for user input and includes a custom `HiveAvatar`
 * component for visual representation. The component is designed to offer a user-friendly
 * interface for entering a Hive account name, fetching related profile data, and displaying
 * the corresponding avatar.
 *
 * @modelValue {object} modelValue - A reactive object that holds the value, label, and caption
 * of the currently selected Hive account. The structure includes `label`, `value`, and `caption`
 * properties, with `caption` initially set to "Hive Account".
 *
 * @props {string} label - The label text displayed when no account is selected or when the
 * `modelValue` caption is not available. The default value is "Hive Account". This label provides
 * contextual information to the user about the expected input.
 *
 * @function updateHiveAccTo - An asynchronous function that updates the model value based on the
 * entered Hive account name. It performs a case-insensitive match, converts the input to lowercase,
 * and fetches the corresponding Hive profile. The function updates the avatar and account name
 * display based on the fetched data.
 *
 * The component's template includes a `q-input` field with a debounce of 500ms, enhancing performance
 * by reducing the frequency of input handling. It also features a clearable and dense input field
 * for a streamlined user experience. The `q-avatar` slot prepends an avatar to the input field,
 * dynamically showing the avatar associated with the entered Hive account name.
 *
 * This component is ideal for Vue.js applications that require user interaction with Hive blockchain
 * accounts, such as social media platforms, content management systems, or blockchain explorers.
 */

import { onMounted, ref, watch } from "vue"
import HiveAvatar from "components/utils/HiveAvatar.vue"
import { useI18n } from "vue-i18n"
import { useHiveProfile } from "src/use/useHive"

const props = defineProps({
  label: {
    type: String,
    default: "Hive Account",
  },
  prefix: {
    type: String,
    default: "",
  },
})

const modelValue = defineModel({
  label: "",
  value: "",
  caption: "",
  valid: false,
})
const simpleInput = ref("")
const avatarName = ref("")

watch(modelValue, (val) => {
  console.log("modelValue changed", val)
  if (modelValue.value.value != simpleInput.value) {
    simpleInput.value = modelValue.value.value
  }
})

onMounted(() => {
  console.log("mounted")
  console.log("modelValue", modelValue.value)
  console.log("props", props)
})

async function updateHiveAccTo(val) {
  console.log("updateHiveAccTo", val)
  if (!val) {
    console.log("cleared updateHiveAccTo", val)
    ;(modelValue.label = ""),
      (modelValue.value = ""),
      (modelValue.caption = props.label),
      (modelValue.valid = false)
    avatarName.value = ""
    return
  }
  modelValue.value = {
    label: val.toLowerCase(),
    value: val.toLowerCase(),
    caption: val.toLowerCase(),
  }
  avatarName.value = val.toLowerCase()
  const result = await useHiveProfile(val.toLowerCase())
  if (result) {
    if (result?.metadata?.profile?.name) {
      modelValue.value.caption = setCaption(result?.metadata?.profile?.name)
    } else {
      modelValue.value.caption = setCaption(val.toLowerCase())
    }
    modelValue.value.valid = true
  }
  console.log("result", result)
  console.log("modelValue", modelValue.value)
}

function setCaption(profileName) {
  if (props.prefix === "") {
    return profileName
  }
  // Check if profileName already starts with the prefix
  if (profileName.startsWith(props.prefix)) {
    return profileName
  }

  return props.prefix + " " + profileName
}
</script>

<style lang="scss" scoped></style>
