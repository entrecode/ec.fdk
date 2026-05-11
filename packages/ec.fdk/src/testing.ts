import type { TypedEntry, TypedEntryList, EntrySchema } from "./types";

export interface FdkMockable<M extends string = string> {
  model<N extends string>(name: N): FdkMockable<N>;
  entryList(options?: any): Promise<TypedEntryList<M>>;
  mapEntries<T>(fn: (entry: TypedEntry<M>) => T): Promise<T[]>;
  getEntry(id: string): Promise<TypedEntry<M>>;
  createEntry(value: any): Promise<TypedEntry<M>>;
  editEntry(id: string, value: any): Promise<TypedEntry<M>>;
  deleteEntry(id: string): Promise<void>;
  getSchema(): Promise<EntrySchema>;
  getPermissions(): Promise<string[]>;
  config: { dmShortID: string };
}

type Fixtures = Record<string, any[]>;
type Schemas = Record<string, EntrySchema>;

export interface CreateFdkMockOptions {
  dmShortID?: string;
  schemas?: Schemas;
  /** Permissions returned by getPermissions(). Default: ["*"] (fully permissive). */
  permissions?: string[];
}

/**
 * Creates an in-memory mock implementing FdkMockable, backed by recorded fixture data.
 * Inject at the dm level in tests: `<FdkContext.Provider value={createFdkMock(fixtures) as unknown as Fdk}>`
 * CRUD operations mutate an isolated in-memory copy — safe to call createFdkMock() fresh per test.
 *
 * Accepts a second arg as either a `dmShortID` string (legacy) or an options object with
 * { dmShortID, schemas, permissions } — recorded via `ec.fdk record` alongside fixtures.
 */
export function createFdkMock(
  fixtures: Fixtures,
  optionsOrDmShortID: string | CreateFdkMockOptions = {},
): FdkMockable {
  const options: CreateFdkMockOptions =
    typeof optionsOrDmShortID === "string" ? { dmShortID: optionsOrDmShortID } : optionsOrDmShortID;
  const { dmShortID = "mock", schemas = {}, permissions = ["*"] } = options;
  const store: Fixtures = structuredClone(fixtures);

  function makeModel<M extends string>(name: M): FdkMockable<M> {
    const items = (): any[] => store[name] ?? [];

    return {
      config: { dmShortID },
      model: (n) => makeModel(n) as any,
      entryList: async (_options?) => {
        const all = items();
        return { items: all, total: all.length, count: all.length } as TypedEntryList<M>;
      },
      mapEntries: async (fn) => {
        return items().map(fn);
      },
      getEntry: async (id) => {
        const entry = items().find((e) => e.id === id);
        if (!entry) throw new Error(`[createFdkMock] entry "${id}" not found in model "${name}"`);
        return entry;
      },
      createEntry: async (value) => {
        const entry = { ...value, id: crypto.randomUUID() };
        store[name] = [...items(), entry];
        return entry;
      },
      editEntry: async (id, value) => {
        const idx = items().findIndex((e) => e.id === id);
        if (idx === -1) throw new Error(`[createFdkMock] entry "${id}" not found in model "${name}"`);
        const updated = { ...items()[idx], ...value };
        store[name] = [...items().slice(0, idx), updated, ...items().slice(idx + 1)];
        return updated;
      },
      deleteEntry: async (id) => {
        store[name] = items().filter((e) => e.id !== id);
      },
      getSchema: async () => (schemas[name] ?? {}) as EntrySchema,
      getPermissions: async () => permissions.slice(),
    };
  }

  return {
    config: { dmShortID },
    model: makeModel,
    getPermissions: async () => permissions.slice(),
    // dm-level stubs — call .model() first
    entryList: async () => { throw new Error("[createFdkMock] call .model(name) first"); },
    mapEntries: async () => { throw new Error("[createFdkMock] call .model(name) first"); },
    getEntry: async () => { throw new Error("[createFdkMock] call .model(name) first"); },
    createEntry: async () => { throw new Error("[createFdkMock] call .model(name) first"); },
    editEntry: async () => { throw new Error("[createFdkMock] call .model(name) first"); },
    deleteEntry: async () => { throw new Error("[createFdkMock] call .model(name) first"); },
    getSchema: async () => { throw new Error("[createFdkMock] call .model(name) first"); },
  };
}

export interface CreateMockFetcherOptions {
  schemas?: Schemas;
  /** Permissions returned by /_permissions. Default: ["*"] (fully permissive). */
  permissions?: string[];
}

/**
 * Creates a fetcher function backed by recorded fixture data.
 * Use for SSR apps (e.g. mw): `fdk.set({ fetcher: createMockFetcher(fixtures) })`
 * Handles entryList, getEntry, createEntry, editEntry, deleteEntry, getSchema, getPermissions URL patterns.
 * Assets return a placeholder stub.
 */
export function createMockFetcher(fixtures: Fixtures, options: CreateMockFetcherOptions = {}) {
  const { schemas = {}, permissions = ["*"] } = options;
  const store: Fixtures = structuredClone(fixtures);

  return async function mockFetcher(url: string, _config?: any, _options?: any) {
    const parsed = new URL(url);
    const path = parsed.pathname;

    // Permissions: /api/{shortID}/_permissions
    if (/^\/api\/[^/]+\/_permissions$/.test(path)) {
      return { permissions };
    }

    // Schema: /api/schema/{shortID}/{model}
    const schemaMatch = path.match(/^\/api\/schema\/[^/]+\/([^/]+)$/);
    if (schemaMatch) {
      const [, model] = schemaMatch;
      return schemas[model] ?? {};
    }

    // Asset requests: /a/{shortID}/{assetGroup}
    if (/^\/a\/[^/]+\/[^/]+/.test(path)) {
      const assetID = parsed.searchParams.get("assetID");
      if (assetID) {
        return {
          _embedded: {
            "ec:dm-asset": {
              assetID,
              file: { url: "https://placehold.co/800x600?text=mock" },
              fileVariants: [],
            },
          },
        };
      }
      return { count: 0, total: 0, _embedded: { "ec:dm-asset": [] } };
    }

    // Entry requests: /api/{shortID}/{model}
    const entryMatch = path.match(/^\/api\/([^/]+)\/([^/]+)$/);
    if (entryMatch) {
      const [, shortID, model] = entryMatch;
      const items = (): any[] => store[model] ?? [];
      const method = (_config?.method ?? "GET").toUpperCase();
      const entryID = parsed.searchParams.get("_id");

      if (method === "DELETE" && entryID) {
        store[model] = items().filter((e) => e.id !== entryID);
        return undefined;
      }
      if (method === "PUT" && entryID) {
        const body = _options?.body ? JSON.parse(_options.body) : {};
        const idx = items().findIndex((e) => e.id === entryID);
        const updated = idx !== -1 ? { ...items()[idx], ...body } : { ...body, id: entryID };
        if (idx !== -1) store[model] = [...items().slice(0, idx), updated, ...items().slice(idx + 1)];
        return updated;
      }
      if (method === "POST") {
        const body = _options?.body ? JSON.parse(_options.body) : {};
        const entry = { ...body, id: crypto.randomUUID() };
        store[model] = [...items(), entry];
        return entry;
      }
      if (entryID) {
        return items().find((e) => e.id === entryID) ?? {};
      }
      const all = items();
      return { count: all.length, total: all.length, _embedded: { [`${shortID}:${model}`]: all } };
    }

    // API root: /api/{shortID}
    if (/^\/api\/[^/]+$/.test(path)) return { _links: {} };

    return {};
  };
}
