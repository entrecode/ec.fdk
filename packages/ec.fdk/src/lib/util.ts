/** @ignore */
export async function fetcher(
  url,
  config: { token?: string; rawRes?: boolean } = {},
  options: RequestInit = {}
) {
  const { token, rawRes } = config;
  if (token) {
    options.headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }
  const res = await fetch(url, options);
  //console.log("fetch", url, options);
  if (!res.ok) {
    if (res.headers.get("content-type")?.includes("application/json")) {
      const error = await res.json();
      const message = `${error.title}\n${error.detail}\n${error.verbose}`;
      throw new Error(message);
    }
    throw new Error(`unexpected fetch error: ${res.statusText}`);
  }
  if (rawRes) {
    return res;
  }
  if (res.status === 204) {
    return undefined;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}

/**
 * @ignore
 * The different ec API urls for live and stage environments, used by {@link apiURL}
 */
export const apis = {
  datamanager: {
    live: "https://datamanager.entrecode.de/",
    stage: "https://datamanager.cachena.entrecode.de/",
  },
  accounts: {
    live: "https://accounts.entrecode.de/",
    stage: "https://accounts.cachena.entrecode.de/",
  },
  appserver: {
    live: "https://appserver.entrecode.de/",
    stage: "https://appserver.cachena.entrecode.de/",
  },
  "dm-history": {
    live: "https://dm-history.entrecode.de/",
    stage: "https://dm-history.cachena.entrecode.de/",
  },
};

/**
 * Resolves the url of a ec API endpoint.
 * @ignore
 */
export function apiURL(route, env = "stage", subdomain = "datamanager") {
  const api = apis[subdomain];
  if (!api) {
    throw new Error(
      `subdomain "${subdomain}" not found. Try one of ${Object.keys(apis).join(
        ", "
      )}`
    );
  }
  const base = api[env];
  if (!base) {
    throw new Error(
      `env "${env}" not found. Try one of ${Object.keys(api[env]).join(", ")}`
    );
  }
  return base + route;
}

/** @ignore */
export function query(params, sort = true) {
  return Object.entries(params)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

/** @ignore */
export function expect(obj) {
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined) {
      throw new Error(`expected ${key} to be set!`);
    }
  });
}
