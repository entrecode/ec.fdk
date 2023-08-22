/* 
import { map } from "nanostores";
import { useStore } from "@nanostores/react";
import { nanoquery } from "@nanostores/query";

export const [createFetcherStore, createMutatorStore] = nanoquery({
  fetcher: (...keys: (string | number)[]) => {
    const url = keys.join("/");
    console.log("fetch", url);
    return fetch(url).then((r) => r.json());
  },
});


const $config = map({
  apiURL: "https://datamanager.cachena.entrecode.de",
  dmShortID: "83cc6374",
  model: "muffin",
  entryID: "fZctZXIeRJ",
});
export const $entry = createFetcherStore<any>([
  computed(
    $config,
    ({ apiURL, dmShortID, model, entryID }) =>
      `${apiURL}/api/${dmShortID}/${model}?_id=${entryID}`
  ),
]); 


      <button onClick={() => $config.setKey("entryID", "IVH5LQglkL")}>
        hello fdk
      </button>
      <button onClick={() => $config.setKey("entryID", "frcjP1xMmi3 ")}>
        Kiwi King
      </button>  
*/
