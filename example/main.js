import { sdk } from "../src/index.mjs";
import { auth } from "../src/storage.mjs";
// test
let ecadmin = sdk("stage").dm("83cc6374");
const muffin = ecadmin.model("muffin");

auth.listen((v) => {
  const { dmShortID, env } = ecadmin.config;
  const { token } = v[env] || v[dmShortID] || {};
  console.log("token", token);
  ecadmin = ecadmin.token(token);
});

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
press("createEntryProtected", () =>
  ecadmin
    .model("dingding")
    .create({ text: "ec.fdk", number: 1 })
    .then(console.log)
);
press("createEntry", () =>
  ecadmin
    .model("muffin")
    .create({ name: "hello fdk", amazement_factor: 10 })
    .then(console.log)
);
press("editEntry", () => muffin.entry("fZctZXIeRJ").edit({}).then(console.log));

press("asset", () =>
  ecadmin
    .assetgroup("test")
    .asset("tP-ZxpZZTGmbPnET-wArAQ")
    .get()
    .then(console.log)
);
press("assets", () => ecadmin.assetgroup("test").assets().then(console.log));

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
    .then(console.log);
});
press("logoutEc", () => {
  ecadmin.logoutEc().then(console.log);
});
