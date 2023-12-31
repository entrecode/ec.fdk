import { expect, query, apiURL, fetcher } from "./util.mjs";

export async function entryList(config) {
  let { env, dmShortID, model, options = {} } = config;
  expect({ env, dmShortID, model });
  options = { size: 50, page: 1, _list: true, ...options };
  // name~ = search
  const q = query(options);
  const url = apiURL(`api/${dmShortID}/${model}?${q}`, env);
  const { count, total, _embedded } = await fetcher(url, config);

  const items = _embedded ? _embedded[`${dmShortID}:${model}`] : [];
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
  console.log("create entry", dmShortID, model, value);
  const url = apiURL(`api/${dmShortID}/${model}`, env);
  console.log("url", url);
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
