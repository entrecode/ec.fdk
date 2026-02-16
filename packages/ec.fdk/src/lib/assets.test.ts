import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./util", async (importOriginal) => {
  const original = await importOriginal<typeof import("./util")>();
  return {
    ...original,
    fetcher: vi.fn().mockResolvedValue({ _embedded: {} }),
  };
});

import { fetcher } from "./util";
import * as assets from "./assets";

const mockFetcher = vi.mocked(fetcher);

const DM = "https://datamanager.cachena.entrecode.de/";

beforeEach(() => {
  mockFetcher.mockClear();
  mockFetcher.mockResolvedValue({ _embedded: {} });
});

// --- getAsset ---

describe("getAsset", () => {
  it("fetches asset by assetID query", async () => {
    mockFetcher.mockResolvedValue({
      _embedded: { "ec:dm-asset": { assetID: "a-1", file: { url: "test.jpg" } } },
    });
    const result = await assets.getAsset({
      env: "stage", dmShortID: "abc123", assetGroup: "images", assetID: "a-1", token: "tok",
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}a/abc123/images?assetID=a-1`,
      { token: "tok" },
    );
    expect(result).toEqual({ assetID: "a-1", file: { url: "test.jpg" } });
  });

  it("returns undefined when no _embedded", async () => {
    mockFetcher.mockResolvedValue({});
    const result = await assets.getAsset({
      env: "stage", dmShortID: "abc123", assetGroup: "images", assetID: "a-1", token: "tok",
    });
    expect(result).toBeUndefined();
  });
});

// --- assetList ---

describe("assetList", () => {
  it("fetches asset list with default options", async () => {
    mockFetcher.mockResolvedValue({
      count: 1, total: 1,
      _embedded: { "ec:dm-asset": [{ assetID: "a-1" }] },
    });
    const result = await assets.assetList({
      env: "stage", dmShortID: "abc123", assetGroup: "images", token: "tok",
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}a/abc123/images?_list=true&page=1&size=50`,
      { token: "tok" },
    );
    expect(result.items).toEqual([{ assetID: "a-1" }]);
  });

  it("merges custom options", async () => {
    mockFetcher.mockResolvedValue({ count: 0, total: 0, _embedded: {} });
    await assets.assetList({
      env: "stage", dmShortID: "abc123", assetGroup: "images", token: "tok",
      options: { size: 10, page: 3 },
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}a/abc123/images?_list=true&page=3&size=10`,
      { token: "tok" },
    );
  });

  it("wraps single embedded item in array", async () => {
    mockFetcher.mockResolvedValue({
      count: 1, total: 1,
      _embedded: { "ec:dm-asset": { assetID: "a-1" } },
    });
    const result = await assets.assetList({
      env: "stage", dmShortID: "abc123", assetGroup: "images", token: "tok",
    });
    expect(result.items).toEqual([{ assetID: "a-1" }]);
  });

  it("returns empty items when no _embedded", async () => {
    mockFetcher.mockResolvedValue({ count: 0, total: 0 });
    const result = await assets.assetList({
      env: "stage", dmShortID: "abc123", assetGroup: "images", token: "tok",
    });
    expect(result.items).toEqual([]);
  });
});

// --- createAsset ---

describe("createAsset", () => {
  it("POSTs FormData with file", async () => {
    mockFetcher.mockResolvedValue({
      _embedded: { "ec:dm-asset": { assetID: "new-1" } },
    });
    const file = new Blob(["hello"], { type: "text/plain" });
    const result = await assets.createAsset({
      env: "stage", dmShortID: "abc123", assetGroup: "images", token: "tok",
      file, name: "test.txt", options: undefined,
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}a/abc123/images`,
      { token: "tok" },
      { method: "POST", body: expect.any(FormData) },
    );
    expect(result).toEqual({ assetID: "new-1" });
  });

  it("appends options to FormData", async () => {
    mockFetcher.mockResolvedValue({
      _embedded: { "ec:dm-asset": { assetID: "new-1" } },
    });
    const file = new Blob(["data"]);
    await assets.createAsset({
      env: "stage", dmShortID: "abc123", assetGroup: "images", token: "tok",
      file, name: "test.txt", options: { deduplicate: "true" },
    });
    const call = mockFetcher.mock.calls[0];
    const formData = call[2].body as FormData;
    expect(formData.get("deduplicate")).toBe("true");
  });
});

// --- createAssets ---

describe("createAssets", () => {
  it("POSTs FormData with multiple files", async () => {
    mockFetcher.mockResolvedValue({
      _embedded: { "ec:dm-asset": [{ assetID: "a-1" }, { assetID: "a-2" }] },
    });
    const files = [new Blob(["f1"]), new Blob(["f2"])];
    const result = await assets.createAssets({
      env: "stage", dmShortID: "abc123", assetGroup: "images", files, options: undefined, token: "tok",
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}a/abc123/images`,
      { token: "tok" },
      { method: "POST", body: expect.any(FormData) },
    );
    expect(result).toEqual([{ assetID: "a-1" }, { assetID: "a-2" }]);
  });

  it("wraps single result in array", async () => {
    mockFetcher.mockResolvedValue({
      _embedded: { "ec:dm-asset": { assetID: "a-1" } },
    });
    const files = [new Blob(["f1"])];
    const result = await assets.createAssets({
      env: "stage", dmShortID: "abc123", assetGroup: "images", files, options: undefined, token: "tok",
    });
    expect(result).toEqual([{ assetID: "a-1" }]);
  });
});

// --- deleteAsset ---

describe("deleteAsset", () => {
  it("DELETEs asset with rawRes", async () => {
    await assets.deleteAsset({
      env: "stage", dmShortID: "abc123", assetGroup: "images", assetID: "a-1", token: "tok",
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}a/abc123/images/a-1`,
      { token: "tok", rawRes: true },
      { method: "DELETE" },
    );
  });
});

// --- fileVariant ---

describe("fileVariant", () => {
  const asset = {
    file: { url: "https://example.com/original.jpg" },
    fileVariants: [
      { url: "https://example.com/256.jpg", resolution: { width: 256, height: 192 } },
      { url: "https://example.com/512.jpg", resolution: { width: 512, height: 384 } },
      { url: "https://example.com/1024.jpg", resolution: { width: 1024, height: 768 } },
    ],
    thumbnails: [
      { url: "https://example.com/t64.jpg", resolution: { width: 64, height: 64 } },
      { url: "https://example.com/t128.jpg", resolution: { width: 128, height: 128 } },
    ],
  } as any;

  it("returns closest file variant by size", () => {
    expect(assets.fileVariant(asset, 500)).toBe("https://example.com/512.jpg");
  });

  it("returns closest thumbnail when thumb=true", () => {
    expect(assets.fileVariant(asset, 100, true)).toBe("https://example.com/t128.jpg");
  });

  it("returns original URL when no variants", () => {
    const bare = { file: { url: "https://example.com/original.jpg" } } as any;
    expect(assets.fileVariant(bare, 500)).toBe("https://example.com/original.jpg");
  });

  it("returns null when asset is undefined", () => {
    expect(assets.fileVariant(undefined as any, 500)).toBeNull();
  });
});

// --- getFileVariants ---

describe("getFileVariants", () => {
  const asset = {
    assetID: "a-1",
    file: {
      url: "https://example.com/original.jpg",
      resolution: { width: 2000, height: 1500 },
    },
    fileVariants: [
      { url: "https://example.com/256.jpg", resolution: { width: 256, height: 192 } },
    ],
    thumbnails: [
      { url: "https://example.com/t64.jpg", dimension: 64 },
    ],
  } as any;

  it("returns file variants for sizes smaller than original", () => {
    const variants = assets.getFileVariants("stage", "abc123", [64, 256, 512, 1024, 2048], asset);
    expect(variants).toHaveLength(4); // 64, 256, 512, 1024 (2048 >= 2000)
    expect(variants[0].size).toBe(64);
    expect(variants[1].size).toBe(256);
    expect(variants[1].url).toBe("https://example.com/256.jpg");
    // 512 is not generated yet, should have generate URL
    expect(variants[2].url).toBe("https://datamanager.cachena.entrecode.de/f/abc123/a-1/512");
  });

  it("returns thumbnails when thumb=true", () => {
    const variants = assets.getFileVariants("stage", "abc123", [64, 128, 256], asset, true);
    expect(variants).toHaveLength(3);
    expect(variants[0].url).toBe("https://example.com/t64.jpg");
    expect(variants[1].url).toBe("https://datamanager.cachena.entrecode.de/t/abc123/a-1/128");
  });

  it("uses live URL for live env", () => {
    const variants = assets.getFileVariants("live", "abc123", [512], asset);
    // 512 is not in the generated variants, so it uses the generate URL
    expect(variants[0].url).toBe("https://datamanager.entrecode.de/f/abc123/a-1/512");
  });
});
