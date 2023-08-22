import { expect, query, apiURL, fetcher } from "./lib.mjs";

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
