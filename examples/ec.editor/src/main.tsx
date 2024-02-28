import React from "react";
import ReactDOM from "react-dom/client";
import * as axaPackage from "@axa-fr/oidc-client/package.json";
import { OidcProvider, OidcSecure } from "@axa-fr/react-oidc";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { PageLoader } from "./components/PageLoader.tsx";
import { Dms } from "./routes/Dms.tsx";
import { Models } from "./routes/Models.tsx";
import "./index.css";
import { Entries } from "./routes/Entries.tsx";
import { Entry } from "./routes/Entry.tsx";

const environment = import.meta.env;

const configuration = {
  client_id: environment.VITE_CLIENT_ID,
  redirect_uri: environment.VITE_REDIRECT_URI,
  silent_redirect_uri: environment.VITE_SILENT_REDIRECT_URI,
  scope: "openid profile email ecapi offline_access",
  authority: environment.VITE_AUTHORITY,
  demonstrating_proof_of_possession: false,
  service_worker_relative_url: `/OidcServiceWorker.js?v=${axaPackage.version}`,
  service_worker_only: true,
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Dms />,
  },
  {
    path: "/dm/:shortID/model",
    element: <Models />,
  },
  {
    path: "/dm/:shortID/model/:model/entry",
    element: <Entries />,
  },
  {
    path: "/dm/:shortID/model/:model/entry/:entryID",
    element: <Entry />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OidcProvider
      configuration={configuration}
      loadingComponent={PageLoader}
      authenticatingComponent={PageLoader}
      callbackSuccessComponent={PageLoader}
    >
      <OidcSecure>
        <RouterProvider router={router} />
      </OidcSecure>
    </OidcProvider>
  </React.StrictMode>
);
