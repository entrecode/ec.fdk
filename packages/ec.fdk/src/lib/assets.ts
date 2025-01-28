import { AssetList, AssetResource } from "src/types";
import { apiURL, expect, fetcher, query } from "./util";

/** @ignore */
export async function getAsset({
  env,
  dmShortID,
  assetGroup,
  assetID,
  token,
}): Promise<AssetResource> {
  expect({ env, dmShortID, assetGroup, assetID });
  const q = query({ assetID: assetID });
  const url = apiURL(`a/${dmShortID}/${assetGroup}?${q}`, env);
  const { _embedded } = await fetcher(url, { token });
  return _embedded ? _embedded["ec:dm-asset"] : undefined;
}

/** @ignore */
export async function assetList(config): Promise<AssetList> {
  let { env, dmShortID, assetGroup, token, options = {} } = config;
  expect({ env, dmShortID, assetGroup });
  options = { size: 50, page: 1, _list: true, ...options };
  // name~ = search
  const q = query(options);
  const url = apiURL(`a/${dmShortID}/${assetGroup}?${q}`, env);
  const { count, total, _embedded } = await fetcher(url, { token });
  let items = _embedded ? _embedded["ec:dm-asset"] : [];
  items = !Array.isArray(items) ? [items] : items;
  return { count, total, items };
}

/**
 * @ignore
 */
export async function createAsset({
  env,
  dmShortID,
  assetGroup,
  token,
  file,
  name,
  options,
}): Promise<AssetResource> {
  expect({ env, dmShortID, assetGroup, file });

  const url = apiURL(`a/${dmShortID}/${assetGroup}`, env);
  const formData = new FormData();
  formData.append("file", file, name);
  if (options) {
    Object.keys(options).forEach((key) => {
      formData.append(key, options[key]);
    });
  }

  const list = await fetcher(
    url,
    { token },
    {
      method: "POST",
      body: formData,
    }
  );
  return list._embedded["ec:dm-asset"];
}

/**
 * @ignore
 */
export async function createAssets({
  env,
  dmShortID,
  assetGroup,
  files,
  options,
}): Promise<AssetResource[]> {
  expect({ env, dmShortID, assetGroup, files });
  const url = apiURL(`a/${dmShortID}/${assetGroup}`, env);
  const formData = new FormData();
  files.forEach((file: any) => {
    formData.append("file", file /* , name */);
  });
  if (options) {
    Object.keys(options).forEach((key) => {
      formData.append(key, options[key]);
    });
  }
  const list = await fetcher(
    url,
    {},
    {
      method: "POST",
      body: formData,
    }
  );
  if (!Array.isArray(list._embedded["ec:dm-asset"])) {
    return [list._embedded["ec:dm-asset"]];
  }
  return list._embedded["ec:dm-asset"];
}

/**
 * @ignore
 */
export async function deleteAsset({
  env,
  dmShortID,
  assetGroup,
  assetID,
  token,
}) {
  expect({ env, dmShortID, assetGroup, assetID });
  const url = apiURL(`a/${dmShortID}/${assetGroup}/${assetID}`, env);
  await fetcher(
    url,
    { token, rawRes: true },
    {
      method: "DELETE",
    }
  );
}
