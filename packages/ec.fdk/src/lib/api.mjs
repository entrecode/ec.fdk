import * as actions from "./actions.mjs";
import { expect } from "./util.mjs";
export * from "./util.mjs";

const {
  entryList,
  getEntry,
  getAsset,
  assetList,
  createEntry,
  editEntry,
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

  async assets(options) {
    const token = await this.getBestToken();
    return assetList({ ...this.config, options, token });
  }

  get() {
    return this.handle({
      assetID: getAsset,
      entryID: getEntry,
    });
  }

  del() {}

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
}

const addSetter = (...args) => {
  const [main] = args;

  args.forEach((alias) => {
    Sdk.prototype[alias] = function (value) {
      return this.set({ [main]: value });
    };
  });
};

const addAlias = (a, b) => {
  Sdk.prototype[a] = Sdk.prototype[b];
};
// define setters with aliases
addSetter("dmShortID", "dm", "dmshortid");
addSetter("model");
addSetter("token");
addSetter("entryID", "entry");
addSetter("assetGroup");
addSetter("assetID", "asset");
addAlias("assetgroup", "assetGroup");
addAlias("entryList", "entries");
addAlias("assetList", "assets");

export const sdk = (env) => new Sdk({ env });
