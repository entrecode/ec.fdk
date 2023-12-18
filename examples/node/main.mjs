import { entryList, sdk, act } from "ec.fdk";

async function run() {
  const entries = await sdk("stage").dm("83cc6374").model("muffin").entries();

  // or write:

  /* const entries = await entryList({
    env: "stage",
    dmShortID: "83cc6374",
    model: "muffin",
  }); */

  // or write

  /* const entries = await act({
    action: "entryList",
    env: "stage",
    dmShortID: "83cc6374",
    model: "muffin",
  }); */

  console.log("entries", entries.items);
}

run();
