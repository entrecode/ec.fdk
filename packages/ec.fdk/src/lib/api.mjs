/**
 * @module api
 */
import * as actions from "./actions.mjs";
import { expect } from "./util.mjs";
export * from "./util.mjs";

const {
  entryList,
  getEntry,
  getAsset,
  assetList,
  createAsset,
  createEntry,
  editEntry,
  deleteEntry,
  loginPublic,
  loginEc,
  logoutEc,
  logoutPublic,
  getEcAuthKey,
  getPublicAuthKey,
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
   * @param {{ file: File, name: string }} options options for entry list request.
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
  async createAsset({ file, name } = {}) {
    const token = await this.getBestToken();
    return createAsset({ ...this.config, file, name, token });
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
   * @returns {void}
   * @example
   * await sdk("stage").dm("83cc6374").model("muffin").deleteEntry("1gOtzWvrdq")
   */
  async deleteEntry(entryID) {
    const token = await this.getBestToken();
    return deleteEntry({ ...this.config, token, entryID });
  }

  // TODO: rename authAdapter -> storageAdapter

  authAdapter(authAdapter) {
    // is expected to have get, set and remove
    return this.set({ authAdapter });
  }

  setAuth(key) {
    return (auth) => {
      if (!this.config.authAdapter) {
        throw new Error("cannot setAuth: no authAdapter defined!");
      }
      const { set } = this.config.authAdapter;
      set(key, auth.token);
      return auth;
    };
  }
  unsetAuth(key) {
    return (auth) => {
      console.log("unset auth", auth);
      if (!this.config.authAdapter) {
        throw new Error("cannot unsetAuth: no authAdapter defined!");
      }
      const { remove } = this.config.authAdapter;
      remove(key);
      return auth;
    };
  }
  getAuth(key) {
    if (!this.config.authAdapter) {
      throw new Error("cannot getAuth: no authAdapter defined!");
    }
    const { get } = this.config.authAdapter;
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
    console.log("token", token);
    return logoutPublic({ ...this.config, token }).then(
      this.unsetAuth(getPublicAuthKey(this.config))
    );
  }

  logoutEc() {
    const token = this.getEcToken();
    console.log("token", token);
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
}

export const sdk = (env) => new Sdk({ env });

/**
 * @typedef {Object} AssetFile
 * @property {string} url
 * @property {number} size
 * @property {Object} resolution
 */

/**
 * @typedef {Object} AssetResource
 * @property {string} assetID
 * @property {Date} created
 * @property {Array<any>} files
 * @property {Array<string | any>} tags
 * @property {string} title
 * @property {string} type
 * @property {AssetFile} file
 */

/**
 * @typedef {Object} EntryResource
 * @property {Date} _created - The creation date.
 * @property {string} _creator - The creator's string representation.
 * @property {any} _embedded - Any embedded resource.
 * @property {any} _links - Any associated links.
 * @property {string} _modelTitle - The title of the model.
 * @property {string} _modelTitleField - The field representing the model title.
 * @property {Date} _modified - The last modification date.
 * @property {Date} created - The creation date.
 * @property {Date} modified - The last modification date.
 * @property {any} [key] - Any additional properties can be added dynamically.
 */

/**
 * @typedef {Object} EntryList
 * @property {number} count
 * @property {number} total
 * @property {EntryResource[]} items
 */

/**
 * @typedef {Object} AssetList
 * @property {number} count
 * @property {number} total
 * @property {AssetResource[]} items
 */
