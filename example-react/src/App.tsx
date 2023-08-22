import { useState } from "react";
import { useSdk } from "./useSdk";
// @ts-ignore
import { loginEcStored, logoutEcStored } from "../../src/storage.mjs";

const config = {
  env: "stage",
  dmShortID: "83cc6374",
};

function App() {
  const [id, setID] = useState("IVH5LQglkL");
  const [model, setModel] = useState("muffin");

  const { data: entry } = useSdk({
    ...config,
    action: "getEntry",
    entryID: id,
    model: "muffin",
  });

  const { data: entryList } = useSdk({
    ...config,
    action: "entryList",
    model,
  });

  return (
    <>
      <h1>entry: {entry?._entryTitle}</h1>
      <button onClick={() => setID("frcjP1xMmi3")}>muffin: Kiwi King</button>
      <button onClick={() => setID("IVH5LQglkL")}>muffin: hello fdk</button>
      <pre>{JSON.stringify(entry || {})}</pre>
      <h1>List {model}</h1>
      <button onClick={() => setModel("muffin")}>model: muffin</button>
      <button onClick={() => setModel("baker")}>model: baker</button>
      {entryList?.items.map((item: any) => (
        <li key={item.id}>{item._entryTitle}</li>
      ))}
      <h1>Auth</h1>
      auth
      <button
        onClick={async () => {
          const loginConfig = {
            ...config,
            email: "roos@entrecode.de",
            password: "letmein",
          };
          await loginEcStored(loginConfig);
          console.log("login complete");
          /* const { token } = await act(loginConfig);
          console.log("token", token);
          auth.setKey(config.dmShortID, { token }); */
        }}
      >
        login
      </button>
      <button
        onClick={async () => {
          await logoutEcStored(config);
          console.log("logout complete");
        }}
      >
        logout
      </button>
    </>
  );
}

export default App;
