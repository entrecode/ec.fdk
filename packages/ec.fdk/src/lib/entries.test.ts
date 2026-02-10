import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./util", async (importOriginal) => {
  const original = await importOriginal<typeof import("./util")>();
  return {
    ...original,
    fetcher: vi.fn().mockResolvedValue({ count: 0, total: 0, _embedded: {} }),
  };
});

import { fetcher } from "./util";
import * as entries from "./entries";

const mockFetcher = vi.mocked(fetcher);

const DM = "https://datamanager.cachena.entrecode.de/";
const jsonHeaders = { "Content-Type": "application/json" };

beforeEach(() => {
  mockFetcher.mockClear();
  mockFetcher.mockResolvedValue({ count: 0, total: 0, _embedded: {} });
});

// --- publicApi ---

describe("publicApi", () => {
  it("fetches public API root", async () => {
    await entries.publicApi({ env: "stage", dmShortID: "abc123" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}api/abc123`,
      { env: "stage", dmShortID: "abc123" },
    );
  });
});

// --- entryList ---

describe("entryList", () => {
  it("fetches with default list options", async () => {
    await entries.entryList({ env: "stage", dmShortID: "abc123", model: "muffin" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}api/abc123/muffin?_list=true&page=1&size=50`,
      expect.objectContaining({ env: "stage", dmShortID: "abc123", model: "muffin" }),
    );
  });

  it("merges custom options", async () => {
    await entries.entryList({
      env: "stage", dmShortID: "abc123", model: "muffin",
      options: { size: 10, page: 2 },
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}api/abc123/muffin?_list=true&page=2&size=10`,
      expect.objectContaining({ dmShortID: "abc123", model: "muffin" }),
    );
  });

  it("returns items from _embedded", async () => {
    mockFetcher.mockResolvedValue({
      count: 2, total: 2,
      _embedded: { "abc123:muffin": [{ id: "1" }, { id: "2" }] },
    });
    const result = await entries.entryList({ env: "stage", dmShortID: "abc123", model: "muffin" });
    expect(result.items).toEqual([{ id: "1" }, { id: "2" }]);
    expect(result.count).toBe(2);
    expect(result.total).toBe(2);
  });

  it("wraps single embedded item in array", async () => {
    mockFetcher.mockResolvedValue({
      count: 1, total: 1,
      _embedded: { "abc123:muffin": { id: "1" } },
    });
    const result = await entries.entryList({ env: "stage", dmShortID: "abc123", model: "muffin" });
    expect(result.items).toEqual([{ id: "1" }]);
  });

  it("returns empty items when no _embedded", async () => {
    mockFetcher.mockResolvedValue({ count: 0, total: 0 });
    const result = await entries.entryList({ env: "stage", dmShortID: "abc123", model: "muffin" });
    expect(result.items).toEqual([]);
  });
});

// --- getEntry ---

describe("getEntry", () => {
  it("fetches entry by _id query", async () => {
    await entries.getEntry({
      env: "stage", dmShortID: "abc123", model: "muffin", entryID: "e-1", token: "tok",
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}api/abc123/muffin?_id=e-1`,
      { token: "tok" },
    );
  });
});

// --- createEntry ---

describe("createEntry", () => {
  it("POSTs entry with JSON body", async () => {
    const value = { name: "new muffin" };
    await entries.createEntry({
      env: "stage", dmShortID: "abc123", model: "muffin", value, token: "tok",
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}api/abc123/muffin`,
      { token: "tok" },
      { method: "POST", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });
});

// --- editEntry ---

describe("editEntry", () => {
  it("PUTs entry with JSON body", async () => {
    const value = { name: "edited" };
    await entries.editEntry({
      env: "stage", dmShortID: "abc123", model: "muffin", entryID: "e-1", value, token: "tok",
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}api/abc123/muffin?_id=e-1`,
      { token: "tok" },
      { method: "PUT", headers: jsonHeaders, body: JSON.stringify(value) },
    );
  });

  it("strips system fields from value", async () => {
    const value = { name: "edited", _created: "2024-01-01", _links: {}, id: "e-1" };
    await entries.editEntry({
      env: "stage", dmShortID: "abc123", model: "muffin", entryID: "e-1", value, token: "tok",
    });
    const call = mockFetcher.mock.calls[0];
    const body = JSON.parse(call[2].body as string);
    expect(body).toEqual({ name: "edited" });
    expect(body).not.toHaveProperty("_created");
    expect(body).not.toHaveProperty("_links");
    expect(body).not.toHaveProperty("id");
  });

  it("strips undefined values", async () => {
    const value = { name: "edited", description: undefined };
    await entries.editEntry({
      env: "stage", dmShortID: "abc123", model: "muffin", entryID: "e-1", value, token: "tok",
    });
    const call = mockFetcher.mock.calls[0];
    const body = JSON.parse(call[2].body as string);
    expect(body).toEqual({ name: "edited" });
    expect(body).not.toHaveProperty("description");
  });

  it("safePut adds If-Unmodified-Since header", async () => {
    const modified = "2024-06-15T10:00:00.000Z";
    const value = { name: "safe", _modified: modified };
    await entries.editEntry({
      env: "stage", dmShortID: "abc123", model: "muffin", entryID: "e-1",
      value, token: "tok", safePut: true,
    });
    const call = mockFetcher.mock.calls[0];
    expect(call[2].headers).toHaveProperty("If-Unmodified-Since", new Date(modified).toUTCString());
  });

  it("safePut throws if _modified is missing", async () => {
    await expect(
      entries.editEntry({
        env: "stage", dmShortID: "abc123", model: "muffin", entryID: "e-1",
        value: { name: "bad" }, token: "tok", safePut: true,
      })
    ).rejects.toThrow("expected _modified to be set!");
  });
});

// --- deleteEntry ---

describe("deleteEntry", () => {
  it("DELETEs entry with rawRes", async () => {
    await entries.deleteEntry({
      env: "stage", dmShortID: "abc123", model: "muffin", entryID: "e-1", token: "tok",
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}api/abc123/muffin?_id=e-1`,
      { token: "tok", rawRes: true },
      { method: "DELETE", headers: jsonHeaders },
    );
  });
});

// --- mapEntries ---

describe("mapEntries", () => {
  it("iterates through all pages", async () => {
    mockFetcher
      .mockResolvedValueOnce({
        count: 2, total: 3,
        _embedded: { "abc123:muffin": [{ id: "1" }, { id: "2" }] },
      })
      .mockResolvedValueOnce({
        count: 1, total: 3,
        _embedded: { "abc123:muffin": [{ id: "3" }] },
      });

    const fn = vi.fn((entry) => entry.id);
    const result = await entries.mapEntries(
      { env: "stage", dmShortID: "abc123", model: "muffin" },
      fn,
    );
    expect(fn).toHaveBeenCalledTimes(3);
    expect(result).toEqual(["1", "2", "3"]);
  });
});

// --- getSchema ---

describe("getSchema", () => {
  it("fetches and parses schema", async () => {
    mockFetcher.mockResolvedValue({
      allOf: [
        {},
        {
          required: ["name"],
          properties: {
            name: { title: "text" },
            _created: { title: "_created" },
            _modified: { title: "_modified" },
            _creator: { title: "_creator" },
            _modelTitle: { title: "muffin" },
            _modelTitleField: { title: "name" },
          },
        },
      ],
    });
    const result: any = await entries.getSchema({ env: "stage", dmShortID: "abc123", model: "muffin", withMetadata: false });
    expect(result).toHaveProperty("name");
    expect(result.name.type).toBe("text");
    expect(result.name.required).toBe(true);
    expect(result).not.toHaveProperty("_created");
  });

  it("parses typed resource fields like entry<shortID:model>", async () => {
    mockFetcher.mockResolvedValue({
      allOf: [
        {},
        {
          required: [],
          properties: {
            related: { title: "entry<abc123:article>" },
            _modelTitle: { title: "x" },
            _modelTitleField: { title: "y" },
          },
        },
      ],
    });
    const result: any = await entries.getSchema({ env: "stage", dmShortID: "abc123", model: "test", withMetadata: false });
    expect(result.related.type).toBe("entry");
    expect(result.related.resource).toBe("article");
  });

  it("parses asset fields without resource", async () => {
    mockFetcher.mockResolvedValue({
      allOf: [
        {},
        {
          required: [],
          properties: {
            photo: { title: "asset" },
            _modelTitle: { title: "x" },
            _modelTitleField: { title: "y" },
          },
        },
      ],
    });
    const result: any = await entries.getSchema({ env: "stage", dmShortID: "abc123", model: "test", withMetadata: false });
    expect(result.photo.type).toBe("asset");
    expect(result.photo.resource).toBeNull();
  });

  it("withMetadata returns meta object", async () => {
    mockFetcher.mockResolvedValue({
      allOf: [
        {},
        {
          required: ["name"],
          properties: {
            name: { title: "text" },
            _modelTitle: { title: "muffin" },
            _modelTitleField: { title: "name" },
          },
        },
      ],
    });
    const result: any = await entries.getSchema({
      env: "stage", dmShortID: "abc123", model: "muffin", withMetadata: true,
    });
    expect(result.meta).toEqual({ modelTitle: "muffin", modelTitleField: "name" });
    expect(result.properties).toHaveProperty("name");
  });
});

// --- sdkOptions / filterOptions ---

describe("sdkOptions", () => {
  it("converts simple values to strings", () => {
    expect(entries.sdkOptions({ page: 2, size: 10 })).toEqual({ page: "2", size: "10" });
  });

  it("converts search filter", () => {
    expect(entries.sdkOptions({ name: { search: "hello" } })).toEqual({ "name~": "hello" });
  });

  it("converts from/to filters", () => {
    expect(entries.sdkOptions({ created: { from: "2024-01-01", to: "2024-12-31" } }))
      .toEqual({ createdFrom: "2024-01-01", createdTo: "2024-12-31" });
  });

  it("converts any filter", () => {
    expect(entries.sdkOptions({ id: { any: ["a", "b"] } })).toEqual({ id: "a,b" });
  });

  it("filterOptions is alias for sdkOptions", () => {
    expect(entries.filterOptions).toBe(entries.sdkOptions);
  });
});

// --- getEntryShortID / getEntryEnv ---

describe("getEntryShortID", () => {
  it("extracts shortID from entry _links", () => {
    const entry = {
      _links: { collection: { href: "https://datamanager.cachena.entrecode.de/api/abc123/muffin" } },
    } as any;
    expect(entries.getEntryShortID(entry)).toBe("abc123");
  });
});

describe("getEntryEnv", () => {
  it("returns stage for cachena URLs", () => {
    const entry = {
      _links: { collection: { href: "https://datamanager.cachena.entrecode.de/api/abc123/muffin" } },
    } as any;
    expect(entries.getEntryEnv(entry)).toBe("stage");
  });

  it("returns live for production URLs", () => {
    const entry = {
      _links: { collection: { href: "https://datamanager.entrecode.de/api/abc123/muffin" } },
    } as any;
    expect(entries.getEntryEnv(entry)).toBe("live");
  });
});

// --- getEntryAsset ---

describe("getEntryAsset", () => {
  it("extracts embedded asset by field name", () => {
    const asset = { assetID: "a-1", file: { url: "https://example.com/photo.jpg" } };
    const entry = {
      _modelTitle: "muffin",
      _links: { collection: { href: "https://datamanager.cachena.entrecode.de/api/abc123/muffin" } },
      _embedded: { "abc123:muffin/photo/asset": asset },
    } as any;
    expect(entries.getEntryAsset("photo", entry)).toBe(asset);
  });
});
