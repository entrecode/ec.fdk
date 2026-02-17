import {
  AssetCreateOptions,
  EntryInput,
  EntrySchema,
  FdkConfig,
  GenericListOptions,
  StorageAdapter,
  TypedEntry,
  TypedEntryList,
} from "../types";
import * as actions from "./actions";
import { expect } from "./util";
export * from "./util";

const {
  entryList,
  mapEntries,
  getEntry,
  getAsset,
  assetList,
  createAsset,
  createAssets,
  deleteAsset,
  createEntry,
  editEntry,
  deleteEntry,
  getSchema,
  loginPublic,
  loginEc,
  logoutEc,
  logoutPublic,
  getEcAuthKey,
  getPublicAuthKey,
  dmList,
  modelList,
  publicApi,
  getDatamanager,
  resourceList,
  resourceGet,
  resourceEdit,
  resourceDelete,
  raw,
  // admin CRUD
  createDatamanager,
  editDatamanager,
  deleteDatamanager,
  createModel,
  editModel,
  deleteModel,
  createTemplate,
  createAssetGroup,
  editAssetGroup,
  editAsset,
  editDmClient,
  createRole,
  editRole,
  deleteRole,
  editDmAccount,
  deleteDmAccount,
  getStats,
  getHistory,
  createAccountClient,
  editAccountClient,
  deleteAccountClient,
  createGroup,
  editGroup,
  deleteGroup,
  createInvite,
  editInvite,
  deleteInvite,
  editAccount,
  listTokens,
  createToken,
  deleteToken,
} = actions;

/** The act function converts a single `config` object param into a fetch request:
 * ```js
 * const muffins = await act({
 *   action: "entryList",
 *   env: "stage",
 *   dmShortID: "83cc6374",
 *   model: "muffin",
 * });
 * ```
 *
 * The `config` object passed to `act` expects an `action` ([available actions](https://github.com/entrecode/ec.fdk/blob/main/packages/ec.fdk/src/lib/api.ts))
 * and additional keys that are required to perform the action.
 * If you don't know the required keys for an action, either call `act` without additional keys or look it up in the source.
 * For example, this is how the `entryList` function looks:
 * ```js
 * export async function entryList(config) {
 *   let { env, dmShortID, model, options = {} } = config;
 *   expect({ env, dmShortID, model });
 *   // more stuff
 * }
 * ```
 * The call to `expect` shows which keys are expected to be set.
 *
 */
export function act(config: Record<string, any>): Promise<any> {
  const { action } = config;
  expect({ action });
  if (!actions[action]) {
    throw new Error(
      `"${action}" does not exist! try one of ${Object.keys(actions).join(
        ", "
      )}`
    );
  }
  return actions[action](config);
}

/**
 * Main API to interact with the ec.fdk. You can create an instance with {@link fdk}.
 * 
 * Checkout all available methods in the sidebar on the right.
 * @example
 * fdk("stage") // choose stage environment
 * .dm("83cc6374") // select datamanager via short id
 * .model("muffin") // select model muffin
 * .entryList() // load entry list
 * .then((list) => {
 *   console.log(list);
 * });
 * 
 * @example You can also reuse parts of the chain with variables:
 * ```js
 * // we want to do stuff with model muffin here
 * const muffin = fdk("stage").dm("83cc6374").model("muffin");
 * // load entry list
 * const { items } = await muffin.entryList();
 * // edit first entry
 * await muffin.editEntry(items[0].id, { name: "edit!" });
 * // delete second entry
 * await muffin.deleteEntry(items[1].id);
 * // create a new muffin
 * await muffin.createEntry({ name: "new muffin" });
 * // edit third entry with safePut
 * await muffin.editEntrySafe(items[2].id, {
 *   _modified: items[2]._modified,
 *   name: "safePut!",
 * });
```
 */
/** @ignore */
function cleanEntry(entry: any) {
  if (!entry || typeof entry !== "object") return entry;
  const { _links, _embedded, ...rest } = entry;
  return rest;
}

/** @ignore */
function cleanResult(result: any) {
  if (!result || typeof result !== "object") return result;
  if (Array.isArray(result.items)) {
    return { ...result, items: result.items.map(cleanEntry) };
  }
  return cleanEntry(result);
}

export class Fdk<TModel extends string = string> {
  /** @ignore */
  config: any;
  /** @ignore */
  constructor(config: FdkConfig = {}) {
    if (!config.storageAdapter) {
      let authStorage = new Map();
      config.storageAdapter = {
        get: (key) => authStorage.get(key),
        set: (key, token) => authStorage.set(key, token),
        remove: (key) => authStorage.delete(key),
      };
    }
    this.config = config;
  }
  /** @ignore */
  set(obj): Fdk<TModel> {
    // "copy on write"
    return new Fdk({ ...this.config, ...obj });
  }

  /** @ignore */
  async entries(options = {}) {
    const token = await this.getBestToken();
    return entryList({ ...this.config, options, token });
  }
  /**
   * Loads entry list. Expects `dmShortID` / `model` to be set.
   * If the model is not public, you also need to provide a `token`.
   *
   * @param options options for list request.
   * @category Entries
   * @example
   * // public model
   * const muffins = await fdk("stage").dm("83cc6374").model("muffin").entryList()
   * @example
   * // non-public model
   * const secrets = await fdk("stage").token(token).dm("83cc6374").model("secret").entryList()
   */
  async entryList(options: GenericListOptions = {}): Promise<TypedEntryList<TModel>> {
    const token = await this.getBestToken();
    return entryList({ ...this.config, options, token }).then((r) => this.maybeClean(r));
  }

  /**
   * Maps over entry list.
   *
   * @param options options for entry list request.
   * @category Entries
   * @example
   * // public model
   * const muffins = fdk("stage").dm("83cc6374").model("muffin")
   * const res = await muffin.mapEntries((entry) => muffin.editEntry(entry.id, { name: entry.name + "!" }));
   * console.log("res", res);
   */
  async mapEntries(fn, options: GenericListOptions = {}) {
    const token = await this.getBestToken();
    return mapEntries({ ...this.config, options, token }, fn);
  }
  /**
   * Loads a single entry. Expects `dmShortID` / `model` to be set.
   * If the model is not public, you also need to provide a `token`.
   * @category Entries
   * @example
   * const muffin = await fdk("stage").dm("83cc6374").model("muffin").getEntry("1gOtzWvrdq")
   */
  async getEntry(entryID: string): Promise<TypedEntry<TModel>> {
    const token = await this.getBestToken();
    return getEntry({ ...this.config, entryID, token }).then((r) => this.maybeClean(r));
  }
  /**
   * Edits an entry with safe put. Expects `dmShortID` / `model` to be set.
   * Expects a `_modified` field in the value. Will only update if the entry has not been changed since.
   * If model PUT is not public, you also need to provide a `token`.
   *
   * @param entryID id of entry to edit
   * @param value values to set. undefined fields are ignored
   * @category Entries
   * @example
   * const entry = await fdk("stage")
   *  .dm("83cc6374")
   *  .model("muffin")
   *  .editEntrySafe("1gOtzWvrdq", { name: "test", _modified: "2020-01-01T00:00:00.000Z"})
   */
  async editEntrySafe(entryID: string, value: Partial<EntryInput<TModel>> & { _modified: Date | string }): Promise<TypedEntry<TModel>> {
    const token = await this.getBestToken();
    return editEntry({ ...this.config, entryID, token, value, safePut: true }).then((r) => this.maybeClean(r));
  }
  /**
   * Loads the schema of a model. Expects `dmShortID` / `model` to be set.
   *
   * @category Entries
   * @example
   * const muffin = await fdk("stage").dm("83cc6374").model("muffin").getSchema()
   */
  async getSchema(): Promise<EntrySchema> {
    return getSchema(this.config);
  }
  /** @ignore */
  async assets(options) {
    const token = await this.getBestToken();
    return assetList({ ...this.config, options, token });
  }
  /**
   * Loads asset list. Expects `dmShortID` / `assetGroup` to be set.
   * If the assetGroup is not public, you also need to provide a `token`.
   * @category Assets
   * @example
   * // public assetGroup
   * const files = await fdk("stage").dm("83cc6374").assetGroup("avatars").assetList()
   * @example
   * // non-public assetGroup
   * const files = await fdk("stage").token(token).dm("83cc6374").assetGroup("avatars").assetList()
   */
  async assetList(options: GenericListOptions) {
    const token = await this.getBestToken();
    return assetList({ ...this.config, options, token });
  }
  /**
   * Uploads an asset. Expects `dmShortID` / `assetGroup` / `file` to be set.
   * If the assetGroup is not public, you also need to provide a `token`.
   * @category Assets
   * @example
   * // browser example
   * document.getElementById("file").addEventListener("input", async (e) => {
   *   const [file] = e.target.files;
   *   const asset = await ecadmin.assetgroup("test").createAsset({ file })
   * });
   * @example
   * // node example
   * const buf = fs.readFileSync("venndiagram.png");
   * const file = new Blob([buf]);
   * const upload = await fdk("stage")
   * .dm("83cc6374")
   * .assetgroup("test")
   * .createAsset({ file, name: "venndiagram.png" });
   */
  async createAsset(config: {
    file: Blob;
    name: string;
    options: AssetCreateOptions;
  }) {
    const { file, name, options } = config;
    const token = await this.getBestToken();
    return createAsset({ ...this.config, file, name, options, token });
  }
  /**
   * Uploads multiple assets. Expects `dmShortID` / `assetGroup` / `files` to be set.
   * If the assetGroup is not public, you also need to provide a `token`.
   * @category Assets
   * @example
   * // browser example
   * document.getElementById("file").addEventListener("input", async (e) => {
   *   const files = e.target.files;
   *   const asset = await ecadmin.assetgroup("test").createAssets({ files })
   * });
   * @example
   * // node example
   * const buf = fs.readFileSync("venndiagram.png");
   * const files = [new Blob([buf])];
   * const upload = await fdk("stage")
   * .dm("83cc6374")
   * .assetgroup("test")
   * .createAsset({ files });
   */
  async createAssets(config: { files: Blob[]; options: AssetCreateOptions }) {
    const { files, options } = config;
    const token = await this.getBestToken();
    return createAssets({ ...this.config, files, options, token });
  }
  /**
   * Deletes an asset. Expects `dmShortID` / `assetGroup` / `assetID` to be set.
   * You probably also need to provide a `token`.
   * @category Assets
   * @param assetID
   * @example
   * await ecadmin.assetgroup("test").deleteAsset('xxxx');
   */
  async deleteAsset(assetID: string) {
    const token = await this.getBestToken();
    return deleteAsset({ ...this.config, token, assetID });
  }
  /**
   * Loads a single asset. Expects `dmShortID` / `assetGroup` to be set.
   * If the asset group is not public, you also need to provide a `token`.
   * @category Assets
   * @example
   * const asset = await fdk("stage").dm("83cc6374").assetgroup("test").getAsset("tP-ZxpZZTGmbPnET-wArAQ")
   */
  async getAsset(assetID: string) {
    const token = await this.getBestToken();
    return getAsset({ ...this.config, assetID, token });
  }

  /**
   * Creates a new entry. Expects `dmShortID` / `model` to be set.
   * If model POST is not public, you also need to provide a `token`.
   * @category Entries
   * @param value Entry value that satisfies the model's schema.
   * @example
   * const entry = await fdk("stage").dm("83cc6374").model("muffin").createEntry({ name: 'test' })
   */
  async createEntry(value: EntryInput<TModel>): Promise<TypedEntry<TModel>> {
    const token = await this.getBestToken();
    return createEntry({ ...this.config, token, value }).then((r) => this.maybeClean(r));
  }
  /**
   * Edits an entry. Expects `dmShortID` / `model` to be set.
   * If model PUT is not public, you also need to provide a `token`.
   * @category Entries
   * @param entryID id of entry to edit
   * @param value values to set. undefined fields are ignored
   * @example
   * const entry = await fdk("stage").dm("83cc6374").model("muffin").editEntry("1gOtzWvrdq", { name: "test" })
   */
  async editEntry(entryID: string, value: Partial<EntryInput<TModel>>): Promise<TypedEntry<TModel>> {
    const token = await this.getBestToken();
    return editEntry({ ...this.config, entryID, token, value }).then((r) => this.maybeClean(r));
  }
  /**
   * Deletes an entry. Expects `dmShortID` / `model` to be set.
   * If model DELETE is not public, you also need to provide a `token`.
   *
   * @param entryID id of entry to delete
   * @category Entries
   * @example
   * await fdk("stage").dm("83cc6374").model("muffin").deleteEntry("1gOtzWvrdq")
   */
  async deleteEntry(entryID: string) {
    const token = await this.getBestToken();
    return deleteEntry({ ...this.config, token, entryID });
  }

  /**
   * Fetches resource list. Expects `resource` to be set. `subdomain` defaults to "datamanager".
   * Fetches `https://<subdomain>.entrecode.de/<resource>?_list=true&size=<options.size ?? 25>`
   * @param options options for list request.
   * @category Admin
   * @example
   * const res = await fdk("stage").resource("template").resourceList()
   */
  async resourceList(options: GenericListOptions) {
    const token = await this.getBestToken();
    return resourceList({ ...this.config, options, token });
  }

  /**
   * Fetches a single resource. Expects `resource` to be set. `subdomain` defaults to "datamanager".
   * Pass identifying query params as `options`.
   * @param options query params to identify the resource.
   * @category Admin
   * @example
   * const model = await fdk("stage").resource("model").resourceGet({ dataManagerID: 'x', modelID: 'y' })
   */
  async resourceGet(options: Record<string, any>) {
    const token = await this.getBestToken();
    return resourceGet({ ...this.config, options, token });
  }

  /**
   * Edits a single resource via PUT. Expects `resource` to be set. `subdomain` defaults to "datamanager".
   * Pass identifying query params as `options`.
   * @param options query params to identify the resource.
   * @param value the resource body to PUT.
   * @category Admin
   * @example
   * const model = await fdk("stage").resource("model").resourceEdit({ dataManagerID: 'x', modelID: 'y' }, { title: 'new' })
   */
  async resourceEdit(options: Record<string, any>, value: object) {
    const token = await this.getBestToken();
    return resourceEdit({ ...this.config, options, token, value });
  }

  /**
   * Deletes a single resource. Expects `resource` to be set. `subdomain` defaults to "datamanager".
   * Pass identifying query params as `options`.
   * @param options query params to identify the resource.
   * @category Admin
   * @example
   * await fdk("stage").resource("model").resourceDelete({ dataManagerID: 'x', modelID: 'y' })
   */
  async resourceDelete(options: Record<string, any>) {
    const token = await this.getBestToken();
    return resourceDelete({ ...this.config, options, token });
  }

  /**
   * Fetches raw route. Expects `route` to be set. `subdomain` defaults to "datamanager".
   * Fetches `https://<subdomain>.entrecode.de/<route>?<options>`
   * Use this when no other fdk method can give you your request.
   * @param {object=} options options that are converted to query params.
   * @param {object=} fetchOptions (optional) options passed to fetch.
   * @category Admin
   * @example
   * const res = await fdk("stage").route("stats").raw()
   */
  async raw<T = any>(options: object, fetchOptions?: object) {
    const token = await this.getBestToken();
    return raw<T>({ ...this.config, options, token }, fetchOptions);
  }

  // --- Datamanager CRUD ---

  /**
   * Creates a new datamanager.
   * @category Admin
   */
  async createDatamanager(value: object) {
    const token = await this.getBestToken();
    return createDatamanager({ ...this.config, token, value });
  }

  /**
   * Edits a datamanager. Expects `dmID` to be set.
   * @category Admin
   */
  async editDatamanager(dmID: string, value: object) {
    const token = await this.getBestToken();
    return editDatamanager({ ...this.config, token, dmID, value });
  }

  /**
   * Deletes a datamanager. Expects `dmID` to be set.
   * @category Admin
   */
  async deleteDatamanager(dmID: string) {
    const token = await this.getBestToken();
    return deleteDatamanager({ ...this.config, token, dmID });
  }

  // --- Model CRUD ---

  /**
   * Creates a new model. Expects `dmID` to be set.
   * @category Admin
   */
  async createModel(value: object) {
    const token = await this.getBestToken();
    return createModel({ ...this.config, token, value });
  }

  /**
   * Edits a model. Expects `dmID` to be set.
   * @category Admin
   */
  async editModel(modelID: string, value: object) {
    const token = await this.getBestToken();
    return editModel({ ...this.config, token, modelID, value });
  }

  /**
   * Deletes a model. Expects `dmID` to be set.
   * @category Admin
   */
  async deleteModel(modelID: string) {
    const token = await this.getBestToken();
    return deleteModel({ ...this.config, token, modelID });
  }

  // --- Template CRUD ---

  /**
   * Creates a new template.
   * @category Admin
   */
  async createTemplate(value: object) {
    const token = await this.getBestToken();
    return createTemplate({ ...this.config, token, value });
  }

  // --- Asset Group ---

  /**
   * Creates a new asset group. Expects `dmID` to be set.
   * @category Admin
   */
  async createAssetGroup(value: object) {
    const token = await this.getBestToken();
    return createAssetGroup({ ...this.config, token, value });
  }

  /**
   * Edits an asset group. Expects `dmID` to be set.
   * @category Admin
   */
  async editAssetGroup(assetGroupID: string, value: object) {
    const token = await this.getBestToken();
    return editAssetGroup({ ...this.config, token, assetGroupID, value });
  }

  // --- Asset metadata ---

  /**
   * Edits asset metadata. Expects `dmShortID` and `assetGroup` to be set.
   * @category Assets
   */
  async editAsset(assetID: string, value: object) {
    const token = await this.getBestToken();
    return editAsset({ ...this.config, token, assetID, value });
  }

  // --- DM Client ---

  /**
   * Edits a DM client. Expects `dmID` to be set.
   * @category Admin
   */
  async editDmClient(clientID: string, value: object) {
    const token = await this.getBestToken();
    return editDmClient({ ...this.config, token, clientID, value });
  }

  // --- Role CRUD ---

  /**
   * Creates a new role. Expects `dmID` to be set.
   * @category Admin
   */
  async createRole(value: object) {
    const token = await this.getBestToken();
    return createRole({ ...this.config, token, value });
  }

  /**
   * Edits a role. Expects `dmID` to be set.
   * @category Admin
   */
  async editRole(roleID: string, value: object) {
    const token = await this.getBestToken();
    return editRole({ ...this.config, token, roleID, value });
  }

  /**
   * Deletes a role. Expects `dmID` to be set.
   * @category Admin
   */
  async deleteRole(roleID: string) {
    const token = await this.getBestToken();
    return deleteRole({ ...this.config, token, roleID });
  }

  // --- DM Account ---

  /**
   * Edits a DM account. Expects `dmID` to be set.
   * @category Admin
   */
  async editDmAccount(accountID: string, value: object) {
    const token = await this.getBestToken();
    return editDmAccount({ ...this.config, token, accountID, value });
  }

  /**
   * Deletes a DM account. Expects `dmID` to be set.
   * @category Admin
   */
  async deleteDmAccount(accountID: string) {
    const token = await this.getBestToken();
    return deleteDmAccount({ ...this.config, token, accountID });
  }

  // --- Stats ---

  /**
   * Loads datamanager stats.
   * @category Admin
   */
  async getStats(options: object = {}) {
    const token = await this.getBestToken();
    return getStats({ ...this.config, token, options });
  }

  // --- History ---

  /**
   * Loads dm-history entries.
   * @category Admin
   */
  async getHistory(options: object = {}) {
    const token = await this.getBestToken();
    return getHistory({ ...this.config, token, options });
  }

  // --- Account Client ---

  /**
   * Creates an account client.
   * @category Admin
   */
  async createAccountClient(value: object) {
    const token = await this.getBestToken();
    return createAccountClient({ ...this.config, token, value });
  }

  /**
   * Edits an account client.
   * @category Admin
   */
  async editAccountClient(clientID: string, value: object) {
    const token = await this.getBestToken();
    return editAccountClient({ ...this.config, token, clientID, value });
  }

  /**
   * Deletes an account client.
   * @category Admin
   */
  async deleteAccountClient(clientID: string) {
    const token = await this.getBestToken();
    return deleteAccountClient({ ...this.config, token, clientID });
  }

  // --- Group ---

  /**
   * Creates a group.
   * @category Admin
   */
  async createGroup(value: object) {
    const token = await this.getBestToken();
    return createGroup({ ...this.config, token, value });
  }

  /**
   * Edits a group.
   * @category Admin
   */
  async editGroup(groupID: string, value: object) {
    const token = await this.getBestToken();
    return editGroup({ ...this.config, token, groupID, value });
  }

  /**
   * Deletes a group.
   * @category Admin
   */
  async deleteGroup(groupID: string) {
    const token = await this.getBestToken();
    return deleteGroup({ ...this.config, token, groupID });
  }

  // --- Invite ---

  /**
   * Creates an invite.
   * @category Admin
   */
  async createInvite(value: object) {
    const token = await this.getBestToken();
    return createInvite({ ...this.config, token, value });
  }

  /**
   * Edits an invite.
   * @category Admin
   */
  async editInvite(inviteID: string, value: object) {
    const token = await this.getBestToken();
    return editInvite({ ...this.config, token, inviteID, value });
  }

  /**
   * Deletes an invite.
   * @category Admin
   */
  async deleteInvite(inviteID: string) {
    const token = await this.getBestToken();
    return deleteInvite({ ...this.config, token, inviteID });
  }

  // --- Account ---

  /**
   * Edits an account.
   * @category Admin
   */
  async editAccount(accountID: string, value: object) {
    const token = await this.getBestToken();
    return editAccount({ ...this.config, token, accountID, value });
  }

  // --- Tokens ---

  /**
   * Lists tokens for an account.
   * @category Admin
   */
  async listTokens(accountID: string) {
    const token = await this.getBestToken();
    return listTokens({ ...this.config, token, accountID });
  }

  /**
   * Creates a token for an account.
   * @category Admin
   */
  async createToken(accountID: string) {
    const token = await this.getBestToken();
    return createToken({ ...this.config, token, accountID });
  }

  /**
   * Deletes a token for an account.
   * @category Admin
   */
  async deleteToken(accountID: string, accessTokenID: string) {
    const token = await this.getBestToken();
    return deleteToken({ ...this.config, token, accountID, accessTokenID });
  }

  /**
   * Defines a custom storage to use for auth data. In most cases, this should not be needed. By default, auth will be stored in-memory, using a JS Map. This should be fine for NodeJS.
   * In the Browser, it's better to use [oidc-client](https://github.com/AxaFrance/oidc-client) and ignore all Auth methods here.
   *
   * @category Auth
   * @example
   * // using Cookies
   * import Cookies from "js-cookie";
   * let fdk = fdk("stage").storageAdapter(Cookies);
   * await fdk.dm("83cc6374").model("my-protected-model").entryList();
   *
   */
  storageAdapter(storageAdapter: StorageAdapter) {
    // is expected to have get, set and remove
    return this.set({ storageAdapter });
  }
  /** @ignore */
  removeToken(key) {
    if (!this.config.storageAdapter) {
      throw new Error("cannot removeToken: no storageAdapter defined!");
    }
    const { remove } = this.config.storageAdapter;
    remove(key);
  }
  /** @ignore */
  getToken(key) {
    if (!this.config.storageAdapter) {
      throw new Error("cannot getAuth: no storageAdapter defined!");
    }
    const { get } = this.config.storageAdapter;
    return get(key);
  }
  /** @ignore */
  getPublicToken() {
    return this.config.token || this.getToken(getPublicAuthKey(this.config));
  }
  /** @ignore */
  getEcToken() {
    return this.config.token || this.getToken(getEcAuthKey(this.config));
  }
  /** @ignore */
  setToken(key, token) {
    if (!this.config.storageAdapter) {
      throw new Error("cannot setEcToken: no storageAdapter defined!");
    }
    return this.config.storageAdapter.set(key, token);
  }
  /**
   * Manually set ec user token on the {@link Fdk.authStorage}. In most cases, you'd want to use {@link Fdk.token} instead!
   * @category Auth
   * @ignore
   */
  setEcToken(token: string) {
    this.setToken(getEcAuthKey(this.config), token);
  }
  /** @ignore */
  removeEcToken() {
    this.removeToken(getEcAuthKey(this.config));
  }
  /**
   * Manually set public user token on the {@link Fdk.authStorage}. In most cases, you'd want to use {@link Fdk.token} instead!
   * @category Auth
   * @ignore
   */
  setPublicToken(token: string) {
    this.setToken(getPublicAuthKey(this.config), token);
  }
  /**
   * Login with the given ec user. Only needed when using manual auth.
   * @category Auth
   */
  loginEc(config: { email: string; password: string }) {
    return loginEc({ ...this.config, ...config }).then((auth) =>
      this.setToken(getEcAuthKey(this.config), auth.token)
    );
  }
  /**
   * Login with the given public user. Only needed when using manual auth.
   * @category Auth
   */
  loginPublic(config) {
    //
    return loginPublic({ ...this.config, ...config }).then((auth) =>
      this.setToken(getPublicAuthKey(this.config), auth.token)
    );
  }
  /**
   * Logs out the current public user. Only needed when using manual auth.
   * @category Auth
   */
  logoutPublic() {
    const token = this.getPublicToken();
    return logoutPublic({ ...this.config, token }).then(() =>
      this.removeToken(getPublicAuthKey(this.config))
    );
  }
  /**
   * Logs out the current ec user. Only needed when using manual auth.
   * @category Auth
   */
  logoutEc() {
    const token = this.getEcToken();
    return logoutEc({ ...this.config, token }).then(() =>
      this.removeToken(getEcAuthKey(this.config))
    );
  }
  /** @ignore */
  hasPublicToken() {
    return !!this.getPublicToken();
  }
  /** @ignore */
  hasEcToken() {
    return !!this.getEcToken();
  }
  /** @ignore */
  hasAnyToken() {
    return !!this.getEcToken() || !!this.getPublicToken();
  }
  /** @ignore */
  getBestToken() {
    try {
      return this.getEcToken() || this.getPublicToken();
    } catch (err) {
      return undefined;
    }
  }
  /**
   * If true, removes `_links` and `_embedded` from returned entries. Default: false.
   * @category Entries
   * @param shouldClean whether to clean entries (default: true)
   * @example
   * const { items } = await fdk("stage").dm("83cc6374").model("muffin").clean().entryList()
   * // items won't have _links or _embedded
   */
  clean(shouldClean = true) {
    return this.set({ _clean: shouldClean });
  }
  /** @ignore */
  maybeClean(result: any) {
    return this.config._clean ? cleanResult(result) : result;
  }
  /**
   * Sets the given model to use
   * @category Entries
   * @param model name of the model
   */
  model<M extends string>(model: M): Fdk<M> {
    return this.set({ model }) as unknown as Fdk<M>;
  }
  /**
   * Sets the token to use in requests. Intended for usage with a fixed token in NodeJS.
   * @param token
   * @category Auth
   */
  token(token: string) {
    return this.set({ token });
  }
  /** @ignore */
  dmShortID(dmShortID) {
    return this.set({ dmShortID });
  }
  /**
   * Sets the short ID of the datamanager to use.
   * @category Entries
   * @category Assets
   */
  dm(dmShortID: string) {
    return this.dmShortID(dmShortID);
  }
  /**
   * Sets the (long) ID of the datamanager to use
   * @param {string} dmID
   * @category Admin
   */
  dmID(dmID) {
    return this.set({ dmID });
  }
  /**
   * Sets the name of the asset group to use.
   * @param assetGroup name of the asset group
   * @category Assets
   */
  assetGroup(assetGroup: string) {
    return this.set({ assetGroup });
  }
  /** @ignore */
  assetgroup(assetGroup: string) {
    return this.assetGroup(assetGroup);
  }
  /**
   * Sets the subdomain to use.
   * @category Admin
   * @param subdomain subdomain
   */
  subdomain(subdomain: string) {
    return this.set({ subdomain });
  }
  /**
   * Sets the name of the resource to use.
   * @param resource name of the resource
   * @category Admin
   */
  resource(resource: string) {
    return this.set({ resource });
  }
  /**
   * Sets the route to use.
   * @category Admin
   */
  route(route: string) {
    return this.set({ route });
  }

  /**
   * Returns the public api root endpoint. Expects `dmShortID` to be set.
   * @category Entries
   */
  publicApi() {
    return publicApi(this.config);
  }

  /**
   * Loads a DatamanagerResource by its long id. Requires token.
   * @category Admin
   */
  async getDatamanager(dmID: string) {
    const token = await this.getBestToken();
    return getDatamanager({ ...this.config, dmID, token });
  }

  /**
   * Loads datamanager list. Requires auth.
   *
   * @param options options for list request.
   * @category Admin
   * @example
   * const dms = await fdk("stage").dmList()
   */
  async dmList(options: GenericListOptions = {}) {
    const token = await this.getBestToken();
    return dmList({ ...this.config, options, token });
  }
  /**
   * Loads model list. Expects dmID to be set. Requires auth.
   *
   * @param options options for entry list request.
   * @category Admin
   * @example
   * const models = await fdk("stage").dmID("254a03f1-cb76-4f1e-a52a-bbd4180ca10c").modelList()
   */
  async modelList(options: GenericListOptions = {}) {
    const token = await this.getBestToken();
    return modelList({ ...this.config, options, token });
  }
}

/**
 * Returns an instance of {@link Fdk}. This is the entry point for the method chaining API.
 * @example
 * const api = fdk("stage")
 * // do something with api...
 */
export const fdk = (env: "live" | "stage") => new Fdk({ env });
/** @ignore */
export const sdk = (env: "live" | "stage") => new Fdk({ env }); // legacy
