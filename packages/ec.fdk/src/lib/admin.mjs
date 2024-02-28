import { expect, query, apiURL, fetcher } from "./util.mjs";

export async function getDatamanager(config) {
  let { env, dmID, token } = config;
  expect({ env, dmID });
  const url = apiURL(`?dataManagerID=${dmID}`, env); // https://datamanager.cachena.entrecode.de/?_list=true&page=1&size=25
  return fetcher(url, { token });
}

export async function dmList(config) {
  let { env, options = {} } = config;
  expect({ env });
  options = { size: 25, page: 1, _list: true, ...options };
  // name~ = search
  const q = query(options);
  const url = apiURL(`?${q}`, env); // https://datamanager.cachena.entrecode.de/?_list=true&page=1&size=25
  const { count, total, _embedded } = await fetcher(url, config);
  let items = _embedded ? _embedded[`ec:datamanager`] : [];
  items = !Array.isArray(items) ? [items] : items;
  return { count, total, items };
}

export async function modelList(config) {
  let { env, dmID, options = {} } = config;
  expect({ env, dmID });
  options = { size: 25, dataManagerID: dmID, page: 1, _list: true, ...options };
  const q = query(options);
  // https://datamanager.cachena.entrecode.de/model?dataManagerID=254a03f1-cb76-4f1e-a52a-bbd4180ca10c&_list=true&size=0
  const url = apiURL(`model?${q}`, env);
  const { count, total, _embedded } = await fetcher(url, config);
  let items = _embedded ? _embedded[`ec:model`] : [];
  items = !Array.isArray(items) ? [items] : items;
  return { count, total, items };
}
