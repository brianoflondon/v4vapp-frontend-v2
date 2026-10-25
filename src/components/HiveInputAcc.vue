<template>
  <div>
    <q-input
      :readonly="modelValue?.fixedUser"
      ref="simpleHiveInput"
      v-model="simpleInput"
      :label="modelValue?.caption ? modelValue.caption : label"
      map-options
      @update:model-value="(val) => updateHiveAccTo(val)"
      dense
      clearable
      @keydown.esc="clearInput"
      debounce="500"
      :rules="[accountRule]"
    >
      <template v-slot:prepend>
        <q-avatar rounded size="md">
          <HiveAvatar :hiveAccname="avatarName" />
        </q-avatar>
      </template>
      <template v-slot:append>
        <q-btn
          class="no-disable"
          :disable="false"
          flat
          round
          dense
          :icon="modelValue?.fixedUser ? 'lock' : 'lock_open'"
          @click="toggleLock"
        />
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

import { ref, watch } from "vue";
import HiveAvatar from "components/utils/HiveAvatar.vue";
import { useI18n } from "vue-i18n";
import { useHiveProfile } from "src/use/useHive";
import { useIsEVMAddress, useShortEVMAddress } from "src/use/useEVM";
import { authDebug } from "src/utils/authDebug";
import { serverHiveAccount } from "boot/axios";
import { isServerHiveAccount } from "src/utils/authSession";

const props = defineProps({
  label: {
    type: String,
    default: "Hive Account",
  },
  prefix: {
    type: String,
    default: "",
  },
  // Login and passkey forms set this. Pay-to fields leave it off so a
  // transfer to the gateway account still validates.
  blockServerAccount: {
    type: Boolean,
    default: false,
  },
});

const modelValue = defineModel({
  label: "",
  value: "",
  caption: "",
  valid: false,
  fixedUser: false,
});
const simpleInput = ref("");
const isValidAccount = ref(false);
const avatarName = ref("");
const simpleHiveInput = ref(null);

const { t } = useI18n();

watch(modelValue, (val) => {
  if (modelValue.value.value != simpleInput.value) {
    simpleInput.value = modelValue.value.value;
    updateHiveAccTo(simpleInput.value, modelValue.value.fixedUser);
  }
});

function isBlockedServerName(val) {
  if (!props.blockServerAccount || !val) return false;
  return isServerHiveAccount(
    String(val).toLowerCase().trim(),
    serverHiveAccount,
  );
}

function accountRule(val) {
  if (val === "" || val == null) return true;
  if (isBlockedServerName(val)) return "Server account cannot log in here";
  return isValidAccount.value || t("no_account");
}

function clearInput() {
  modelValue.value.fixedUser = false;
  modelValue.value.valid = false;
  modelValue.value.value = "";
  modelValue.value.label = "";
  modelValue.value.caption = props.label;
  simpleInput.value = "";
  isValidAccount.value = false;
  if (simpleHiveInput.value) {
    simpleHiveInput.value.validate();
  }
  avatarName.value = "";
}

function toggleLock() {
  if (!modelValue.value.value) {
    clearInput();
    modelValue.value.fixedUser = false;
    return;
  }
  modelValue.value.fixedUser = !modelValue.value.fixedUser;
}

async function updateHiveAccTo(val, fixed) {
  authDebug("updateHiveAccTo", val, fixed);
  if (!val) {
    clearInput();
    return;
  }
  val = val.toLowerCase().trim();
  if (isBlockedServerName(val)) {
    modelValue.value = {
      label: val,
      value: val,
      caption: setCaption(val),
      valid: false,
      fixedUser: !!fixed,
    };
    isValidAccount.value = false;
    avatarName.value = val;
    if (simpleHiveInput.value) {
      simpleHiveInput.value.validate();
    }
    return;
  }
  modelValue.value = {
    label: val,
    value: val,
    caption: val,
  };
  isValidAccount.value = false;
  avatarName.value = val;
  simpleHiveInput.value.validate();

  const result = await useHiveProfile(val);
  if (result) {
    if (result?.metadata?.profile?.name) {
      modelValue.value.caption = setCaption(result?.metadata?.profile?.name);
    } else {
      modelValue.value.caption = setCaption(val);
    }
    modelValue.value.fixedUser = fixed;
    modelValue.value.valid = true;
    isValidAccount.value = true;
    if (simpleHiveInput.value) {
      simpleHiveInput.value.validate();
    }
  } else {
    authDebug("No Hive profile found for", val);
    const isEVM = useIsEVMAddress(val);
    if (isEVM) {
      modelValue.value.caption = useShortEVMAddress(val);
      modelValue.value.fixedUser = fixed;
      modelValue.value.valid = true;
      isValidAccount.value = true;
    }
  }
}

function setCaption(profileName) {
  if (props.prefix === "") {
    return profileName;
  }
  // Check if profileName already starts with the prefix
  if (profileName.startsWith(props.prefix)) {
    return profileName;
  }

  return props.prefix + " " + profileName;
}
</script>

<style lang="scss" scoped></style>
