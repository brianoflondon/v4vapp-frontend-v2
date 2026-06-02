// usePasskeys.js
//
// This file is a utility for managing passkeys. It is used by the
// Login.vue component to manage the passkeys used in the login process.
//

import { apiLogin } from "boot/axios";
import { useStoreUser } from "src/stores/storeUser";
import * as webauthn from "@github/webauthn-json";
import { useAppStr } from "src/use/useAppDetails";
import { authDebug, authError } from "src/utils/authDebug";

const storeUser = useStoreUser();

/**
 * Retrieves a list of credentials.
 * @returns {Promise<Array>} A promise that resolves to an array of credentials.
 */
export async function useListCredentials(useCache = true) {
  if (!storeUser.currentUser) {
    return [];
  }
  const listCredentials = await apiLogin.get(`/credentials/list/`, {
    params: { useCache: useCache },
  });
  authDebug("credentials", listCredentials.data);
  return listCredentials.data;
}

/**
 * Retrieves the number of credentials for a given hive account name.
 *
 * @param {string} hiveAccname - The hive account name.
 * @returns {Promise<number>} The number of credentials.
 */
export async function useNumCredentials(hiveAccname, useCache = true) {
  authDebug("useNumCredentials - start", hiveAccname);
  if (!hiveAccname) {
    return 0;
  }
  try {
    const numCredentials = await apiLogin.get(
      `/credentials/count/${hiveAccname}`,
      { params: { useCache: useCache } },
    );
    authDebug("numCredentials", numCredentials.data);
    return numCredentials.data.devices;
  } catch (error) {
    authDebug("useNumCredentials error", error);
    return 0;
  }
}

export async function usePasskeyLogin(hiveAccName) {
  authDebug("webauthnAuth - start");
  if (!hiveAccName) {
    authError("No Hive Account Name provided");
    return { success: false, message: "no account" };
  }
  let params = {
    hive_accname: hiveAccName,
    clientId: storeUser.clientId,
    appId: useAppStr(),
  };
  let getChallenge = null;
  try {
    getChallenge = await apiLogin.post(`/authenticate/begin/`, params, {
      params,
    });
    authDebug("getChallenge.data", getChallenge.data);
  } catch (error) {
    if (error.response.status === 401) {
      authDebug("No Credentials found for this account");
      return { success: false, message: "no credentials" };
    }
    authError("getChallenge error", error);
    return { success: false, message: "challenge error" };
  }
  try {
    let response = await webauthn.get(getChallenge.data);
    authDebug("response", response);
    let sendChallengeBack = await apiLogin.post(
      `/authenticate/complete/`,
      response,
      {
        params,
        headers: { "Content-Type": "application/json" },
        // Must send withCredentials so the existing HttpOnly refresh cookie (if any)
        // is included. This allows the backend to call attach_user_to_existing_session
        // and grow the allowed_users list on the 00_pointer primary record instead of
        // always creating a fresh single-user session.
        withCredentials: true,
      },
    );
    if (sendChallengeBack.data.access_token) {
      // give me a date 1 week in the future
      return { success: true, token: sendChallengeBack.data.access_token };
      let expireDate = new Date();
    }
  } catch (error) {
    authError("webauthn.get error", error);
    return { success: false, message: error.message };
  }
}

/**
 * Registers a device using a passkey.
 *
 * @param {string} hiveAccName - The Hive Account name.
 * @param {string} deviceName - The name of the device.
 * @returns {Promise<{ success: boolean, message: string }>} - A promise that resolves to an object with the success status and a message.
 */
export async function usePasskeyRegister(hiveAccName, deviceName) {
  authDebug("usePasskeyRegister - start");
  // First get the challenge from the server
  // Then call webauthn.create with the challenge
  if (!deviceName || !hiveAccName) {
    return { success: false, message: "No device name or Hive Account" };
  }
  let params = {
    hive_accname: hiveAccName,
    clientId: storeUser.clientId,
    appId: useAppStr(),
    deviceName: deviceName,
  };

  let getChallenge = null;
  try {
    getChallenge = await apiLogin.post(`/register/begin/`, params, {
      params,
    });
  } catch (error) {
    return { success: false, message: "challenge error" };
  }
  // let options = webauthn.parseCreationOptionsFromJSON(getChallenge.data)
  // authDebug("options", options)
  let response = null;
  try {
    response = await webauthn.create(getChallenge.data);
  } catch (error) {
    return { success: false, message: error.message };
  }
  let sendChallengeBack = null;
  try {
    sendChallengeBack = await apiLogin.post(`/register/complete/`, response, {
      params,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    authError("sendChallengeBack error", error);
    return { success: false, message: error.message };
  }
  authDebug("sendChallengeBack.data", sendChallengeBack.data);
  return { success: true, message: "Device Registered" };
}

export async function usePasskeyDelete(credentialId) {
  authDebug("usePasskeyDelete - start");
  if (!credentialId) {
    return { success: false, message: "Nothing to delete" };
  }
  let params = {
    credentialId: credentialId,
  };
  let response = null;
  try {
    response = await apiLogin.delete(`/credentials/delete/`, {
      params: params,
    });
    authDebug("response", response.data);
    return { success: true, message: "device deleted" };
  } catch (error) {
    authError("usePasskeyDelete error", error);
    return { success: false, message: "delete error" };
  }
}

export async function usePasskeyUpdate(credentialId, newDeviceName) {
  authDebug("usePasskeyUpdate - start");
  if (!credentialId || !newDeviceName) {
    return { success: false, message: "Nothing to update" };
  }
  let params = {
    credentialId: credentialId,
    deviceName: newDeviceName,
  };
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  let response = null;
  try {
    response = await apiLogin.put(`/credentials/update/`, params, config);
    authDebug("response", response.data);
    return { success: true, message: "device updated" };
  } catch (error) {
    authError("usePasskeyUpdate error", error);
    return { success: false, message: "update error" };
  }
}
