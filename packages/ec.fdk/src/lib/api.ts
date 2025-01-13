/**
 * @module api
 */
import { AssetCreateOptions, EntrySchema, GenericListOptions } from "src/types";
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
 * Main API to interact with the ec.fdk. You can create an instance with {@link fdk}.
 * @example
 * fdk("stage") // choose stage environment
 * .dm("83cc6374") // select datamanager via short id
 * .model("muffin") // select model muffin
 * .entryList() // load entry list
 * .then((list) => {
 *   console.log(list);
 * });
 */
export class Fdk {
  /** @ignore */
  config: any;
  /** @ignore */
  constructor(config) {
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
   * @example
   * // public model
   * const muffins = await sdk("stage").dm("83cc6374").model("muffin").entryList()
   * @example
   * // non-public model
   * const secrets = await sdk("stage").token(token).dm("83cc6374").model("secret").entryList()
   */
  async entryList(options: GenericListOptions) {
    const token = await this.getBestToken();
    return entryList({ ...this.config, options, token });
  }

  /**
   * Maps over entry list.
   *
   * @param options options for entry list request.
   * @example
   * // public model
   * const muffins = sdk("stage").dm("83cc6374").model("muffin")
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
   *
   * @example
   * const muffin = await sdk("stage").dm("83cc6374").model("muffin").getEntry("1gOtzWvrdq")
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
   * @example
   * const entry = await sdk("stage")
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
   * @example
   * const muffin = await sdk("stage").dm("83cc6374").model("muffin").getSchema()
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
   *
   * @example
   * // public assetGroup
   * const files = await sdk("stage").dm("83cc6374").assetGroup("avatars").assetList()
   * @example
   * // non-public assetGroup
   * const files = await sdk("stage").token(token).dm("83cc6374").assetGroup("avatars").assetList()
   */
  async assetList(options: GenericListOptions) {
    const token = await this.getBestToken();
    return assetList({ ...this.config, options, token });
  }
  /**
   * Uploads an asset. Expects `dmShortID` / `assetGroup` / `file` to be set.
   * If the assetGroup is not public, you also need to provide a `token`.
   *
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
   *
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
   *
   * @example
   * const asset = await sdk("stage").dm("83cc6374").assetgroup("test").getAsset("tP-ZxpZZTGmbPnET-wArAQ")
   */
  async getAsset(assetID: string) {
    const token = await this.getBestToken();
    return getAsset({ ...this.config, assetID, token });
  }

  /**
   * Creates a new entry. Expects `dmShortID` / `model` to be set.
   * If model POST is not public, you also need to provide a `token`.
   *
   * @param value Entry value that satisfies the model's schema.
   * @example
   * const entry = await sdk("stage").dm("83cc6374").model("muffin").createEntry({ name: 'test' })
   */
  async createEntry(value: object) {
    const token = await this.getBestToken();
    return createEntry({ ...this.config, token, value });
  }
  /**
   * Edits an entry. Expects `dmShortID` / `model` to be set.
   * If model PUT is not public, you also need to provide a `token`.
   *
   * @param entryID id of entry to edit
   * @param value values to set. undefined fields are ignored
   * @example
   * const entry = await sdk("stage").dm("83cc6374").model("muffin").editEntry("1gOtzWvrdq", { name: "test" })
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
   * @example
   * await sdk("stage").dm("83cc6374").model("muffin").deleteEntry("1gOtzWvrdq")
   */
  async deleteEntry(entryID: string) {
    const token = await this.getBestToken();
    return deleteEntry({ ...this.config, token, entryID });
  }

  /**
   * Fetches resource list. Expects `resource` to be set. `subdomain` defaults to "datamanager".
   * Fetches `https://<subdomain>.entrecode.de/<resource>?_list=true&size=<options.size ?? 25>`
   *
   * @param options options for list request.
   * @example
   * const res = await sdk("stage").resource("template").resourceList()
   */
  async resourceList(options: GenericListOptions) {
    const token = await this.getBestToken();
    return resourceList({ ...this.config, options, token });
  }

  /**
   * Fetches raw route. Expects `route` to be set. `subdomain` defaults to "datamanager".
   * Fetches `https://<subdomain>.entrecode.de/<route>?<options>`
   * Use this when no other fdk method can give you your request.
   *
   * @param {object=} options options that are converted to query params.
   * @param {object=} fetchOptions (optional) options passed to fetch.
   * @example
   * const res = await sdk("stage").route("stats").raw()
   */
  async raw<T = any>(options: object, fetchOptions?: object) {
    const token = await this.getBestToken();
    return raw<T>({ ...this.config, options, token }, fetchOptions);
  }

  /** @ignore */
  storageAdapter(storageAdapter) {
    // is expected to have get, set and remove
    return this.set({ storageAdapter });
  }
  /** @ignore */
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
  /** @ignore */
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
  /** @ignore */
  getAuth(key) {
    if (!this.config.storageAdapter) {
      throw new Error("cannot getAuth: no storageAdapter defined!");
    }
    const { get } = this.config.storageAdapter;
    return get(key);
  }
  /** @ignore */
  loginEc(config) {
    return loginEc({ ...this.config, ...config }).then(
      this.setAuth(getEcAuthKey(this.config))
    );
  }
  /** @ignore */
  loginPublic(config) {
    //
    return loginPublic({ ...this.config, ...config }).then(
      this.setAuth(getPublicAuthKey(this.config))
    );
  }
  /** @ignore */
  logoutPublic() {
    const token = this.getPublicToken();
    return logoutPublic({ ...this.config, token }).then(
      this.unsetAuth(getPublicAuthKey(this.config))
    );
  }
  /** @ignore */
  logoutEc() {
    const token = this.getEcToken();
    return logoutEc({ ...this.config, token }).then(
      this.unsetAuth(getEcAuthKey(this.config))
    );
  }
  /** @ignore */
  getPublicToken() {
    return this.config.token || this.getAuth(getPublicAuthKey(this.config));
  }
  /** @ignore */
  getEcToken() {
    return this.config.token || this.getAuth(getEcAuthKey(this.config));
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
   * @param model name of the model
   */
  model(model: string) {
    return this.set({ model });
  }
  /**
   * Sets the token to use in requests
   * @param token
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
   */
  dm(dmShortID: string) {
    return this.dmShortID(dmShortID);
  }
  /**
   * Sets the (long) ID of the datamanager to use
   * @param {string} dmID
   */
  dmID(dmID) {
    return this.set({ dmID });
  }
  /**
   * Sets the name of the asset group to use.
   * @param assetGroup name of the asset group
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
   * @param subdomain subdomain
   */
  subdomain(subdomain: string) {
    return this.set({ subdomain });
  }
  /**
   * Sets the name of the resource to use.
   * @param resource name of the resource
   */
  resource(resource: string) {
    return this.set({ resource });
  }
  /**
   * Sets the route to use.
   */
  route(route: string) {
    return this.set({ route });
  }

  /**
   * Returns the public api root endpoint. Expects `dmShortID` to be set.
   */
  publicApi() {
    return publicApi(this.config);
  }

  /**
   * Loads a DatamanagerResource by its long id. Requires token.
   */
  async getDatamanager(dmID: string) {
    const token = await this.getBestToken();
    return getDatamanager({ ...this.config, dmID, token });
  }

  /**
   * Loads datamanager list. Requires auth.
   *
   * @param options options for list request.
   * @example
   * const dms = await sdk("stage").dmList()
   */
  async dmList(options: GenericListOptions = {}) {
    const token = await this.getBestToken();
    return dmList({ ...this.config, options, token });
  }
  /**
   * Loads model list. Expects dmID to be set. Requires auth.
   *
   * @param options options for entry list request.
   * @example
   * const models = await sdk("stage").dmID("254a03f1-cb76-4f1e-a52a-bbd4180ca10c").modelList()
   */
  async modelList(options: GenericListOptions = {}) {
    const token = await this.getBestToken();
    return modelList({ ...this.config, options, token });
  }
}

/**
 * Returns an instance of {@link Fdk}.
 * @example
 * const api = fdk("stage")
 * // do something with api...
 */
export const fdk = (env: "live" | "stage") => new Fdk({ env });
