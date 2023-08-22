import {
  entryList,
  getEntry,
  getAsset,
  assetList,
  createEntry,
  editEntry,
  loginPublic,
  loginEc,
  logoutEc,
  hasAnyToken,
  getAuth,
  logoutPublic,
  hasEcToken,
  hasPublicToken,
} from "./lib.mjs";

export * from "./lib.mjs";

class Sdk {
  constructor(config) {
    this.config = config;
  }

  set(obj) {
    // "copy on write"
    return new Sdk({ ...this.config, ...obj });
  }

  handle(handlers) {
    const keys = Object.keys(this.config);
    const [_, handle] =
      Object.entries(handlers).find(([k, v]) => keys.includes(k)) || [];
    if (!handle) {
      throw new Error(
        `you need to first set ${Object.keys(handlers).join(" | ")}`
      );
    }
    return handle(this.config);
  }

  ///

  entries(options) {
    return entryList({ ...this.config, options });
  }

  assets(options) {
    return assetList({ ...this.config, options });
  }

  get() {
    return this.handle({
      assetID: getAsset,
      entryID: getEntry,
    });
  }

  del() {}

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

  //

  loginPublic(config) {
    //
    return loginPublic({ ...this.config, ...config });
  }

  logoutPublic() {
    return logoutPublic(this.config);
  }

  loginEc(config) {
    return loginEc({ ...this.config, ...config });
  }

  logoutEc() {
    return logoutEc(this.config);
  }

  getAuth() {
    return getAuth(this.config);
  }

  hasAnyToken() {
    return hasAnyToken(this.config);
  }
  hasEcToken() {
    return hasEcToken(this.config);
  }
  hasPublicToken() {
    return hasPublicToken(this.config);
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
addSetter("entryID", "entry");
addSetter("assetGroup");
addSetter("assetID", "asset");
addAlias("assetgroup", "assetGroup");
addAlias("entryList", "entries");
addAlias("assetList", "assets");

export const sdk = (env) => new Sdk({ env });
