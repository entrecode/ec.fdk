export async function fetcher(url, config = {}, options = {}) {
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
  return await res.json();
}

const apis = {
  live: "https://datamanager.entrecode.de/",
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
