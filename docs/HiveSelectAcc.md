## Select object for Hive Accounts

This is the extended explanation for the Simple selector for picking Hive Accounts: `HiveSelectAcc`.

This selector uses the Quasar `q-select` object and uses autocompletion based on the partial Hive account name entered. It looks up and presents options from the Hive API sorted in descending order of Hive account reputation. If an exact match for the entered Hive account is found, that is returned.

This Component emits the selected Hive account name and displays the selected Hive account's profile picture.

https://github.com/brianoflondon/v4vapp-frontend-v2/blob/f99a30a3cb208da0770497c1cabdf5ab27655690/src/components/SelectHiveAcc.vue

### Template

The Template options as set are taken from this example in the Quasar Documentation [SelectAfterFiltering](https://quasar.dev/vue-components/select#example--selecting-option-after-filtering).

Unfortunately all the examples in the Quasar documentation use the older Options API and I'm working with the newer Compositions API. I converted this example and you can find the converted version [at this link](https://github.com/brianoflondon/v4vapp-frontend-v2/blob/f99a30a3cb208da0770497c1cabdf5ab27655690/src/components/quasar/SelectAfterFiltering.vue)


```vue
<template>
  <q-select
    class="hive-select-account"
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
  </q-select>
</template>

```

### Script Setup

You will noticed that this component uses calls from `src/use/useHive.js` which I will also include below.

The optional props are described in the comment section.




```vue
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
  fancyOptions: {
    type: Boolean,
    default: false,
  },
})

watch(model, (newValue) => {
  // Watches the model which holds the selected value
  avatar.value = useHiveAvatarURL({ hiveAccname: newValue, size: props.size })
  emit("updateValue", newValue)
})

function enterFn(input) {
  // If Enter or tab is pressed before selecting from the options, the first option is selected
  if (!model.value && options.value.length > 0) {
    model.value = options.value[0]
  }
  emit("updateValue", model.value)
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
  update(
    async () => {
      if (val === "") {
        options.value = []
      } else {
        // Fetch the sorted list of Hive accounts after converting
        // the input to lowercase and removing spaces
        const needle = val.toLowerCase().replace(/\s+/g, "")
        options.value = await useLoadHiveAccountsReputation(
          needle,
          props.maxOptions
        )
        // Sets the displayed Hive avatar to the first option in the
        // options list
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

<style lang="scss" scoped></style>
```


### Hive Functions

First note is that I'm using the HiveTx library. [Hive-tx-js](https://github.com/mahdiyari/hive-tx-js). I was unable to get this to work successfullyy by installing with `yarn` so I copied the minified js file into my project and I import it like this:

`import "src/assets/hive-tx.min.js"`

You can see the complete file here: [useHive.js](https://github.com/brianoflondon/v4vapp-frontend-v2/blob/b2d442d248e5f3ae0a61c45f4156ef9db8dc9e1b/src/use/useHive.js)


## How to use the Template

This should be all you need to put the object in your own project. Once this object is on the page you will have access to the selected Hive account name in the `hiveAccname` variable.


```vue

<template>
  <HiveSelectAcc
    @updateValue="
      (value) => {
        hiveAccname = value
      }
    "
  />
</template>
import { ref } from "vue"
const hiveAccname = ref("")

<script setup>


</script>
```