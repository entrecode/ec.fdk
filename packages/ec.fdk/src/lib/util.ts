export type { Fetcher } from "../types";

/**
 * Thrown for every non-2xx API response. `message` is unchanged (`title\ndetail\nverbose` of the
 * ec error body), on top it carries the HTTP `status`, the ec error `code` (e.g. 2112) and the
 * parsed error body as `info`.
 *
 * @example
 * try {
 *   await fdk("stage").dm("83cc6374").model("muffin").editEntrySafe(id, { name: "x", _modified });
 * } catch (err) {
 *   if (isStaleWriteError(err)) { ... } // someone else saved in between
 * }
 */
export class FdkError extends Error {
  status: number;
  code?: number;
  info?: any;
  constructor(message: string, status: number, info?: any) {
    super(message);
    this.name = "FdkError";
    this.status = status;
    this.code = info?.code;
    this.info = info;
  }
}

/**
 * True if a safe put (`editEntrySafe`) was rejected because the entry changed after `_modified`
 * (HTTP 412, ec code 2112 "Somebody else changed the resource"). Checks the fields, not
 * `instanceof`, so it also works when two copies of ec.fdk are bundled.
 */
export function isStaleWriteError(error: unknown): boolean {
  return (error as FdkError)?.status === 412;
}

/** @ignore */
export async function fetcher(
  url,
  config: { token?: string; rawRes?: boolean } = {},
  options: RequestInit = {}
) {
  const { token, rawRes } = config;
  // Headers normalizes plain objects, Headers instances and [key, value] arrays
  const headers = new Headers(options.headers);
  // always ask for JSON: some APIs (e.g. appserver) content-negotiate and return HTML for */*
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  options.headers = headers;
  const res = await fetch(url, options);
  //console.log("fetch", url, options);
  if (!res.ok) {
    if (res.headers.get("content-type")?.includes("application/json")) {
      const error = await res.json();
      const message = `${error.title}\n${error.detail}\n${error.verbose}`;
      throw new FdkError(message, res.status, error);
    }
    throw new FdkError(`unexpected fetch error: ${res.statusText}`, res.status);
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

/**
 * Builds a query string from a params object. Keys and values are URL-encoded with
 * `encodeURIComponent` (ec.sdk did the same in its `optionsToQuery`). Without encoding,
 * a value containing `&`, `+`, `#` or `%` corrupts the query: `{ tag: "Fitness & Gesundheit" }`
 * became `tag=Fitness & Gesundheit`, which the DM reads as `tag=Fitness ` plus a bogus
 * param — the exact-match lookup silently returned 0 results (DAILY-3038).
 * Filter modifier suffixes on keys (`name~`, `state!`) are untouched by `encodeURIComponent`.
 * @ignore
 */
export function query(params, sort = true) {
  return Object.entries(params)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
}

/**
 * Removes `undefined`-valued keys from a list-options object. `undefined` is the
 * idiomatic "no filter for this key" sentinel (`{ type: cond ? 'article' : undefined }`);
 * without this, `query()` template-stringifies it into the literal `type=undefined`,
 * which the DM rejects with a 400 "Invalid format for property". ec.sdk's
 * `optionsToQuery` skipped undefined values the same way.
 *
 * Deliberately NOT applied to get/edit/delete-by-id query building — there a missing
 * id must keep failing loudly instead of silently widening the match.
 * @ignore
 */
export function dropUndefined(params: Record<string, any>): Record<string, any> {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
}

/** @ignore */
export function expect(obj) {
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined) {
      throw new Error(`expected ${key} to be set!`);
    }
  });
}
