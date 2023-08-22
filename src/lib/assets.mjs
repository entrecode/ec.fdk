import { expect, query, apiURL, fetcher } from "./util.mjs";

export async function getAsset({ env, dmShortID, assetGroup, assetID, token }) {
  expect({ env, dmShortID, assetGroup, assetID });
  const q = query({ assetID: assetID });
  const url = apiURL(`a/${dmShortID}/${assetGroup}?${q}`, env);
  const list = await fetcher(url, { dmShortID, token });
  return list._embedded["ec:dm-asset"];
}

export async function assetList(config) {
  let { env, dmShortID, assetGroup, token, options = {} } = config;
  expect({ env, dmShortID, assetGroup });
  options = { size: 50, page: 1, _list: true, ...options };
  // name~ = search
  const q = query(options);
  const url = apiURL(`a/${dmShortID}/${assetGroup}?${q}`, env);
  const { count, total, _embedded } = await fetcher(url, { dmShortID, token });
  const items = _embedded ? _embedded[`ec:dm-asset`] : [];
  return { count, total, items };
}
