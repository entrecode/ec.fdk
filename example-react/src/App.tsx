// @ts-ignore
import { sdk, act, query } from "../../src/index.mjs";
import { useState } from "react";
import useSWR from "swr";

function useSdk(config: any) {
  return useSWR([config ? query(config) : null], () => act(config));
}

function App() {
  const [id, setID] = useState("IVH5LQglkL");

  const { data: entry } = useSdk({
    action: "getEntry",
    env: "stage",
    dmShortID: "83cc6374",
    entryID: id,
    model: "muffin",
  });

  return (
    <>
      <h1>entry: {entry?._entryTitle}</h1>
      <button onClick={() => setID("frcjP1xMmi3")}>Kiwi King</button>
      <button onClick={() => setID("IVH5LQglkL")}>hello fdk</button>
    </>
  );
}

export default App;
