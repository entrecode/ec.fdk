import { persistentMap } from "@nanostores/persistent";
import {
  loginPublic,
  logoutPublic,
  loginEc,
  logoutEc,
} from "./lib/actions.mjs";

// maybe switch to cookie: https://github.com/nanostores/persistent#persistent-engines
export const auth = persistentMap(
  "fdk.auth",
  {},
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export function getPublicAuth(config) {
  let { dmShortID } = config;
  if (!dmShortID) {
    return;
  }
  return auth.get()?.[dmShortID];
}

export function getEcAuth(config) {
  let { env } = config;
  if (!env) {
    return;
  }
  return auth.get()?.[env];
}

export function getAuth(config) {
  return getEcAuth(config) || getPublicAuth(config);
}

export function hasAnyToken(config) {
  return !!getEcAuth(config)?.token || !!getPublicAuth(config)?.token;
}

export function hasEcToken(config) {
  return !!getEcAuth(config)?.token;
}
export function hasPublicToken(config) {
  return !!getPublicAuth(config)?.token;
}

export async function loginPublicStored(config) {
  const res = await loginPublic(config);
  auth.setKey(config.dmShortID, { token: res.token });
  return res;
}
export async function loginEcStored(config) {
  const res = await loginEc(config);
  auth.setKey(config.env, { token: res.token });
  return res;
}

export async function logoutPublicStored(config) {
  const res = await logoutPublic(config);
  auth.setKey(config.dmShortID, {});
  return res;
}
export async function logoutEcStored(config) {
  const res = await logoutEc(config);
  auth.setKey(config.env, { token: res.token });
  return res;
}
