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
}) {
  expect({ env, dmShortID, model, entryID, value });
  // console.log("edit entry", dmShortID, model, entryID, value);
  const url = apiURL(`api/${dmShortID}/${model}?_id=${entryID}`, env);
  value = withoutUndefinedValues(value);
  value = withoutSystemFields(value);

  const res = await fetcher(
    url,
    { token },
    {
      method: "PUT",
      body: JSON.stringify(value),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res;
}

export async function deleteEntry({ env, dmShortID, model, entryID, token }) {
  expect({ env, dmShortID, model, entryID });
  // console.log("edit entry", dmShortID, model, entryID, value);
  const url = apiURL(`api/${dmShortID}/${model}?_id=${entryID}`, env);
  await fetcher(
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

export async function getSchema({ env, dmShortID, model }) {
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
  return props;
}
