// getAppDetails.js
//
// This file contains the function that returns the app name and version
// from the package.json file.
// ----------------------------------------------------------------------------
import { name, version } from "../../package.json"
import { ref } from "vue"

export function useAppDetails() {
  const appVersion = ref(version)
  const appName = ref(name)
  return { appName, appVersion }
}
