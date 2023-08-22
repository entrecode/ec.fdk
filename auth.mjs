import { persistentMap } from "@nanostores/persistent";
import { expect, apiURL, fetcher } from "./lib.mjs";

const accountServer = {
  stage: "https://accounts.cachena.entrecode.de/",
  production: "https://accounts.cachena.entrecode.de/",
};

// maybe switch to cookie: https://github.com/nanostores/persistent#persistent-engines
export const auth = persistentMap(
  "ecAuth",
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

export function withAuthHeader(options, config) {
  const { token } = getAuth(config) || {};
  if (!token) {
    return options;
  }
  return {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
  };
}

export async function loginPublic(config) {
  let { env, dmShortID, email, password } = config;
  expect({ env, dmShortID, email, password });
  // TODO: check if already logged in?
  const url = apiURL(`api/${dmShortID}/_auth/login?clientID=rest`, env);
  const res = await fetcher(
    url,
    {},
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  auth.set({ ...auth.get(), [dmShortID]: { token: res.token } });
  return res;
}

export async function loginEc(config) {
  let { env, email, password } = config;
  expect({ env, email, password });
  const url = `${accountServer[env]}auth/login?clientID=rest`;
  const res = await fetcher(
    url,
    {},
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  auth.set({ ...auth.get(), [env]: { token: res.token } });
  return res;
}

export async function logoutPublic(config) {
  let { dmShortID, env } = config;
  expect({ dmShortID, env });
  const { token } = getAuth(config);
  if (!token) {
    throw new Error("cannot logout: not logged in!");
  }
  const url = apiURL(
    `api/${dmShortID}/_auth/logout?clientID=rest&token=${token}`,
    env
  );
  const res = await fetcher(
    url,
    { dmShortID, rawRes: true },
    {
      method: "POST",
    }
  );
  auth.set({ ...auth.get(), [dmShortID]: {} });
  return res;
}

export async function logoutEc(config) {
  let { env } = config;
  expect({ env });
  const { token } = getEcAuth(config);
  if (!token) {
    throw new Error("cannot logout: not logged in!");
  }
  const url = `${accountServer[env]}auth/logout?clientID=rest`;
  const res = await fetcher(
    url,
    {
      rawRes: true,
    },
    {
      method: "POST",
    }
  );
  auth.set({ ...auth.get(), [env]: {} });
  return res;
}
