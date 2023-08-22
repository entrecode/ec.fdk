import { withAuthHeader } from "./auth.mjs";
export * from "./auth.mjs";

export async function fetcher(url, config = {}, options = {}) {
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

export function apiURL(route, env = "stage") {
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

export function expect(obj) {
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined) {
      throw new Error(`expected ${key} to be set!`);
    }
  });
}

// exports

// entries

export async function entryList(config) {
  let { env, dmShortID, model, options = {} } = config;
  expect({ env, dmShortID, model });
  options = { size: 50, page: 1, _list: true, ...options };
  // name~ = search
  const q = query(options);
  const url = apiURL(`api/${dmShortID}/${model}?${q}`, env);
  const { count, total, _embedded } = await fetcher(url, config);

  const items = _embedded ? _embedded[`${dmShortID}:${model}`] : [];
  return { count, total, items };
}

export function getEntry({ env, dmShortID, model, entryID }) {
  expect({ env, dmShortID, model, entryID });
  const q = query({ _id: entryID });
  const url = apiURL(`api/${dmShortID}/${model}?${q}`, env);
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

export async function getAsset({ env, dmShortID, assetGroup, assetID }) {
  expect({ env, dmShortID, assetGroup, assetID });
  const q = query({ assetID: assetID });
  const url = apiURL(`a/${dmShortID}/${assetGroup}?${q}`, env);
  const list = await fetcher(url, { dmShortID });
  return list._embedded["ec:dm-asset"];
}

export async function assetList(config) {
  let { env, dmShortID, assetGroup, options = {} } = config;
  expect({ env, dmShortID, assetGroup });
  options = { size: 50, page: 1, _list: true, ...options };
  // name~ = search
  const q = query(options);
  const url = apiURL(`a/${dmShortID}/${assetGroup}?${q}`, env);
  const { count, total, _embedded } = await fetcher(url, { dmShortID });
  const items = _embedded ? _embedded[`ec:dm-asset`] : [];
  return { count, total, items };
}
