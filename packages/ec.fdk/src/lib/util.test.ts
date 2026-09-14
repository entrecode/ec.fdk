import { describe, it, expect } from "vitest";
import { query } from "./util";

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
