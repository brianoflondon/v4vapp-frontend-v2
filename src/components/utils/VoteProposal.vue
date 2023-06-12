<template>
  <div v-if="modelValue?.showButton">
    <q-btn
      :label="$t('vote')"
      rounded
      color="yellow"
      text-color="black"
      @click="vote"
    >
      <q-tooltip>
        {{ $t("vote_for_proposal") }} {{ modelValue.proposalId }}
        {{ $t("and") }} {{ $t("witness") }} {{ $t("please") }}
      </q-tooltip>
    </q-btn>
  </div>
  <q-dialog v-model="modelValue.showDialog">
    <q-card>
      <div v-if="!modelValue.hiveUser">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h7">{{ $t("enter_hive_account") }}</div>
        </q-card-section>
        <q-card-section>
          <HiveSelectFancyAcc dense v-model="hiveAccname" fancy-options />
        </q-card-section>
      </div>
      <q-card-section class="text-center">
        <p><strong>{{ $t("please_vote") }}</strong></p>
        <div class="q-pa-md">
          {{ $t("vote_for_proposal") }} {{ modelValue.proposalId }}
          {{ $t("and") }} {{ $t("witness") }} {{ $t("please") }}
        </div>
        <q-btn
          :label="$t('vote')"
          rounded
          color="yellow"
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
import { ref } from "vue"
import HiveSelectFancyAcc from "components/HiveSelectFancyAcc.vue"
import { KeychainSDK } from "keychain-sdk"

const showThankYou = ref(false)

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

if (!modelValue.value?.proposalId) {
  modelValue.value.proposalId = "265"
}

const hiveAccname = ref({ label: "", value: modelValue.hiveUser, caption: "" })

function vote() {
  console.log("vote")
  console.log(modelValue.value)
  modelValue.value.showDialog = true
}

async function doVotes() {
  console.log("doVotes")

  let username = modelValue.value.hiveUser
  if (hiveAccname.value.value) {
    username = hiveAccname.value.value
  }
  const witnessVoted = false
  const proposalVoted = false
  try {
    const keychain = new KeychainSDK(window)
    const formParamsAsObject = {
      data: {
        username: username,
        proposal_ids: modelValue.proposalId,
        approve: true,
        extensions: modelValue.proposalId,
      },
    }
    const updateproposalvote = await keychain.updateProposalVote(
      formParamsAsObject.data
    )
    console.log({ updateproposalvote })
    proposalVoted = true
  } catch (error) {
    console.log({ error })
  }

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
    witnessVoted = true
  } catch (error) {
    console.log({ error })
  }
  if (witnessVoted && proposalVoted) {
    q.notify({
      message: $t("thank_you_for_voting"),
      type: "positive",
      position: "bottom",
      timeout: 5000,
    })
  }
  modelValue.value.showDialog = false
}
</script>

<style lang="scss" scoped></style>
