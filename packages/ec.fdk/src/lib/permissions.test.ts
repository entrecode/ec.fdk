import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  expandTemplatePermissions,
  clearTemplatePermissionCache,
} from "./permissions";

const T1 = "11111111-1111-4111-8111-111111111111";
const T2 = "22222222-2222-4222-8222-222222222222";

/** Fetcher mock that answers the `template/<id>/datamanagers` route from a map. */
function makeFetcher(map: Record<string, string[]>) {
  return vi.fn(async (url: string) => {
    const match = /template\/([^/]+)\/datamanagers/.exec(url);
    const templateID = match?.[1] ?? "";
    return { templateID, dataManagerIDs: map[templateID] ?? [] };
  });
}

beforeEach(() => {
  clearTemplatePermissionCache();
});

describe("expandTemplatePermissions", () => {
  it("replaces a template entry with concrete permissions and passes others through", async () => {
    const fetcher = makeFetcher({ [T1]: ["dm-a", "dm-b"] });
    const result = await expandTemplatePermissions(
      { env: "stage", token: "tok", fetcher },
      [`dm:template-${T1}:entry:read`, "some:other:perm"],
    );
    expect(result).toEqual([
      "dm:dm-a:entry:read",
      "dm:dm-b:entry:read",
      "some:other:perm",
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      "https://datamanager.cachena.entrecode.de/template/" + T1 + "/datamanagers",
      { token: "tok" },
    );
  });

  it("deduplicates permissions produced by expansion", async () => {
    const fetcher = makeFetcher({ [T1]: ["dm-a", "dm-a"] });
    const result = await expandTemplatePermissions(
      { env: "stage", fetcher },
      [`dm:template-${T1}:entry:read`, "dm:dm-a:entry:read"],
    );
    expect(result).toEqual(["dm:dm-a:entry:read"]);
  });

  it("resolves multiple templates", async () => {
    const fetcher = makeFetcher({ [T1]: ["dm-a"], [T2]: ["dm-b", "dm-c"] });
    const result = await expandTemplatePermissions(
      { env: "stage", fetcher },
      [`dm:template-${T1}:entry:read`, `dm:template-${T2}:entry:write`],
    );
    expect(result).toEqual([
      "dm:dm-a:entry:read",
      "dm:dm-b:entry:write",
      "dm:dm-c:entry:write",
    ]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("leaves entries with an invalid template UUID untouched (no fetch)", async () => {
    const fetcher = makeFetcher({});
    const input = ["dm:template-not-a-uuid:entry:read", "dm:template-:entry:read"];
    const result = await expandTemplatePermissions({ env: "stage", fetcher }, input);
    expect(result).toEqual(input);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("caches the mapping so each templateID is fetched only once", async () => {
    const fetcher = makeFetcher({ [T1]: ["dm-a"] });
    const config = { env: "stage", fetcher };
    await expandTemplatePermissions(config, [`dm:template-${T1}:entry:read`]);
    await expandTemplatePermissions(config, [`dm:template-${T1}:entry:write`]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("leaves entries unexpanded when the route fails (fail-closed, no throw)", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("boom"));
    const input = [`dm:template-${T1}:entry:read`, "some:other:perm"];
    const result = await expandTemplatePermissions({ env: "stage", fetcher }, input);
    expect(result).toEqual(input);
  });

  it("drops a template entry that maps to no datamanagers (empty result)", async () => {
    const fetcher = makeFetcher({ [T1]: [] });
    const result = await expandTemplatePermissions(
      { env: "stage", fetcher },
      [`dm:template-${T1}:entry:read`, "keep:me"],
    );
    expect(result).toEqual(["keep:me"]);
  });

  it("returns the input unchanged when there are no template entries", async () => {
    const fetcher = makeFetcher({});
    const input = ["entry:muffin:read", "dm:dm-a:entry:write"];
    const result = await expandTemplatePermissions({ env: "stage", fetcher }, input);
    expect(result).toEqual(input);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
