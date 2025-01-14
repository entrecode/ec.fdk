import { fdk, filterOptions } from "ec.fdk";
import Cookies from "js-cookie";

// test
let ecadmin = fdk("stage").dm("83cc6374").storageAdapter(Cookies);
const field_test = ecadmin.model("field_test");
const muffin = ecadmin.model("muffin");

// console.log("auth", ecadmin.getEcToken());

const press = (id, fn) =>
  document.getElementById(id).addEventListener("click", fn);

press("entries", () => muffin.entries().then(console.log));
press("entriesSdk", async () => {
  const muffinList = await muffin.entries(
    filterOptions({
      _created: {
        from: "2024-01-20T10:32:32.358Z",
        to: "2024-05-20T10:32:32.358Z",
      },
      page: 1,
      size: 5,
    })
  );
  console.log(muffinList);
});
press("entriesSize", () => muffin.entries({ size: 25 }).then(console.log));
// sort asc
press("entriesAsc", () =>
  muffin.entries({ sort: "_modified" }).then(console.log)
);
// sort desc
press("entriesDesc", () =>
  muffin.entries({ sort: "-_modified" }).then(console.log)
);

// search with results, old: { name: {search:'king'} }
press("entriesSearch", () =>
  muffin.entries({ "name~": "king" }).then(console.log)
);

// exact without results, old: { name: 'king' } or {name:{exact:'king'}}
press("entriesExactEmpty", () =>
  muffin.entries({ name: "king" }).then(console.log)
);
press("entriesCreatedTo", () =>
  muffin.entryList({ createdTo: "2021-01-18T09:13:47.605Z" }).then(console.log)
);

press("mapEntries", async () => {
  console.log("go..");
  const res = await muffin.mapEntries((entry) =>
    muffin.editEntry(entry.id, { name: entry.name + "!" })
  );
  console.log("res", res);
});

// exact with results
press("entriesExact", () =>
  muffin.entries({ name: "Kiwi King" }).then(console.log)
);
press("entriesAny", () =>
  muffin
    .entryList({ id: ["frcjP1xMmi3", "SCRpMiiboM", "jHHoIpL1YmR"].join(",") })
    .then(console.log)
);

press("entry", () => muffin.getEntry("fZctZXIeRJ").then(console.log));

press("entriesError", () =>
  ecadmin.model("muffin").getEntry("nonexisting").then(console.log)
);

press("createEntryProtected", () =>
  ecadmin
    .model("dingding")
    .createEntry({ text: "ec.fdk", number: 1 })
    .then(console.log)
);
press("createEntry", () =>
  ecadmin
    .model("muffin")
    .createEntry({ name: "hello fdk", amazement_factor: 10 })
    .then(console.log)
);
press("editEntry", () => muffin.editEntry("fZctZXIeRJ", {}).then(console.log));
press("getSchema", () =>
  field_test.set({ withMetadata: true }).getSchema().then(console.log)
);

press("asset", () =>
  ecadmin
    .assetgroup("test")
    .getAsset("tP-ZxpZZTGmbPnET-wArAQ")
    .then(console.log)
);
press("assets", () => ecadmin.assetgroup("test").assets().then(console.log));

document.getElementById("file").addEventListener("input", (e) => {
  const [file] = e.target.files;
  console.log("file input", file);
  ecadmin.assetgroup("test").createAsset({ file }).then(console.log);
});
press("createAsset", () => {
  document.getElementById("file").click();
});

press("loginPublic", () => {
  ecadmin
    .loginPublic({
      email: prompt("Mail?", "flix91+3@gmail.com"),
      password: prompt("Passwort?"),
    })
    .then(console.log);
});
press("logoutPublic", () => {
  ecadmin.logoutPublic();
});
press("hasAnyToken", () => {
  console.log("hasAnyToken", ecadmin.hasAnyToken());
});
press("hasEcToken", () => {
  console.log("hasEcToken", ecadmin.hasEcToken());
});
press("hasPublicToken", () => {
  console.log("hasPublicToken", ecadmin.hasPublicToken());
});

press("entriesProtected", () => {
  ecadmin.model("dingding").entries().then(console.log);
});
press("loginEc", () => {
  ecadmin
    .loginEc({
      email: prompt("Mail?", "roos@entrecode.de"),
      password: prompt("Passwort?"),
    })
    .then((data) => {
      console.log("data", data);
    });
});
press("logoutEc", () => {
  ecadmin.logoutEc().then(console.log);
});

press("dmList", () => {
  fdk("stage").storageAdapter(Cookies).dmList().then(console.log);
});

press("modelList", () => {
  fdk("stage")
    .storageAdapter(Cookies)
    .dmID("254a03f1-cb76-4f1e-a52a-bbd4180ca10c")
    .modelList()
    .then(console.log);
});

press("publicApi", async () => {
  const res = await fdk("stage").dm("83cc6374").publicApi();
  console.log("res", res);
});
press("getDatamanager", async () => {
  console.log("getDatamanager");
  const res = await fdk("stage")
    .storageAdapter(Cookies)
    .getDatamanager("254a03f1-cb76-4f1e-a52a-bbd4180ca10c");
  console.log("res", res);
});

press("fetch-test", () => {
  console.log("test");
  const token = fdk("stage").storageAdapter(Cookies).getBestToken();
  fetch(
    //`https://datamanager.cachena.entrecode.de/api/83cc6374`,
    `https://datamanager.cachena.entrecode.de/?dataManagerID=254a03f1-cb76-4f1e-a52a-bbd4180ca10c`,
    //`https://datamanager.cachena.entrecode.de/model?dataManagerID=254a03f1-cb76-4f1e-a52a-bbd4180ca10c&_list=true&size=0`,
    { headers: { Authorization: `Bearer ${token}` } }
  ).then(async (res) => {
    if (!res.ok) {
      console.log("err", res.status);
    }
    const json = await res.json();
    console.log("res", json);
  });
  console.log("token", token);
  // https://datamanager.cachena.entrecode.de/model?dataManagerID=254a03f1-cb76-4f1e-a52a-bbd4180ca10c&_list=true&size=0
});

press("templates", () =>
  fdk("stage")
    .storageAdapter(Cookies)
    .resource("template")
    .resourceList()
    .then(console.log)
);

press("stats", () =>
  fdk("stage").storageAdapter(Cookies).route("stats").raw().then(console.log)
);
press("clients", () =>
  fdk("stage")
    .storageAdapter(Cookies)
    .resource("client")
    .resourceList({ dataManagerID: "50d2fe55-7e8f-4302-be4f-b816cad02b01" })
    .then(console.log)
);
