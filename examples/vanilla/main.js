import { sdk } from "ec.fdk";
import Cookies from "js-cookie";

// test
let ecadmin = sdk("stage").dm("83cc6374").authAdapter(Cookies);
const muffin = ecadmin.model("muffin");

console.log("auth", ecadmin.getPublicToken());

const press = (id, fn) =>
  document.getElementById(id).addEventListener("click", fn);

press("entries", () => muffin.entries().then(console.log));
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
  sdk("stage").authAdapter(Cookies).dmList().then(console.log);
});

press("modelList", () => {
  sdk("stage")
    .authAdapter(Cookies)
    .dmID("254a03f1-cb76-4f1e-a52a-bbd4180ca10c")
    .modelList()
    .then(console.log);
});
