import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./util", async (importOriginal) => {
  const original = await importOriginal<typeof import("./util")>();
  return {
    ...original,
    fetcher: vi.fn().mockResolvedValue({ count: 0, total: 0, _embedded: {} }),
  };
});

import { fetcher } from "./util";
import * as admin from "./admin";

const mockFetcher = vi.mocked(fetcher);

const DM = "https://datamanager.cachena.entrecode.de/";
const ACC = "https://accounts.cachena.entrecode.de/";
const HIST = "https://dm-history.cachena.entrecode.de/";

const jsonHeaders = { "Content-Type": "application/json" };

beforeEach(() => {
  mockFetcher.mockClear();
  mockFetcher.mockResolvedValue({ count: 0, total: 0, _embedded: {} });
});

// --- Read / List functions ---

describe("getDatamanager", () => {
  it("fetches with dataManagerID query", async () => {
    await admin.getDatamanager({ env: "stage", dmID: "dm-1", token: "tok" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}?dataManagerID=dm-1`,
      { token: "tok" },
    );
  });
});

describe("dmList", () => {
  it("fetches with default list options", async () => {
    await admin.dmList({ env: "stage", token: "tok" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}?_list=true&page=1&size=25`,
      { env: "stage", token: "tok" },
    );
  });

  it("merges custom options", async () => {
    await admin.dmList({ env: "stage", token: "tok", options: { "title~": "HO" } });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}?_list=true&page=1&size=25&title~=HO`,
      { env: "stage", token: "tok", options: { "title~": "HO" } },
    );
  });
});

describe("modelList", () => {
  it("fetches models with dmID", async () => {
    await admin.modelList({ env: "stage", dmID: "dm-1", token: "tok" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}model?_list=true&dataManagerID=dm-1&page=1&size=25`,
      { env: "stage", dmID: "dm-1", token: "tok" },
    );
  });
});

describe("resourceList", () => {
  it("fetches resource with subdomain", async () => {
    await admin.resourceList({
      env: "stage",
      resource: "role",
      subdomain: "datamanager",
      token: "tok",
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}role?_list=true&page=1&size=25`,
      { env: "stage", resource: "role", subdomain: "datamanager", token: "tok" },
    );
  });

  it("defaults subdomain to datamanager", async () => {
    await admin.resourceList({ env: "stage", resource: "client", token: "tok" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}client?_list=true&page=1&size=25`,
      { env: "stage", resource: "client", token: "tok" },
    );
  });
});

describe("raw", () => {
  it("fetches with route, subdomain, and options", async () => {
    await admin.raw(
      {
        env: "stage",
        route: "entries",
        subdomain: "dm-history",
        options: { dataManagerID: "dm-1", modelID: "m-1" },
        token: "tok",
      },
      { method: "GET" },
    );
    expect(mockFetcher).toHaveBeenCalledWith(
      `${HIST}entries?dataManagerID=dm-1&modelID=m-1`,
      {
        env: "stage",
        route: "entries",
        subdomain: "dm-history",
        options: { dataManagerID: "dm-1", modelID: "m-1" },
        token: "tok",
      },
      { method: "GET" },
    );
  });
});

// --- Datamanager CRUD ---

describe("Datamanager CRUD", () => {
  it("createDatamanager → POST to dm root", async () => {
    const value = { title: "Test" };
    await admin.createDatamanager({ env: "stage", token: "tok", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}`,
      { token: "tok" },
      { method: "POST", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("editDatamanager → PUT with dataManagerID", async () => {
    const value = { title: "Updated" };
    await admin.editDatamanager({ env: "stage", token: "tok", dmID: "dm-1", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}?dataManagerID=dm-1`,
      { token: "tok" },
      { method: "PUT", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("deleteDatamanager → DELETE with rawRes", async () => {
    await admin.deleteDatamanager({ env: "stage", token: "tok", dmID: "dm-1" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}?dataManagerID=dm-1`,
      { token: "tok", rawRes: true },
      { method: "DELETE", headers: jsonHeaders },
    );
  });
});

// --- Model CRUD ---

describe("Model CRUD", () => {
  it("createModel → POST model with dmID", async () => {
    const value = { title: "NewModel" };
    await admin.createModel({ env: "stage", token: "tok", dmID: "dm-1", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}model?dataManagerID=dm-1`,
      { token: "tok" },
      { method: "POST", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("editModel → PUT model with dmID and modelID", async () => {
    const value = { title: "Renamed" };
    await admin.editModel({ env: "stage", token: "tok", dmID: "dm-1", modelID: "m-1", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}model?dataManagerID=dm-1&modelID=m-1`,
      { token: "tok" },
      { method: "PUT", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("deleteModel → DELETE with rawRes", async () => {
    await admin.deleteModel({ env: "stage", token: "tok", dmID: "dm-1", modelID: "m-1" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}model?dataManagerID=dm-1&modelID=m-1`,
      { token: "tok", rawRes: true },
      { method: "DELETE", headers: jsonHeaders },
    );
  });
});

// --- Template CRUD ---

describe("Template CRUD", () => {
  it("createTemplate → POST template", async () => {
    const value = { name: "tpl" };
    await admin.createTemplate({ env: "stage", token: "tok", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}template`,
      { token: "tok" },
      { method: "POST", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("editTemplate → PUT template with templateID", async () => {
    const value = { name: "updated-tpl" };
    await admin.editTemplate({ env: "stage", token: "tok", templateID: "tpl-1", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}template?templateID=tpl-1`,
      { token: "tok" },
      { method: "PUT", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("deleteTemplate → DELETE with rawRes", async () => {
    await admin.deleteTemplate({ env: "stage", token: "tok", templateID: "tpl-1" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}template?templateID=tpl-1`,
      { token: "tok", rawRes: true },
      { method: "DELETE", headers: jsonHeaders },
    );
  });
});

// --- Asset Group ---

describe("Asset Group", () => {
  it("createAssetGroup → POST assetgroup with dmID", async () => {
    const value = { title: "images" };
    await admin.createAssetGroup({ env: "stage", token: "tok", dmID: "dm-1", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}assetgroup?dataManagerID=dm-1`,
      { token: "tok" },
      { method: "POST", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("editAssetGroup → PUT assetgroup with dmID and assetGroupID", async () => {
    const value = { title: "renamed" };
    await admin.editAssetGroup({
      env: "stage", token: "tok", dmID: "dm-1", assetGroupID: "ag-1", value,
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}assetgroup?assetGroupID=ag-1&dataManagerID=dm-1`,
      { token: "tok" },
      { method: "PUT", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });
});

// --- Asset metadata ---

describe("Asset metadata", () => {
  it("editAsset → PUT asset by shortID/group/assetID", async () => {
    const value = { title: "photo.jpg" };
    await admin.editAsset({
      env: "stage", token: "tok", dmShortID: "abc123", assetGroup: "images", assetID: "a-1", value,
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}a/abc123/images/a-1`,
      { token: "tok" },
      { method: "PUT", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });
});

// --- DM Client ---

describe("DM Client", () => {
  it("editDmClient → PUT client with dmID and clientID", async () => {
    const value = { callbackURL: "https://example.com" };
    await admin.editDmClient({
      env: "stage", token: "tok", dmID: "dm-1", clientID: "c-1", value,
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}client?clientID=c-1&dataManagerID=dm-1`,
      { token: "tok" },
      { method: "PUT", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });
});

// --- Role CRUD ---

describe("Role CRUD", () => {
  it("createRole → POST role with dmID", async () => {
    const value = { name: "editor" };
    await admin.createRole({ env: "stage", token: "tok", dmID: "dm-1", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}role?dataManagerID=dm-1`,
      { token: "tok" },
      { method: "POST", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("editRole → PUT role with dmID and roleID", async () => {
    const value = { name: "admin" };
    await admin.editRole({ env: "stage", token: "tok", dmID: "dm-1", roleID: "r-1", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}role?dataManagerID=dm-1&roleID=r-1`,
      { token: "tok" },
      { method: "PUT", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("deleteRole → DELETE with rawRes", async () => {
    await admin.deleteRole({ env: "stage", token: "tok", dmID: "dm-1", roleID: "r-1" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}role?dataManagerID=dm-1&roleID=r-1`,
      { token: "tok", rawRes: true },
      { method: "DELETE", headers: jsonHeaders },
    );
  });
});

// --- DM Account ---

describe("DM Account", () => {
  it("editDmAccount → PUT account with dmID and accountID", async () => {
    const value = { email: "test@example.com" };
    await admin.editDmAccount({
      env: "stage", token: "tok", dmID: "dm-1", accountID: "acc-1", value,
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}account?accountID=acc-1&dataManagerID=dm-1`,
      { token: "tok" },
      { method: "PUT", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("deleteDmAccount → DELETE with rawRes", async () => {
    await admin.deleteDmAccount({ env: "stage", token: "tok", dmID: "dm-1", accountID: "acc-1" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}account?accountID=acc-1&dataManagerID=dm-1`,
      { token: "tok", rawRes: true },
      { method: "DELETE", headers: jsonHeaders },
    );
  });
});

// --- Stats ---

describe("Stats", () => {
  it("getStats → GET stats with options", async () => {
    await admin.getStats({ env: "stage", token: "tok", options: { dataManagerID: "dm-1" } });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}stats?dataManagerID=dm-1`,
      { token: "tok" },
    );
  });

  it("getStats → GET stats without options", async () => {
    await admin.getStats({ env: "stage", token: "tok" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${DM}stats?`,
      { token: "tok" },
    );
  });
});

// --- History ---

describe("History", () => {
  it("getHistory → GET entries on dm-history subdomain", async () => {
    await admin.getHistory({
      env: "stage", token: "tok", options: { dataManagerID: "dm-1", modelID: "m-1" },
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${HIST}entries?dataManagerID=dm-1&modelID=m-1`,
      { token: "tok" },
    );
  });
});

// --- Account Client ---

describe("Account Client", () => {
  it("createAccountClient → POST client on accounts subdomain", async () => {
    const value = { callbackURL: "https://example.com" };
    await admin.createAccountClient({ env: "stage", token: "tok", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC}client`,
      { token: "tok" },
      { method: "POST", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("editAccountClient → PUT client on accounts subdomain", async () => {
    const value = { callbackURL: "https://updated.com" };
    await admin.editAccountClient({ env: "stage", token: "tok", clientID: "c-1", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC}client?clientID=c-1`,
      { token: "tok" },
      { method: "PUT", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("deleteAccountClient → DELETE with rawRes on accounts subdomain", async () => {
    await admin.deleteAccountClient({ env: "stage", token: "tok", clientID: "c-1" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC}client?clientID=c-1`,
      { token: "tok", rawRes: true },
      { method: "DELETE", headers: jsonHeaders },
    );
  });
});

// --- Group ---

describe("Group", () => {
  it("createGroup → POST group on accounts subdomain", async () => {
    const value = { name: "admins" };
    await admin.createGroup({ env: "stage", token: "tok", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC}group`,
      { token: "tok" },
      { method: "POST", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("editGroup → PUT group on accounts subdomain", async () => {
    const value = { name: "editors" };
    await admin.editGroup({ env: "stage", token: "tok", groupID: "g-1", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC}group?groupID=g-1`,
      { token: "tok" },
      { method: "PUT", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("deleteGroup → DELETE with rawRes on accounts subdomain", async () => {
    await admin.deleteGroup({ env: "stage", token: "tok", groupID: "g-1" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC}group?groupID=g-1`,
      { token: "tok", rawRes: true },
      { method: "DELETE", headers: jsonHeaders },
    );
  });
});

// --- Invite ---

describe("Invite", () => {
  it("createInvite → POST invite on accounts subdomain", async () => {
    const value = { email: "invite@example.com" };
    await admin.createInvite({ env: "stage", token: "tok", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC}invite`,
      { token: "tok" },
      { method: "POST", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("editInvite → PUT invite on accounts subdomain", async () => {
    const value = { email: "updated@example.com" };
    await admin.editInvite({ env: "stage", token: "tok", inviteID: "inv-1", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC}invite?inviteID=inv-1`,
      { token: "tok" },
      { method: "PUT", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });

  it("deleteInvite → DELETE with rawRes on accounts subdomain", async () => {
    await admin.deleteInvite({ env: "stage", token: "tok", inviteID: "inv-1" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC}invite?inviteID=inv-1`,
      { token: "tok", rawRes: true },
      { method: "DELETE", headers: jsonHeaders },
    );
  });
});

// --- Account ---

describe("Account", () => {
  it("editAccount → PUT account on accounts subdomain", async () => {
    const value = { email: "new@example.com" };
    await admin.editAccount({ env: "stage", token: "tok", accountID: "acc-1", value });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC}account?accountID=acc-1`,
      { token: "tok" },
      { method: "PUT", body: JSON.stringify(value), headers: jsonHeaders },
    );
  });
});

// --- Tokens ---

describe("Tokens", () => {
  it("listTokens → GET account tokens on accounts subdomain", async () => {
    await admin.listTokens({ env: "stage", token: "tok", accountID: "acc-1" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC}account/acc-1/tokens`,
      { token: "tok" },
    );
  });

  it("createToken → POST account tokens on accounts subdomain", async () => {
    await admin.createToken({ env: "stage", token: "tok", accountID: "acc-1" });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC}account/acc-1/tokens`,
      { token: "tok" },
      { method: "POST", headers: jsonHeaders },
    );
  });

  it("deleteToken → DELETE specific token with rawRes", async () => {
    await admin.deleteToken({
      env: "stage", token: "tok", accountID: "acc-1", accessTokenID: "at-1",
    });
    expect(mockFetcher).toHaveBeenCalledWith(
      `${ACC}account/acc-1/tokens/at-1`,
      { token: "tok", rawRes: true },
      { method: "DELETE", headers: jsonHeaders },
    );
  });
});
