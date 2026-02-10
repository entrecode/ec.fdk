import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./util", async (importOriginal) => {
  const original = await importOriginal<typeof import("./util")>();
  return {
    ...original,
    fetcher: vi.fn().mockResolvedValue({ token: "returned-token" }),
  };
});

import { fetcher } from "./util";
import * as auth from "./auth";

const mockFetcher = vi.mocked(fetcher);

const DM = "https://datamanager.cachena.entrecode.de/";
const ACC_STAGE = "https://accounts.cachena.entrecode.de/";
const ACC_LIVE = "https://accounts.entrecode.de/";
const jsonHeaders = { "Content-Type": "application/json" };

beforeEach(() => {
  mockFetcher.mockClear();
  mockFetcher.mockResolvedValue({ token: "returned-token" });
});

// --- loginPublic ---

describe("loginPublic", () => {
  it("POSTs credentials to public auth endpoint", async () => {
    await auth.loginPublic({
      env: "stage", dmShortID: "abc123", email: "user@test.com", password: "secret",
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}api/abc123/_auth/login?clientID=rest`,
      {},
      {
        method: "POST",
        body: JSON.stringify({ email: "user@test.com", password: "secret" }),
        headers: jsonHeaders,
      },
    );
  });
});

// --- loginEc ---

describe("loginEc", () => {
  it("POSTs credentials to accounts auth endpoint (stage)", async () => {
    await auth.loginEc({ env: "stage", email: "admin@test.com", password: "secret" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC_STAGE}auth/login?clientID=rest`,
      {},
      {
        method: "POST",
        body: JSON.stringify({ email: "admin@test.com", password: "secret" }),
        headers: jsonHeaders,
      },
    );
  });

  it("uses live accounts URL for live env", async () => {
    await auth.loginEc({ env: "live", email: "admin@test.com", password: "secret" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC_LIVE}auth/login?clientID=rest`,
      {},
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// --- logoutPublic ---

describe("logoutPublic", () => {
  it("POSTs to public logout with token in query", async () => {
    await auth.logoutPublic({ env: "stage", dmShortID: "abc123", token: "my-token" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}api/abc123/_auth/logout?clientID=rest&token=my-token`,
      { rawRes: true },
      { method: "POST" },
    );
  });
});

// --- logoutEc ---

describe("logoutEc", () => {
  it("POSTs to accounts logout with token in header", async () => {
    await auth.logoutEc({ env: "stage", token: "my-token" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC_STAGE}auth/logout?clientID=rest`,
      { rawRes: true, token: "my-token" },
      { method: "POST" },
    );
  });
});

// --- getPublicAuthKey ---

describe("getPublicAuthKey", () => {
  it("returns dmShortID as key", () => {
    expect(auth.getPublicAuthKey({ dmShortID: "abc123" })).toBe("abc123");
  });
});

// --- getEcAuthKey ---

describe("getEcAuthKey", () => {
  it("returns env as key", () => {
    expect(auth.getEcAuthKey({ env: "stage" })).toBe("stage");
  });

  it("returns live for live env", () => {
    expect(auth.getEcAuthKey({ env: "live" })).toBe("live");
  });
});
