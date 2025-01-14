import {
  AssetCreateOptions,
  EntrySchema,
  FdkConfig,
  GenericListOptions,
  StorageAdapter,
} from "src/types";
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
  raw,
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
export class Fdk {
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
  set(obj) {
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
  async entryList(options: GenericListOptions) {
    const token = await this.getBestToken();
    return entryList({ ...this.config, options, token });
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
  async getEntry(entryID: string) {
    const token = await this.getBestToken();
    return getEntry({ ...this.config, entryID, token });
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
  async editEntrySafe(entryID: string, value: object) {
    const token = await this.getBestToken();
    return editEntry({ ...this.config, entryID, token, value, safePut: true });
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
  async createEntry(value: object) {
    const token = await this.getBestToken();
    return createEntry({ ...this.config, token, value });
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
  async editEntry(entryID: string, value: object) {
    const token = await this.getBestToken();
    return editEntry({ ...this.config, entryID, token, value });
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
    return this.config.storageAdapter.get(key, token);
  }
  /**
   * Manually set ec user token on the {@link Fdk.authStorage}. In most cases, you'd want to use {@link Fdk.token} instead!
   * @category Auth
   * @ignore
   */
  setEcToken(token: string) {
    this.setToken(getEcAuthKey(this.config), token);
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
   * Sets the given model to use
   * @category Entries
   * @param model name of the model
   */
  model(model: string) {
    return this.set({ model });
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
