import { sdk, auth } from "../index.mjs";
// test
const ecadmin = sdk("stage").dm("83cc6374");
const muffin = ecadmin.model("muffin");

auth.listen((v) => console.log("auth changed", v));

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

press("entry", () => muffin.entry("fZctZXIeRJ").get().then(console.log));
press("entryCreate", () => muffin.create({}).then(console.log));
press("entryEdit", () => muffin.entry("fZctZXIeRJ").edit({}).then(console.log));

press("asset", () =>
  ecadmin
    .assetgroup("test")
    .asset("tP-ZxpZZTGmbPnET-wArAQ")
    .get()
    .then(console.log)
);
press("assets", () => ecadmin.assetgroup("test").assets().then(console.log));

press("loginPublic", () => {
  sdk("stage")
    .dm("38805f53")
    .login({
      email: prompt("Mail?", "roos@entrecode.de"),
      password: prompt("Passwort?"),
    });
});
press("logoutPublic", () => {
  sdk("stage").dm("38805f53").logout();
});
press("hasAuth", () => {
  const hasAuth = sdk("stage").dm("38805f53").hasAuth();
  console.log("hasAuth", hasAuth);
});
