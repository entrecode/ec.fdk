import { expect, apiURL, fetcher } from "./util";

const accountServer = {
  stage: "https://accounts.cachena.entrecode.de/",
  live: "https://accounts.entrecode.de/",
};

/** @ignore */
export async function loginPublic(config) {
  let { env, dmShortID, email, password } = config;
  expect({ env, dmShortID, email, password });
  const _fetch = config.fetcher || fetcher;
  // TODO: check if already logged in?
  const url = apiURL(`api/${dmShortID}/_auth/login?clientID=rest`, env);
  const res = await _fetch(
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
  return res;
}

/** @ignore */
export async function loginEc(config): Promise<{ token: string }> {
  let { env, email, password } = config;
  expect({ env, email, password });
  const _fetch = config.fetcher || fetcher;
  const url = `${accountServer[env]}auth/login?clientID=rest`;
  const res = await _fetch(
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
  return res;
}

/** @ignore */
export async function logoutPublic(config): Promise<{ token: string }> {
  let { dmShortID, env, token } = config;
  expect({ dmShortID, env, token });
  const _fetch = config.fetcher || fetcher;
  const url = apiURL(
    `api/${dmShortID}/_auth/logout?clientID=rest&token=${token}`,
    env
  );
  const res = await _fetch(
    url,
    { rawRes: true },
    {
      method: "POST",
    }
  );
  return res;
}

/** @ignore */
export async function logoutEc(config) {
  let { env, token } = config;
  expect({ env, token });
  const _fetch = config.fetcher || fetcher;
  const url = `${accountServer[env]}auth/logout?clientID=rest`;
  const res = await _fetch(
    url,
    {
      rawRes: true,
      token,
    },
    {
      method: "POST",
    }
  );
  return res;
}

/** @ignore */
export function getPublicAuthKey({ dmShortID }) {
  expect({ dmShortID });
  return dmShortID;
}

/** @ignore */
export function getEcAuthKey({ env }) {
  expect({ env });
  return env;
}
