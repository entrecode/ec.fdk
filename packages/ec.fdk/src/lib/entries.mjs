import { apiURL, expect, fetcher, query } from "./util.mjs";

let systemFields = [
  "created",
  "creator",
  "id",
  "modified",
  "private",
  "_created",
  "_creator",
  "_embedded",
  "_entryTitle",
  "_id",
  "_links",
  "_modelTitle",
  "_modelTitleField",
  "_modified",
];

function withoutSystemFields(entryLike) {
  let clean = {};
  for (let prop in entryLike) {
    if (!systemFields.includes(prop)) {
      clean[prop] = entryLike[prop];
    }
  }
  return clean;
}

function withoutUndefinedValues(entryLike) {
  return JSON.parse(JSON.stringify(entryLike));
}

export async function publicApi(config) {
  let { env, dmShortID } = config;
  expect({ env, dmShortID });
  // name~ = search
  const url = apiURL(`api/${dmShortID}`, env);
  return fetcher(url, config);
}

export async function entryList(config) {
  let { env, dmShortID, model, options = {} } = config;
  expect({ env, dmShortID, model });
  options = { size: 50, page: 1, _list: true, ...options };
  // name~ = search
  const q = query(options);
  const url = apiURL(`api/${dmShortID}/${model}?${q}`, env);
  const { count, total, _embedded } = await fetcher(url, config);

  let items = _embedded ? _embedded[`${dmShortID}:${model}`] : [];
  items = !Array.isArray(items) ? [items] : items;
  return { count, total, items };
}

export function getEntry({ env, dmShortID, model, entryID, token }) {
  expect({ env, dmShortID, model, entryID });
  const q = query({ _id: entryID });
  const url = apiURL(`api/${dmShortID}/${model}?${q}`, env);
  return fetcher(url, { dmShortID, token });
}

export async function createEntry({ env, dmShortID, model, value, token }) {
  expect({ env, dmShortID, model, value });
  const url = apiURL(`api/${dmShortID}/${model}`, env);
  const res = await fetcher(
    url,
    { env, dmShortID, token },
    {
      method: "POST",
      body: JSON.stringify(value),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res;
}

export async function editEntry({
  env,
  dmShortID,
  model,
  entryID,
  value,
  token,
  safePut = false,
}) {
  expect({ env, dmShortID, model, entryID, value });
  const headers = {
    "Content-Type": "application/json",
  };
  if (safePut) {
    if (!("_modified" in value)) {
      throw new Error("expected _modified to be set!");
    }
    headers["If-Unmodified-Since"] = new Date(value._modified).toUTCString();
  }
  // console.log("edit entry", dmShortID, model, entryID, value);
  const url = apiURL(`api/${dmShortID}/${model}?_id=${entryID}`, env);
  value = withoutUndefinedValues(value);
  value = withoutSystemFields(value);

  const res = await fetcher(
    url,
    { token },
    {
      method: "PUT",
      headers,
      body: JSON.stringify(value),
    }
  );
  return res;
}

export function deleteEntry({ env, dmShortID, model, entryID, token }) {
  expect({ env, dmShortID, model, entryID });
  // console.log("edit entry", dmShortID, model, entryID, value);
  const url = apiURL(`api/${dmShortID}/${model}?_id=${entryID}`, env);
  return fetcher(
    url,
    { token, rawRes: true },
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

export async function getSchema({ env, dmShortID, model, withMetadata }) {
  // https://datamanager.cachena.entrecode.de/api/schema/fb5dbaab/addon_config
  expect({ env, dmShortID, model });
  const url = apiURL(`api/schema/${dmShortID}/${model}`, env);
  const res = await fetcher(url);
  const schema = res?.allOf?.[1];
  if (typeof schema.properties !== "object") {
    throw new Error(
      `getSchema: ${url} returned unexpected format: ${JSON.stringify(res)}`
    );
  }
  const { properties } = schema;
  const props = withoutSystemFields(properties);
  for (let prop in props) {
    let p = props[prop];
    p.required = schema.required.includes(prop);
    if (props[prop]?.oneOf) {
      delete props[prop]?.oneOf;
    }
    if (p.title?.includes("<") && p.title?.includes(">")) {
      const resource = p.title.split("<")[1].slice(0, -1);
      const type = p.title.split("<")[0];
      p.type = type;
      if (resource.includes(":")) {
        p.resource = resource.split(":")[1];
      } else {
        p.resource = resource;
      }
    } else if (["asset", "entry", "assets", "entries"].includes(p.title)) {
      // resource is not specified!
      p.type = p.title;
      p.resource = null;
    } else {
      p.type = p.title;
    }
    delete props[prop].title;
  }
  if (withMetadata) {
    const modelTitle = properties._modelTitle.title;
    const modelTitleField = properties._modelTitleField.title;
    // feature flag for testing
    return { properties: props, meta: { modelTitleField, modelTitle } };
  }
  return props;
}

/**
 * @typedef {Object} SdkFilter
 * @property {string | string[]} sort
 * @property {string} search
 * @property {boolean} notNull
 * @property {boolean} null
 * @property {Array[]} any
 * @property {string} from
 * @property {string} to
 *
 */
/**
 * @typedef {Object} SdkFilterOptions
 * @property {SdkFilter} sort
 * @property {number} _count
 * @property {number} page
 * @property {Record<string, SdkFilter> | string | boolean} [key]
 *
 */

/**
 * Takes [ec.sdk filterOptions](https://entrecode.github.io/ec.sdk/#filteroptions), outputs an [entrecode filter](https://doc.entrecode.de/api-basics/#filtering)
 *
 * @param {SdkFilterOptions} options sdk filterOptions
 * @returns {Record<string, string>}
 *
 */
export function sdkOptions(options) {
  return Object.entries(options)
    .map(([key, o]) => {
      if (typeof o !== "object") {
        return { [key]: String(o) };
      }
      return {
        ...(o.sort && { sort: Array.isArray(o) ? o.join(",") : o }),
        ...(o.search && { [key + "~"]: o.search }),
        ...(o.notNull && { [key + "!"]: "" }),
        ...(o.null && { [key]: "" }),
        ...(o.any && { [key]: o.any.join(",") }),
        ...(o.from && { [key + "From"]: o.from }),
        ...(o.to && { [key + "To"]: o.to }),
      };
    })
    .reduce((acc, o) => ({ ...acc, ...o }), {});
}
/**
 * Returns the shortID of the given EntryResource
 *
 * @param {EntryResource} entry EntryResource
 * @returns {string}
 *
 */
export function getEntryShortID(entry) {
  return entry._links.collection.href.split("/").slice(-2)[0];
}

/**
 * Returns the embedded asset from the given field name and EntryResource
 *
 * @param {EntryResource} entry EntryResource
 * @returns {string}
 *
 */
export function getEntryAsset(field, entry) {
  const shortID = getEntryShortID(entry);
  return entry._embedded[`${shortID}:${entry._modelTitle}/${field}/asset`];
}
