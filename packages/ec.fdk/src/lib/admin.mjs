import { expect, query, apiURL, fetcher } from "./util.mjs";

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
