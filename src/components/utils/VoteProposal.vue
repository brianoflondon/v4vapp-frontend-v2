<template>
  <div v-if="modelValue?.showButton">
    <q-btn
      class="btn-fixed-width"
      align="around"
      :label="$t('vote')"
      rounded
      color="secondary"
      icon="how_to_vote"
      @click="vote"
    >
      <q-tooltip>
        {{ $t("vote_for_proposal") }} {{ modelValue.proposalId }}
        {{ $t("and") }} {{ $t("witness") }} {{ $t("please") }}
      </q-tooltip>
    </q-btn>
  </div>
  <q-dialog v-model="modelValue.showDialog" @hide="hideDialog">
    <q-card v-if="votedFor.proposal && votedFor.witness">
      <q-card-section>
        <div class="text-h6">{{ $t("thank_you") }}</div>
      </q-card-section>
      <q-card-section>
        <q-img src="/site-logo/v4vapp-logo-shadows.svg"></q-img>
      </q-card-section>
    </q-card>
    <q-card v-if="!(votedFor.proposal && votedFor.witness)">
      <div v-if="!modelValue.hiveUser">
        <q-card-section
          class="hive-accname-selector row items-center q-pb-none"
        >
          <div class="text-h7">{{ $t("enter_hive_account") }}</div>
        </q-card-section>
        <q-card-section>
          <HiveSelectFancyAcc dense v-model="hiveAccname" fancy-options />
        </q-card-section>
      </div>
      <q-card-section class="text-center">
        <p class="text-h6">{{ $t("voting_as") }} @{{ hiveAccname.value }}</p>
      </q-card-section>
      <q-card-section class="text-center">
        <p>
          <strong>{{ $t("please_vote") }}</strong>
        </p>
        <div class="q-pa-md">
          {{ $t("vote_for_proposal") }} {{ modelValue.proposalId }}
          {{ $t("and") }} {{ $t("witness") }} {{ $t("please") }}
        </div>
        <q-btn
          :label="$t('vote')"
          name="Vote Proposal"
          rounded
          color="primary"
          text-color="black"
          @click="doVotes"
        >
          <q-tooltip>
            {{ $t("vote_for_proposal") }} {{ modelValue.proposalId }}
            {{ $t("and") }} {{ $t("witness") }} {{ $t("please") }}
          </q-tooltip>
        </q-btn>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { onMounted, ref, watch } from "vue"
import HiveSelectFancyAcc from "components/HiveSelectFancyAcc.vue"
import { KeychainSDK } from "keychain-sdk"
import { useStoreUser } from "src/stores/storeUser"
import { useQuasar } from "quasar"
import { useI18n } from "vue-i18n"
import {
  useCheckProxyVote,
  useGetHiveProposalVotes,
  useGetHiveWitnessVotes,
} from "src/use/useHive"
const t = useI18n().t
const q = useQuasar()
const showThankYou = ref(false)
const storeUser = useStoreUser()
const votedFor = ref({
  proposal: false,
  witness: false,
})
const proxy = ref(false)

storeUser.update()
const modelValue = defineModel({
  hiveUser: {
    type: String,
    default: "",
  },
  proposalId: {
    type: String,
    default: "265",
  },
  showButton: {
    type: Boolean,
    default: false,
  },
  showDialog: {
    type: Boolean,
    default: false,
  },
})

const hiveAccname = ref({ label: "", value: modelValue.hiveUser, caption: "" })

if (!modelValue.value?.proposalId) {
  modelValue.value.proposalId = "265"
}

onMounted(async () => {
  storeUser.update()
  if (storeUser.currentUser) {
    hiveAccname.value["value"] = storeUser.currentUser
    modelValue.value.hiveUser = storeUser.currentUser
  }
})

// Watches to see if a new hive account name is selected
watch(
  () => hiveAccname.value.value,
  async (newVal, oldVal) => {
    if (newVal && oldVal === null) {
      modelValue.value.hiveUser = newVal
    }
    await checkVotes(modelValue.value.hiveUser, modelValue.value.proposalId)
  }
)

async function checkVotes(username, proposalId) {
  console.log("checkVotes", username, proposalId)
  const votes = await useGetHiveProposalVotes(username, proposalId)
  if (votes) {
    votedFor.value.proposal = true
  }
  proxy.value = await useCheckProxyVote(username)
  username = proxy.value || username

  const witnessVotes = await useGetHiveWitnessVotes(username, "brianoflondon")
  votedFor.value.witness = witnessVotes
}

// Function run when the vote button is clicked
async function vote() {
  console.log("modelValue.value.hiveUser: ", modelValue.value.hiveUser)
  if (!modelValue.value.hiveUser) {
    modelValue.value.hiveUser = hiveAccname.value.value || storeUser.currentUser
  }
  hiveAccname.value.value = modelValue.value.hiveUser
  modelValue.value.showDialog = true
}

async function doVotes() {
  console.log("doVotes")
  let username = modelValue.value.hiveUser
  if (hiveAccname.value.value) {
    username = hiveAccname.value.value
  }
  console.log("username: ", { username })
  console.log()
  if (!votedFor.value.proposal) {
    try {
      const keychain = new KeychainSDK(window)
      const formParamsAsObject = {
        data: {
          username: username,
          proposal_ids: [modelValue.value.proposalId],
          approve: true,
          extensions: [modelValue.value.proposalId],
        },
      }
      const updateproposalvote = await keychain.updateProposalVote(
        formParamsAsObject.data
      )
      console.log({ updateproposalvote })
      votedFor.value.proposal = true
    } catch (error) {
      console.log({ error })
    }
  }
  if (!votedFor.value.witness && !proxy.value) {
    try {
      const keychain = new KeychainSDK(window)
      const formParamsAsObject = {
        data: {
          username: username,
          witness: "brianoflondon",
          vote: true,
        },
      }
      const witnessvote = await keychain.witnessVote(formParamsAsObject.data)
      console.log({ witnessvote })
      votedFor.value.witness = true
    } catch (error) {
      console.log({ error })
    }
  } else if (proxy.value) {
    console.log("voting by proxy proxy.value: ", proxy.value)
  }
  if (votedFor.value.witness || votedFor.value.proposal) {
    q.notify({
      message: t("thank_you_for_voting"),
      type: "positive",
      position: "bottom",
      timeout: 5000,
    })
  }
  modelValue.value.showDialog = false
}

function hideDialog() {
  modelValue.value.hiveUser = ""
  hiveAccname.value = { label: "", value: "", caption: "" }
  modelValue.value.showDialog = false
}
</script>

<style lang="scss" scoped></style>
