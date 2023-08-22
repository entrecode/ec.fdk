import { persistentMap } from "@nanostores/persistent";

// maybe switch to cookie: https://github.com/nanostores/persistent#persistent-engines
export const auth = persistentMap(
  "ecAuth",
  {},
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

function withAuthHeader(options, config) {
  const { token } = getAuth(config);
  if (!token) {
    return options;
  }
  return {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
  };
}

async function fetcher(url, config = {}, options = {}) {
  options = withAuthHeader(options, config);
  const res = await fetch(url, options);
  console.log("fetch", url, options);
  if (!res.ok) {
    throw new Error(res.statusText);
  }
  if (config.rawRes) {
    return res;
  }
  return await res.json();
}

const apis = {
  production: "https://datamanager.entrecode.de/",
  stage: "https://datamanager.cachena.entrecode.de/",
};

function apiURL(route, env = "stage") {
  const base = apis[env];
  if (!base) {
    throw new Error(
      `env "${env}" not found. Try one of ${Object.keys(apis).join(", ")}`
    );
  }
  return base + route;
}

function query(params) {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function expect(obj) {
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined) {
      throw new Error(`expected ${key} to be set!`);
    }
  });
}

// exports

// entries

export async function entryList(config) {
  let { dmShortID, model, options = {} } = config;
  expect({ dmShortID, model });
  options = { size: 50, page: 1, _list: true, ...options };
  // name~ = search
  const q = query(options);
  const url = apiURL(`api/${dmShortID}/${model}?${q}`);
  const { count, total, _embedded } = await fetcher(url, config);

  const items = _embedded ? _embedded[`${dmShortID}:${model}`] : [];
  return { count, total, items };
}

export function getEntry({ dmShortID, model, entryID }) {
  expect({ dmShortID, model, entryID });
  const q = query({ _id: entryID });
  const url = apiURL(`api/${dmShortID}/${model}?${q}`);
  return fetcher(url, { dmShortID });
}

export async function createEntry({ dmShortID, model, value }) {
  expect({ dmShortID, model, value });
  console.log("create entry", dmShortID, model, value);
  return;
  // POST https://datamanager.cachena.entrecode.de/api/83cc6374/muffin
}
export async function editEntry({ dmShortID, model, entryID, value }) {
  expect({ dmShortID, model, entryID, value });
  console.log("edit entry", dmShortID, model, entryID, value);
  return;
  // https://datamanager.cachena.entrecode.de/api/83cc6374/
}

// assets

export async function getAsset({ dmShortID, assetGroup, assetID }) {
  expect({ dmShortID, assetGroup, assetID });
  const q = query({ assetID: assetID });
  const url = apiURL(`a/${dmShortID}/${assetGroup}?${q}`);
  const list = await fetcher(url, { dmShortID });
  return list._embedded["ec:dm-asset"];
}

export async function assetList(config) {
  let { dmShortID, assetGroup, options = {} } = config;
  expect({ dmShortID, assetGroup });
  options = { size: 50, page: 1, _list: true, ...options };
  // name~ = search
  const q = query(options);
  const url = apiURL(`a/${dmShortID}/${assetGroup}?${q}`);
  const { count, total, _embedded } = await fetcher(url, { dmShortID });
  const items = _embedded ? _embedded[`ec:dm-asset`] : [];
  return { count, total, items };
}

export async function loginPublic(config) {
  let { dmShortID, email, password } = config;
  expect({ dmShortID, email, password });
  // TODO: check if already logged in?
  const url = apiURL(`api/${dmShortID}/_auth/login?clientID=rest`);
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
export async function logoutPublic(config) {
  let { dmShortID } = config;
  expect({ dmShortID });
  const { token } = getAuth(config);
  if (!token) {
    throw new Error("cannot logout: not logged in!");
  }
  const url = apiURL(
    `api/${dmShortID}/_auth/logout?clientID=rest&token=${token}`
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

export function getAuth(config) {
  let { dmShortID } = config;
  if (!dmShortID) {
    return {};
  }
  return auth.get()?.[dmShortID] || {};
}

export function hasAuth(config) {
  return !!getAuth(config)?.token;
}
