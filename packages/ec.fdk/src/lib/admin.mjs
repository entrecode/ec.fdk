import { expect, query, apiURL, fetcher } from "./util.mjs";

export async function getDatamanager(config) {
  // https://datamanager.cachena.entrecode.de/?_list=true&page=1&size=25
  let { env, dmID, token } = config;
  expect({ env, dmID });
  const url = apiURL(`?dataManagerID=${dmID}`, env);
  return fetcher(url, { token });
}

export async function dmList(config) {
  // https://datamanager.cachena.entrecode.de/?_list=true&page=1&size=25
  let { env, options = {} } = config;
  expect({ env });
  options = { size: 25, page: 1, _list: true, ...options };
  // name~ = search
  const q = query(options);
  const url = apiURL(`?${q}`, env);
  const { count, total, _embedded } = await fetcher(url, config);
  let items = _embedded ? _embedded[`ec:datamanager`] : [];
  items = !Array.isArray(items) ? [items] : items;
  return { count, total, items };
}

export async function modelList(config) {
  // https://datamanager.cachena.entrecode.de/model?dataManagerID=254a03f1-cb76-4f1e-a52a-bbd4180ca10c&_list=true&size=0
  let { env, dmID, options = {} } = config;
  expect({ env, dmID });
  options = { size: 25, dataManagerID: dmID, page: 1, _list: true, ...options };
  const q = query(options);
  const url = apiURL(`model?${q}`, env);
  const { count, total, _embedded } = await fetcher(url, config);
  let items = _embedded ? _embedded[`ec:model`] : [];
  items = !Array.isArray(items) ? [items] : items;
  return { count, total, items };
}

export async function resourceList(config) {
  // https://<subdomain>.cachena.entrecode.de/<resource>?_list=true&size=0
  let { env, resource, options = {}, subdomain = "datamanager" } = config;
  expect({ env, subdomain, resource });
  options = { size: 25, page: 1, _list: true, ...options };
  const q = query(options);
  const url = apiURL(`${resource}?${q}`, env, subdomain);
  const { count, total, _embedded } = await fetcher(url, config);
  let items = _embedded ? _embedded[Object.keys(_embedded)[0]] : [];
  items = !Array.isArray(items) ? [items] : items;
  return { count, total, items };
}

export async function raw(config, fetchOptions = {}) {
  // https://<subdomain>.cachena.entrecode.de/<route>?<options>
  let { env, route, options = {}, subdomain = "datamanager" } = config;
  expect({ env, subdomain, route });
  options = { ...options };
  const q = query(options);
  const url = apiURL(`${route}?${q}`, env, subdomain);
  return fetcher(url, config, fetchOptions);
}
