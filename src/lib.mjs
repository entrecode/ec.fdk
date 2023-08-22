import { withAuthHeader } from "./auth.mjs";
export * from "./actions.mjs";
import * as actions from "./actions.mjs";

export function act(config) {
  const { action } = config;
  expect({ action });
  return actions[action](config);
}

export async function fetcher(url, config = {}, options = {}) {
  options = withAuthHeader(options, config);
  const res = await fetch(url, options);
  console.log("fetch", url, options);
  if (!res.ok) {
    throw new Error(res.statusText);
  }
  if (config.rawRes) {
    return res;
  }
  return await res.json();
}

const apis = {
  production: "https://datamanager.entrecode.de/",
  stage: "https://datamanager.cachena.entrecode.de/",
};

export function apiURL(route, env = "stage") {
  const base = apis[env];
  if (!base) {
    throw new Error(
      `env "${env}" not found. Try one of ${Object.keys(apis).join(", ")}`
    );
  }
  return base + route;
}

export function query(params, sort = true) {
  return Object.entries(params)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

export function expect(obj) {
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined) {
      throw new Error(`expected ${key} to be set!`);
    }
  });
}
