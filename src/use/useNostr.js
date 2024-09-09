// import { useStoreUser } from "src/stores/storeUser"
// import { useGetChallenge, useValidateApi } from "src/use/useUtils"
// import { nip19 } from "nostr-tools"

// export async function useNostrLoginFlow() {
//   const storeUser = useStoreUser()
//   if (typeof window.nostr !== "undefined") {
//     try {
//       const nostrPubkey = await window.nostr.getPublicKey() // returns a public key as hex
//       const nostrNpub = nip19.npubEncode(nostrPubkey) // returns a public key as hex
//       console.log("nostrPubkey: ", nostrPubkey)
//       console.log("nostrNpub: ", nostrNpub)
//       const clientId = storeUser.clientId
//       const challenge = await useGetChallenge(nostrNpub, clientId)
//       console.log("challenge: ", challenge)
//       const event = {
//         created_at: Math.floor(Date.now() / 1000),
//         kind: 1, // Kind 1 is a text note in Nostr
//         tags: [],
//         content: challenge.data.challenge,
//       }

//       // Sign the event
//       const signedEvent = await window.nostr.signEvent(event)
//       console.log("Signed event: ", signedEvent)
//       if (!signedEvent) {
//         console.error("User Rejected Signature Request")
//         return
//       }
//       // Send the signed event to the server
//       const signatureData = {
//         success: true,
//         result: signedEvent.sig,
//         data: {
//           username: nostrNpub,
//           message: challenge.data.challenge,
//         },
//         signature: signedEvent.sig,
//         account: nostrNpub,
//       }
//       try {
//         const validate = await useValidateApi(clientId, signatureData)
//         console.log("validate: ", validate)
//         console.log("logging in with Nostr")
//       } catch (error) {
//         console.error("Error validating Nostr signature", error)
//       }
//     } catch (error) {
//       console.error("Error connecting to Nostr", error)
//     }
//   } else {
//     console.log("No Nostr wallet found")
//   }
// }
