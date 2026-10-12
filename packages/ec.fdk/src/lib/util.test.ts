import { describe, it, expect, vi, afterEach } from "vitest";
import { query, fetcher, FdkError, isStaleWriteError } from "./util";

describe("fetcher errors", () => {
  afterEach(() => vi.unstubAllGlobals());

  // body as returned by the stage DM for a stale If-Unmodified-Since
  const stale = {
    status: 412,
    code: 2112,
    title: "Somebody else changed the resource",
    detail: "Resource was modified after Mon, 12 Oct 2026 15:01:27 GMT",
    verbose: "Mon, 12 Oct 2026 15:02:27 GMT",
  };

  it("throws FdkError with status, code and body, message unchanged", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(stale, { status: 412 })));
    const err = await fetcher("https://x/api").catch((e) => e);
    expect(err).toBeInstanceOf(FdkError);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe(`${stale.title}\n${stale.detail}\n${stale.verbose}`);
    expect(err.status).toBe(412);
    expect(err.code).toBe(2112);
    expect(err.info).toEqual(stale);
    expect(isStaleWriteError(err)).toBe(true);
  });

  it("keeps the status for non-JSON errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>", { status: 502, statusText: "Bad Gateway" })));
    const err = await fetcher("https://x/api").catch((e) => e);
    expect(err.message).toBe("unexpected fetch error: Bad Gateway");
    expect(err.status).toBe(502);
    expect(err.code).toBeUndefined();
    expect(isStaleWriteError(err)).toBe(false);
  });

  it("isStaleWriteError is false for other errors and non-errors", () => {
    expect(isStaleWriteError(new FdkError("nope", 404, { code: 2102 }))).toBe(false);
    expect(isStaleWriteError(new Error("Somebody else changed the resource"))).toBe(false);
    expect(isStaleWriteError(undefined)).toBe(false);
    // duck-typed: a copy from a second bundled ec.fdk still counts
    expect(isStaleWriteError({ status: 412 })).toBe(true);
  });
});

describe("query", () => {
  it("joins sorted key=value pairs", () => {
    expect(query({ size: 50, page: 1, _list: true })).toBe("_list=true&page=1&size=50");
  });

  it("URL-encodes values containing &, +, # and % (DAILY-3038)", () => {
    expect(query({ tag: "topic:Fitness & Gesundheit" })).toBe("tag=topic%3AFitness%20%26%20Gesundheit");
    expect(query({ tag: "Yoga+Pilates" })).toBe("tag=Yoga%2BPilates");
    expect(query({ tag: "Top #1" })).toBe("tag=Top%20%231");
    expect(query({ tag: "100%" })).toBe("tag=100%25");
  });

  it("encodes non-ASCII values", () => {
    expect(query({ tag: "Attraktivität" })).toBe("tag=Attraktivit%C3%A4t");
  });

  it("keeps filter modifier suffixes on keys intact", () => {
    expect(query({ "name~": "choc", "state!": "done" })).toBe("name~=choc&state!=done");
  });

  it("encodes comma lists and sort prefixes in a DM-decodable way", () => {
    expect(query({ id: "a,b", sort: "-_created" })).toBe("id=a%2Cb&sort=-_created");
  });
});
