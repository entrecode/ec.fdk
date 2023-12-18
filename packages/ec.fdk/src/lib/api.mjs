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

class Sdk {
  constructor(config) {
    this.config = config;
  }

  set(obj) {
    // "copy on write"
    return new Sdk({ ...this.config, ...obj });
  }

  async handle(handlers) {
    const keys = Object.keys(this.config);
    const token = await this.getBestToken();
    const [_, handle] =
      Object.entries(handlers).find(([k, v]) => keys.includes(k)) || [];
    if (!handle) {
      throw new Error(
        `you need to first set ${Object.keys(handlers).join(" | ")}`
      );
    }
    return handle({ ...this.config, token });
  }

  ///
  async entries(options) {
    const token = await this.getBestToken();
    return entryList({ ...this.config, options, token });
  }
  async entryList(options) {
    return this.entries(options);
  }

  async assets(options) {
    const token = await this.getBestToken();
    return assetList({ ...this.config, options, token });
  }
  async assetList(options) {
    return this.assets(options);
  }

  async createAsset({ file, name } = {}) {
    const token = await this.getBestToken();
    return createAsset({ ...this.config, file, name, token });
  }

  get() {
    return this.handle({
      assetID: getAsset,
      entryID: getEntry,
    });
  }

  del() {
    return this.handle({
      entryID: deleteEntry,
    });
  }

  createEntry(value) {
    return createEntry({ ...this.config, value });
  }
  editEntry(value) {
    return editEntry({ ...this.config, value });
  }

  create(value) {
    return this.set({ value }).handle({
      //assetID: createAsset,
      model: createEntry,
    });
  }

  edit(value) {
    return this.set({ value }).handle({
      //assetID: createAsset,
      entryID: editEntry,
    });
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
   * Sets the id of the entry to use
   * @param {string} entryID
   * @returns Sdk
   */
  entryID(entryID) {
    return this.set({ entryID });
  }
  /**
   * Sets the id of the entry to use. Alias for `entryID`
   * @param {string} entryID
   * @returns Sdk
   */
  entry(entryID) {
    return this.entryID(entryID);
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
   * Sets the id of the asset to use
   * @param {string} assetID
   * @returns Sdk
   */
  assetID(assetID) {
    return this.set({ assetID });
  }
  /**
   * Sets the id of the asset to use. Alias for `assetID`
   * @param {string} assetID
   * @returns Sdk
   */
  asset(assetID) {
    return this.assetID(assetID);
  }
}

export const sdk = (env) => new Sdk({ env });
