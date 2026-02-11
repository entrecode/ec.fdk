import {
  AdminConfig,
  AdminListConfig,
  AdminDmConfig,
  AdminDmListConfig,
  AdminResourceListConfig,
  AdminCreateConfig,
  AdminDmCreateConfig,
  AssetGroupResource,
  AssetResource,
  AccountResource,
  ClientResource,
  DatamanagerList,
  DatamanagerResource,
  GroupResource,
  InviteResource,
  ModelList,
  ModelResource,
  ResourceList,
  RoleResource,
  TemplateResource,
  TokenResource,
} from "src/types";
import { expect, query, apiURL, fetcher } from "./util";

const jsonHeaders = { "Content-Type": "application/json" };

/** @ignore */
export async function getDatamanager(config: AdminDmConfig): Promise<DatamanagerResource> {
  // https://datamanager.cachena.entrecode.de/?_list=true&page=1&size=25
  let { env, dmID, token } = config;
  expect({ env, dmID });
  const url = apiURL(`?dataManagerID=${dmID}`, env);
  return fetcher(url, { token });
}

/** @ignore */
export async function dmList(config: AdminListConfig): Promise<DatamanagerList> {
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

/** @ignore  */
export async function modelList(config: AdminDmListConfig): Promise<ModelList> {
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

/** @ignore */
export async function resourceList(config: AdminResourceListConfig): Promise<ResourceList> {
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

/** @ignore */
export async function resourceGet(config: AdminResourceListConfig): Promise<any> {
  let { env, resource, options = {}, subdomain = "datamanager" } = config;
  expect({ env, subdomain, resource });
  const q = query(options);
  const url = apiURL(`${resource}?${q}`, env, subdomain);
  return fetcher(url, config);
}

/** @ignore */
export async function resourceEdit(config: AdminResourceListConfig & { value: any }): Promise<any> {
  let { env, resource, options = {}, subdomain = "datamanager", value } = config;
  expect({ env, subdomain, resource, value });
  const q = query(options);
  const url = apiURL(`${resource}?${q}`, env, subdomain);
  return fetcher(url, config, {
    method: "PUT",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

/** @ignore */
export async function resourceDelete(config: AdminResourceListConfig): Promise<Response> {
  let { env, resource, options = {}, subdomain = "datamanager" } = config;
  expect({ env, subdomain, resource });
  const q = query(options);
  const url = apiURL(`${resource}?${q}`, env, subdomain);
  return fetcher(url, { ...config, rawRes: true }, {
    method: "DELETE",
    headers: jsonHeaders,
  });
}

/**
 * Sends a raw fetch request to an API. Useful to call API endpoints that have no dedicated Fdk method or function.
 * The fetched URL is composed of:
 *
 * ```txt
 * https://<subdomain>(.cachena).entrecode.de/<route>?<options>
 * ```
 * @param config
 * @example
 * const options = {
 *   size: 25,
 *   dataManagerID: 'x',
 *   modelID: 'y'
 * };
 * const list = await raw({
 *   env: "stage",
 *   options, // query options
 *   route: 'entries',
 *   subdomain: 'dm-history',
 *   rawRes: true // if true, no .json() is called on res
 * });
 * // https://dm-history.cachena.entrecode.de/entries?size=25&datamanagerID=x&modelID=y
 * // checkout ec.editor4 for more examples
 *
 */
export async function raw<T = any>(
  config: {
    env?: string;
    route?: string;
    subdomain?: string;
    options?: Record<string, any>;
    token?: string;
    rawRes?: boolean;
  },
  fetchOptions = {}
): Promise<T> {
  // https://<subdomain>.cachena.entrecode.de/<route>?<options>
  let { env, route, options = {}, subdomain = "datamanager" } = config;
  expect({ env, subdomain, route });
  options = { ...options };
  const q = query(options);
  const url = apiURL(`${route}?${q}`, env, subdomain);
  return fetcher(url, config, fetchOptions);
}

// --- Datamanager CRUD ---

/** @ignore */
export async function createDatamanager(
  config: AdminCreateConfig<Partial<DatamanagerResource>>,
): Promise<DatamanagerResource> {
  let { env, token, value } = config;
  expect({ env, value });
  const url = apiURL("", env);
  return fetcher(url, { token }, {
    method: "POST",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

/** @ignore */
export async function editDatamanager(
  config: AdminDmConfig & { value: Partial<DatamanagerResource> },
): Promise<DatamanagerResource> {
  let { env, token, dmID, value } = config;
  expect({ env, dmID, value });
  const q = query({ dataManagerID: dmID });
  const url = apiURL(`?${q}`, env);
  return fetcher(url, { token }, {
    method: "PUT",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

/** @ignore */
export async function deleteDatamanager(config: AdminDmConfig): Promise<Response> {
  let { env, token, dmID } = config;
  expect({ env, dmID });
  const q = query({ dataManagerID: dmID });
  const url = apiURL(`?${q}`, env);
  return fetcher(url, { token, rawRes: true }, {
    method: "DELETE",
    headers: jsonHeaders,
  });
}

// --- Model CRUD ---

/** @ignore */
export async function createModel(
  config: AdminDmCreateConfig<Partial<ModelResource>>,
): Promise<ModelResource> {
  let { env, token, dmID, value } = config;
  expect({ env, dmID, value });
  const q = query({ dataManagerID: dmID });
  const url = apiURL(`model?${q}`, env);
  return fetcher(url, { token }, {
    method: "POST",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

/** @ignore */
export async function editModel(
  config: AdminDmConfig & { modelID: string; value: Partial<ModelResource> },
): Promise<ModelResource> {
  let { env, token, dmID, modelID, value } = config;
  expect({ env, dmID, modelID, value });
  const q = query({ dataManagerID: dmID, modelID });
  const url = apiURL(`model?${q}`, env);
  return fetcher(url, { token }, {
    method: "PUT",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

/** @ignore */
export async function deleteModel(
  config: AdminDmConfig & { modelID: string },
): Promise<Response> {
  let { env, token, dmID, modelID } = config;
  expect({ env, dmID, modelID });
  const q = query({ dataManagerID: dmID, modelID });
  const url = apiURL(`model?${q}`, env);
  return fetcher(url, { token, rawRes: true }, {
    method: "DELETE",
    headers: jsonHeaders,
  });
}

// --- Template CRUD ---

/** @ignore */
export async function createTemplate(
  config: AdminCreateConfig<Partial<TemplateResource>>,
): Promise<TemplateResource> {
  let { env, token, value } = config;
  expect({ env, value });
  const url = apiURL("template", env);
  return fetcher(url, { token }, {
    method: "POST",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

// --- Asset Group ---

/** @ignore */
export async function createAssetGroup(
  config: AdminDmCreateConfig<Partial<AssetGroupResource>>,
): Promise<AssetGroupResource> {
  let { env, token, dmID, value } = config;
  expect({ env, dmID, value });
  const q = query({ dataManagerID: dmID });
  const url = apiURL(`assetgroup?${q}`, env);
  return fetcher(url, { token }, {
    method: "POST",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

/** @ignore */
export async function editAssetGroup(
  config: AdminDmConfig & { assetGroupID: string; value: Partial<AssetGroupResource> },
): Promise<AssetGroupResource> {
  let { env, token, dmID, assetGroupID, value } = config;
  expect({ env, dmID, assetGroupID, value });
  const q = query({ dataManagerID: dmID, assetGroupID });
  const url = apiURL(`assetgroup?${q}`, env);
  return fetcher(url, { token }, {
    method: "PUT",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

// --- Asset metadata ---

/** @ignore */
export async function editAsset(
  config: AdminConfig & { dmShortID: string; assetGroup: string; assetID: string; value: Partial<AssetResource> },
): Promise<AssetResource> {
  let { env, token, dmShortID, assetGroup, assetID, value } = config;
  expect({ env, dmShortID, assetGroup, assetID, value });
  const url = apiURL(`a/${dmShortID}/${assetGroup}/${assetID}`, env);
  return fetcher(url, { token }, {
    method: "PUT",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

// --- DM Client ---

/** @ignore */
export async function editDmClient(
  config: AdminDmConfig & { clientID: string; value: Partial<ClientResource> },
): Promise<ClientResource> {
  let { env, token, dmID, clientID, value } = config;
  expect({ env, dmID, clientID, value });
  const q = query({ dataManagerID: dmID, clientID });
  const url = apiURL(`client?${q}`, env);
  return fetcher(url, { token }, {
    method: "PUT",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

// --- Role CRUD ---

/** @ignore */
export async function createRole(
  config: AdminDmCreateConfig<Partial<RoleResource>>,
): Promise<RoleResource> {
  let { env, token, dmID, value } = config;
  expect({ env, dmID, value });
  const q = query({ dataManagerID: dmID });
  const url = apiURL(`role?${q}`, env);
  return fetcher(url, { token }, {
    method: "POST",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

/** @ignore */
export async function editRole(
  config: AdminDmConfig & { roleID: string; value: Partial<RoleResource> },
): Promise<RoleResource> {
  let { env, token, dmID, roleID, value } = config;
  expect({ env, dmID, roleID, value });
  const q = query({ dataManagerID: dmID, roleID });
  const url = apiURL(`role?${q}`, env);
  return fetcher(url, { token }, {
    method: "PUT",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

/** @ignore */
export async function deleteRole(
  config: AdminDmConfig & { roleID: string },
): Promise<Response> {
  let { env, token, dmID, roleID } = config;
  expect({ env, dmID, roleID });
  const q = query({ dataManagerID: dmID, roleID });
  const url = apiURL(`role?${q}`, env);
  return fetcher(url, { token, rawRes: true }, {
    method: "DELETE",
    headers: jsonHeaders,
  });
}

// --- DM Account ---

/** @ignore */
export async function editDmAccount(
  config: AdminDmConfig & { accountID: string; value: Partial<AccountResource> },
): Promise<AccountResource> {
  let { env, token, dmID, accountID, value } = config;
  expect({ env, dmID, accountID, value });
  const q = query({ dataManagerID: dmID, accountID });
  const url = apiURL(`account?${q}`, env);
  return fetcher(url, { token }, {
    method: "PUT",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

/** @ignore */
export async function deleteDmAccount(
  config: AdminDmConfig & { accountID: string },
): Promise<Response> {
  let { env, token, dmID, accountID } = config;
  expect({ env, dmID, accountID });
  const q = query({ dataManagerID: dmID, accountID });
  const url = apiURL(`account?${q}`, env);
  return fetcher(url, { token, rawRes: true }, {
    method: "DELETE",
    headers: jsonHeaders,
  });
}

// --- Stats ---

/** @ignore */
export async function getStats(config: AdminListConfig): Promise<any> {
  let { env, token, options = {} } = config;
  expect({ env });
  const q = query(options);
  const url = apiURL(`stats?${q}`, env);
  return fetcher(url, { token });
}

// --- History ---

/** @ignore */
export async function getHistory(config: AdminListConfig): Promise<any> {
  let { env, token, options = {} } = config;
  expect({ env });
  const q = query(options);
  const url = apiURL(`entries?${q}`, env, "dm-history");
  return fetcher(url, { token });
}

// --- Account Client ---

/** @ignore */
export async function createAccountClient(
  config: AdminCreateConfig<Partial<ClientResource>>,
): Promise<ClientResource> {
  let { env, token, value } = config;
  expect({ env, value });
  const url = apiURL("client", env, "accounts");
  return fetcher(url, { token }, {
    method: "POST",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

/** @ignore */
export async function editAccountClient(
  config: AdminConfig & { clientID: string; value: Partial<ClientResource> },
): Promise<ClientResource> {
  let { env, token, clientID, value } = config;
  expect({ env, clientID, value });
  const q = query({ clientID });
  const url = apiURL(`client?${q}`, env, "accounts");
  return fetcher(url, { token }, {
    method: "PUT",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

/** @ignore */
export async function deleteAccountClient(
  config: AdminConfig & { clientID: string },
): Promise<Response> {
  let { env, token, clientID } = config;
  expect({ env, clientID });
  const q = query({ clientID });
  const url = apiURL(`client?${q}`, env, "accounts");
  return fetcher(url, { token, rawRes: true }, {
    method: "DELETE",
    headers: jsonHeaders,
  });
}

// --- Group ---

/** @ignore */
export async function createGroup(
  config: AdminCreateConfig<Partial<GroupResource>>,
): Promise<GroupResource> {
  let { env, token, value } = config;
  expect({ env, value });
  const url = apiURL("group", env, "accounts");
  return fetcher(url, { token }, {
    method: "POST",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

/** @ignore */
export async function editGroup(
  config: AdminConfig & { groupID: string; value: Partial<GroupResource> },
): Promise<GroupResource> {
  let { env, token, groupID, value } = config;
  expect({ env, groupID, value });
  const q = query({ groupID });
  const url = apiURL(`group?${q}`, env, "accounts");
  return fetcher(url, { token }, {
    method: "PUT",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

/** @ignore */
export async function deleteGroup(
  config: AdminConfig & { groupID: string },
): Promise<Response> {
  let { env, token, groupID } = config;
  expect({ env, groupID });
  const q = query({ groupID });
  const url = apiURL(`group?${q}`, env, "accounts");
  return fetcher(url, { token, rawRes: true }, {
    method: "DELETE",
    headers: jsonHeaders,
  });
}

// --- Invite ---

/** @ignore */
export async function createInvite(
  config: AdminCreateConfig<Partial<InviteResource>>,
): Promise<InviteResource> {
  let { env, token, value } = config;
  expect({ env, value });
  const url = apiURL("invite", env, "accounts");
  const res = await fetcher(url, { token }, {
    method: "POST",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
  return res?._embedded?.["ec:invite"] ?? res;
}

/** @ignore */
export async function editInvite(
  config: AdminConfig & { inviteID: string; value: Partial<InviteResource> },
): Promise<InviteResource> {
  let { env, token, inviteID, value } = config;
  expect({ env, inviteID, value });
  const q = query({ invite: inviteID });
  const url = apiURL(`invite?${q}`, env, "accounts");
  return fetcher(url, { token }, {
    method: "PUT",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

/** @ignore */
export async function deleteInvite(
  config: AdminConfig & { inviteID: string },
): Promise<Response> {
  let { env, token, inviteID } = config;
  expect({ env, inviteID });
  const q = query({ invite: inviteID });
  const url = apiURL(`invite?${q}`, env, "accounts");
  return fetcher(url, { token, rawRes: true }, {
    method: "DELETE",
    headers: jsonHeaders,
  });
}

// --- Account ---

/** @ignore */
export async function editAccount(
  config: AdminConfig & { accountID: string; value: Partial<AccountResource> },
): Promise<AccountResource> {
  let { env, token, accountID, value } = config;
  expect({ env, accountID, value });
  const q = query({ accountID });
  const url = apiURL(`account?${q}`, env, "accounts");
  return fetcher(url, { token }, {
    method: "PUT",
    body: JSON.stringify(value),
    headers: jsonHeaders,
  });
}

// --- Tokens ---

/** @ignore */
export async function listTokens(
  config: AdminConfig & { accountID: string },
): Promise<TokenResource[]> {
  let { env, token, accountID } = config;
  expect({ env, accountID });
  const q = query({ accountID });
  const url = apiURL(`account/tokens?${q}`, env, "accounts");
  const res = await fetcher(url, { token });
  let items = res?._embedded?.["ec:account/token"] ?? [];
  return !Array.isArray(items) ? [items] : items;
}

/** @ignore */
export async function createToken(
  config: AdminConfig & { accountID: string },
): Promise<TokenResource> {
  let { env, token, accountID } = config;
  expect({ env, accountID });
  const q = query({ accountID });
  const url = apiURL(`account/tokens?${q}`, env, "accounts");
  return fetcher(url, { token }, {
    method: "POST",
    headers: jsonHeaders,
  });
}

/** @ignore */
export async function deleteToken(
  config: AdminConfig & { accountID: string; accessTokenID: string },
): Promise<Response> {
  let { env, token, accountID, accessTokenID } = config;
  expect({ env, accountID, accessTokenID });
  const q = query({ accessTokenID, accountID });
  const url = apiURL(`account/tokens?${q}`, env, "accounts");
  return fetcher(url, { token, rawRes: true }, {
    method: "DELETE",
    headers: jsonHeaders,
  });
}
