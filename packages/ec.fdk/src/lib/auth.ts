import { expect, apiURL, fetcher } from "./util";

const accountServer = {
  stage: "https://accounts.cachena.entrecode.de/",
  live: "https://accounts.entrecode.de/",
};

/** @ignore */
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
  return res;
}

/** @ignore */
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
  return res;
}

/** @ignore */
export async function logoutPublic(config) {
  let { dmShortID, env, token } = config;
  expect({ dmShortID, env, token });
  const url = apiURL(
    `api/${dmShortID}/_auth/logout?clientID=rest&token=${token}`,
    env
  );
  const res = await fetcher(
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
  const url = `${accountServer[env]}auth/logout?clientID=rest`;
  const res = await fetcher(
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
