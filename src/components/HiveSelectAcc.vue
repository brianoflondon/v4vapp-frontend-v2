<template>
  <q-select
    class="hive-select-account"
    v-model="modelValue"
    hide-selected
    use-input
    fill-input
    clearable
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
 */
import { ref } from "vue";
import HiveAvatar from "components/utils/HiveAvatar.vue";
import { useLoadHiveAccountsReputation } from "src/use/useHive";

const options = ref([]);
const modelValue = defineModel();
const avatarName = ref("");

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
});

function enterFn(input) {
  // If Enter or tab is pressed before selecting from the options, the first option is selected
  if (!modelValue.value && options.value.length > 0) {
    modelValue.value = options.value[0];
  }
}

function escFn(input) {
  // If Esc is pressed, the model is cleared
  modelValue.value = "";
}

function inputFn(input) {
  // Change the avatar to match the input value
  avatarName.value = input;
}

async function updateOptions(val) {
  // Finds relevant Hive accounts for the options drop down
  if (val === "") {
    options.value = [];
  } else {
    const needle = val.toLowerCase().replace(/\s+/g, "");
    options.value = await useLoadHiveAccountsReputation(
      needle,
      props.maxOptions,
    );
    if (options.value) {
      avatarName.value = options.value[0];
    }
  }
}

async function filterFnAutoselect(val, update, abort) {
  // Finds relevant Hive accounts for the options drop down
  update(
    async () => {
      await updateOptions(val);
    },
    (ref) => {
      if (val !== "" && ref.options.length > 0 && ref.getOptionIndex() === -1) {
        ref.moveOptionSelection(1, true);
        ref.toggleOption(ref.options[ref.optionIndex], true);
      }
    },
  );
  abort(() => {
    abortFilterFn;
  });
}

const abortFilterFn = () => {};
</script>

<style lang="scss" scoped></style>
```
