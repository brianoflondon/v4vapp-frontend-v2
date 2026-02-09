// getAppDetails.js
//
// This file contains the function that returns the app name and version
// from the package.json file.
// ----------------------------------------------------------------------------
import { productName, version } from "../../package.json";
import { ref } from "vue";

export function useAppDetails() {
  const appVersion = ref(version);
  const appName = ref(productName);
  return { appName, appVersion };
}

/**
 * Returns the application string composed of the lowercase product name and version.
 * @returns {string} The application string.
 */
export function useAppStr() {
  let appVersion = version;
  let appName = productName.toLowerCase();
  appName = appName.replace(/\s/g, "");
  let appStr = `${appName}-${appVersion}`;
  // remove spaces replace with nothing in appName
  return appStr;
}
