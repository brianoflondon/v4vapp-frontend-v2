<template>
  <div class="q-pa-md">
    <div class="q-gutter-md">
      <q-select
        filled
        v-model="model"
        clearable
        use-input
        hide-selected
        fill-input
        input-debounce="0"
        label="Focus after filtering"
        :options="options"
        @filter="filterFn"
        @filter-abort="abortFilterFn"
        style="width: 250px"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> No results </q-item-section>
          </q-item>
        </template>
      </q-select>

      <q-select
        filled
        v-model="model"
        clearable
        use-input
        hide-selected
        fill-input
        input-debounce="0"
        label="Autoselect after filtering"
        :options="options"
        @filter="filterFnAutoselect"
        @filter-abort="abortFilterFn"
        style="width: 250px"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> No results </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useLoadHiveAccountsReputation } from "src/use/useHive"

const stringOptions = ["Type to Find", "A Hive Account"]

const options = ref(stringOptions)
const model = ref(null)

function filterFn(val, update, abort) {
  setTimeout(() => {
    update(
      () => {
        if (val === "") {
          options.value = stringOptions
        } else {
          const needle = val.toLowerCase()
          options.value = stringOptions.filter(
            (v) => v.toLowerCase().indexOf(needle) > -1
          )
        }
      },
      (ref) => {
        if (val !== "" && ref.options.length > 0) {
          ref.setOptionIndex(-1)
          ref.moveOptionSelection(1, true)
        }
      }
    )
  }, 300)
}

async function filterFnAutoselect(val, update, abort) {
  console.log("val", val)
  // await new Promise((resolve) => setTimeout(resolve, 1))
  update(
    async () => {
      if (val === "") {
        options.value = stringOptions
      } else {
        const needle = val.toLowerCase()
        options.value = await useLoadHiveAccountsReputation(needle)
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
