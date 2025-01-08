/**
 * @module api
 */
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

export function act(config) {
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
 * SDK
 */
export class Sdk {
  config: any;
  constructor(config) {
    this.config = config;
  }

  set(obj) {
    // "copy on write"
    return new Sdk({ ...this.config, ...obj });
  }

  /**
   * Loads entry list. Expects `dmShortID` / `model` to be set.
   * If the model is not public, you also need to provide a `token`.
   *
   * @param {object=} options options for entry list request.
   * @returns {Promise<EntryList>}
   * @example
   * // public model
   * const muffins = await sdk("stage").dm("83cc6374").model("muffin").entries()
   * @example
   * // non-public model
   * const secrets = await sdk("stage").token(token).dm("83cc6374").model("secret").entries()
   */
  async entries(options = {}) {
    const token = await this.getBestToken();
    return entryList({ ...this.config, options, token });
  }
  async entryList(options) {
    return this.entries(options);
  }

  /**
   * Maps over entry list.
   *
   * @param {object=} options options for entry list request.
   * @returns {Promise<EntryList>}
   * @example
   * // public model
   * const muffins = sdk("stage").dm("83cc6374").model("muffin")
   * const res = await muffin.mapEntries((entry) => muffin.editEntry(entry.id, { name: entry.name + "!" }));
   * console.log("res", res);
   */
  async mapEntries(fn, options = {}) {
    const token = await this.getBestToken();
    return mapEntries({ ...this.config, options, token }, fn);
  }
  /**
   * Loads a single entry. Expects `dmShortID` / `model` to be set.
   * If the model is not public, you also need to provide a `token`.
   *
   * @param {string} entryID
   * @returns {Promise<EntryResource>}
   * @example
   * const muffin = await sdk("stage").dm("83cc6374").model("muffin").getEntry("1gOtzWvrdq")
   */
  async getEntry(entryID) {
    const token = await this.getBestToken();
    return getEntry({ ...this.config, entryID, token });
  }
  /**
   * Edits an entry with safe put. Expects `dmShortID` / `model` to be set.
   * Expects a `_modified` field in the value. Will only update if the entry has not been changed since.
   * If model PUT is not public, you also need to provide a `token`.
   *
   * @param {string} entryID id of entry to edit
   * @param {object} value values to set. undefined fields are ignored
   * @returns {Promise<EntryResource>}
   * @example
   * const entry = await sdk("stage")
   *  .dm("83cc6374")
   *  .model("muffin")
   *  .editEntrySafe("1gOtzWvrdq", { name: "test", _modified: "2020-01-01T00:00:00.000Z"})
   */
  async editEntrySafe(entryID, value) {
    const token = await this.getBestToken();
    return editEntry({ ...this.config, entryID, token, value, safePut: true });
  }
  /**
   * Loads the schema of a model. Expects `dmShortID` / `model` to be set.
   *
   * @param {string} entryID
   * @returns {Promise<EntrySchema>}
   * @example
   * const muffin = await sdk("stage").dm("83cc6374").model("muffin").getSchema()
   */
  async getSchema() {
    return getSchema(this.config);
  }
  /**
   * Loads asset list. Expects `dmShortID` / `assetGroup` to be set.
   * If the assetGroup is not public, you also need to provide a `token`.
   *
   * @param {object=} options options for entry list request.
   * @returns {Promise<AssetList>}
   * @example
   * // public assetGroup
   * const files = await sdk("stage").dm("83cc6374").assetGroup("avatars").assets()
   * @example
   * // non-public assetGroup
   * const files = await sdk("stage").token(token).dm("83cc6374").assetGroup("avatars").assets()
   */
  async assets(options) {
    const token = await this.getBestToken();
    return assetList({ ...this.config, options, token });
  }
  async assetList(options) {
    return this.assets(options);
  }
  /**
   * Uploads an asset. Expects `dmShortID` / `assetGroup` / `file` to be set.
   * If the assetGroup is not public, you also need to provide a `token`.
   *
   * @param {{ file: File | Blob, name: string, options: object }} options options for entry list request.
   * @returns {Promise<AssetResource>}
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
   * const upload = await sdk("stage")
   * .dm("83cc6374")
   * .assetgroup("test")
   * .createAsset({ file, name: "venndiagram.png" });
   */
  async createAsset({ file, name, options }: any = {}) {
    const token = await this.getBestToken();
    return createAsset({ ...this.config, file, name, options, token });
  }
  /**
   * Deletes an asset. Expects `dmShortID` / `assetGroup` / `assetID` to be set.
   * You probably also need to provide a `token`.
   *
   * @param {string} assetID
   * @returns {Promise<void>}
   * @example
   * await ecadmin.assetgroup("test").deleteAsset('xxxx');
   */
  async deleteAsset(assetID) {
    const token = await this.getBestToken();
    return deleteAsset({ ...this.config, token, assetID });
  }
  /**
   * Loads a single asset. Expects `dmShortID` / `assetGroup` to be set.
   * If the asset group is not public, you also need to provide a `token`.
   *
   * @param {string} assetID
   * @returns {Promise<AssetResource>}
   * @example
   * const asset = await sdk("stage").dm("83cc6374").assetgroup("test").getAsset("tP-ZxpZZTGmbPnET-wArAQ")
   */
  async getAsset(assetID) {
    const token = await this.getBestToken();
    return getAsset({ ...this.config, assetID, token });
  }

  /**
   * Creates a new entry. Expects `dmShortID` / `model` to be set.
   * If model POST is not public, you also need to provide a `token`.
   *
   * @param {object} value values to set.
   * @returns {Promise<EntryResource>}
   * @example
   * const entry = await sdk("stage").dm("83cc6374").model("muffin").createEntry({ name: 'test' })
   */
  async createEntry(value) {
    const token = await this.getBestToken();
    return createEntry({ ...this.config, token, value });
  }
  /**
   * Edits an entry. Expects `dmShortID` / `model` to be set.
   * If model PUT is not public, you also need to provide a `token`.
   *
   * @param {string} entryID id of entry to edit
   * @param {object} value values to set. undefined fields are ignored
   * @returns {Promise<EntryResource>}
   * @example
   * const entry = await sdk("stage").dm("83cc6374").model("muffin").editEntry("1gOtzWvrdq", { name: "test" })
   */
  async editEntry(entryID, value) {
    const token = await this.getBestToken();
    return editEntry({ ...this.config, entryID, token, value });
  }
  /**
   * Deletes an entry. Expects `dmShortID` / `model` to be set.
   * If model DELETE is not public, you also need to provide a `token`.
   *
   * @param {string} entryID id of entry to delete
   * @returns {Promise<void>}
   * @example
   * await sdk("stage").dm("83cc6374").model("muffin").deleteEntry("1gOtzWvrdq")
   */
  async deleteEntry(entryID) {
    const token = await this.getBestToken();
    return deleteEntry({ ...this.config, token, entryID });
  }

  /**
   * Fetches resource list. Expects `resource` to be set. `subdomain` defaults to "datamanager".
   * Fetches `https://<subdomain>.entrecode.de/<resource>?_list=true&size=<options.size ?? 25>`
   *
   * @param {object=} options options for list request.
   * @returns {Promise<ResourceList>}
   * @example
   * const res = await sdk("stage").resource("template").resourceList()
   */
  async resourceList(options) {
    const token = await this.getBestToken();
    return resourceList({ ...this.config, options, token });
  }

  /**
   * Fetches raw route. Expects `route` to be set. `subdomain` defaults to "datamanager".
   * Fetches `https://<subdomain>.entrecode.de/<route>?<options>`
   * Use this when no other fdk method can give you your request.
   *
   * @param {object=} options options for list request.
   * @param {object=} fetchOptions (optional) options passed to fetch.
   * @returns {Promise<any>}
   * @example
   * const res = await sdk("stage").route("stats").raw()
   */
  async raw(options, fetchOptions) {
    const token = await this.getBestToken();
    return raw({ ...this.config, options, token }, fetchOptions);
  }

  storageAdapter(storageAdapter) {
    // is expected to have get, set and remove
    return this.set({ storageAdapter });
  }

  setAuth(key) {
    return (auth) => {
      if (!this.config.storageAdapter) {
        throw new Error("cannot setAuth: no storageAdapter defined!");
      }
      const { set } = this.config.storageAdapter;
      set(key, auth.token);
      return auth;
    };
  }
  unsetAuth(key) {
    return (auth) => {
      if (!this.config.storageAdapter) {
        throw new Error("cannot unsetAuth: no storageAdapter defined!");
      }
      const { remove } = this.config.storageAdapter;
      remove(key);
      return auth;
    };
  }
  getAuth(key) {
    if (!this.config.storageAdapter) {
      throw new Error("cannot getAuth: no storageAdapter defined!");
    }
    const { get } = this.config.storageAdapter;
    return get(key);
  }

  loginEc(config) {
    return loginEc({ ...this.config, ...config }).then(
      this.setAuth(getEcAuthKey(this.config))
    );
  }
  loginPublic(config) {
    //
    return loginPublic({ ...this.config, ...config }).then(
      this.setAuth(getPublicAuthKey(this.config))
    );
  }

  logoutPublic() {
    const token = this.getPublicToken();
    return logoutPublic({ ...this.config, token }).then(
      this.unsetAuth(getPublicAuthKey(this.config))
    );
  }

  logoutEc() {
    const token = this.getEcToken();
    return logoutEc({ ...this.config, token }).then(
      this.unsetAuth(getEcAuthKey(this.config))
    );
  }

  getPublicToken() {
    return this.config.token || this.getAuth(getPublicAuthKey(this.config));
  }
  getEcToken() {
    return this.config.token || this.getAuth(getEcAuthKey(this.config));
  }
  hasPublicToken() {
    return !!this.getPublicToken();
  }
  hasEcToken() {
    return !!this.getEcToken();
  }
  hasAnyToken() {
    return !!this.getEcToken() || !!this.getPublicToken();
  }
  getBestToken() {
    try {
      return this.getEcToken() || this.getPublicToken();
    } catch (err) {
      return undefined;
    }
  }
  /**
   * Sets the given model to use
   * @param {string} model name of the model
   * @returns Sdk
   */
  model(model) {
    return this.set({ model });
  }
  /**
   * Sets the token to use in requests
   * @param {string} token
   * @returns Sdk
   */
  token(token) {
    return this.set({ token });
  }
  /**
   * Sets the short ID of the datamanager to use
   * @param {string} dmShortID
   * @returns Sdk
   */
  dmShortID(dmShortID) {
    return this.set({ dmShortID });
  }
  /**
   * Sets the (long) ID of the datamanager to use
   * @param {string} dmID
   * @returns Sdk
   */
  dmID(dmID) {
    return this.set({ dmID });
  }
  /**
   * Sets the short ID of the datamanager to use. Alias for `dmShortID`
   * @param {string} dmShortID
   * @returns Sdk
   */
  dm(dmShortID) {
    return this.dmShortID(dmShortID);
  }
  /**
   * Sets the name of the asset group to use.
   * @param {string} assetGroup name of the asset group
   * @returns Sdk
   */
  assetGroup(assetGroup) {
    return this.set({ assetGroup });
  }
  /**
   * Sets the name of the asset group to use. Alias for `assetGroup`
   * @param {string} assetGroup name of the asset group
   * @returns Sdk
   */
  assetgroup(assetGroup) {
    return this.assetGroup(assetGroup);
  }
  /**
   * Sets the subdomain to use.
   * @param {string} subdomain subdomain
   * @returns Sdk
   */
  subdomain(subdomain) {
    return this.set({ subdomain });
  }
  /**
   * Sets the name of the resource to use.
   * @param {string} resource name of the resource
   * @returns Sdk
   */
  resource(resource) {
    return this.set({ resource });
  }
  /**
   * Sets the route to use.
   * @param {string} route route
   * @returns Sdk
   */
  route(route) {
    return this.set({ route });
  }

  /**
   * Returns the public api root endpoint. Expects dmShortID to be set.
   * @returns any
   */
  publicApi() {
    return publicApi(this.config);
  }

  /**
   * Loads a DatamanagerResource by its long id. Requires token.
   * @returns any
   */
  async getDatamanager(dmID) {
    const token = await this.getBestToken();
    return getDatamanager({ ...this.config, dmID, token });
  }

  /**
   * Loads datamanager list. Make sure to provide an ec.admin `token` intercept one.
   *
   * @param {object=} options options for entry list request.
   * @returns {Promise<DatamanagerList>}
   * @example
   * const dms = await sdk("stage").dmList()
   */
  async dmList(options = {}) {
    const token = await this.getBestToken();
    return dmList({ ...this.config, options, token });
  }
  /**
   * Loads model list. Expects dmID to be set. Make sure to provide an ec.admin `token` intercept one.
   *
   * @param {object=} options options for entry list request.
   * @returns {Promise<ModelList>}
   * @example
   * const models = await sdk("stage").dmID("254a03f1-cb76-4f1e-a52a-bbd4180ca10c").modelList()
   */
  async modelList(options = {}) {
    const token = await this.getBestToken();
    return modelList({ ...this.config, options, token });
  }
}

export const sdk = (env) => new Sdk({ env });
export const fdk = sdk;
