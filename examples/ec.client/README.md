# ec.client

This is a demo of how to set up a react app with OIDC auth via `@axa-fr/react-oidc`.

## Project Setup

This project has been created with the vite cli:

```sh
npm create vite
# choose React + TypeScript
# delete all the clutter
cd ec.client
npm i react-router-dom --save
```

## Create a new client

Go to [Clients](https://e.cachena.entrecode.de/stage/accounts/clients), click `create new`.
Here are some example values, adjust to your needs:

1. Client ID of form `{project-slug}-{env}`, e.g `ec-editor-next-stage`
2. clientName: description
3. Grant Types: keep `authorization_code` and `refresh_token`
4. tokenEndpointAuthMethod: none
5. Secret: none
6. Redirect URIs: `http://localhost:5174/authentication/callback`
7. Post Logout Redirect URIs: `http://localhost:5174/authentication/silent-callback` + `http://localhost:5174/`
8. authUIOrigin: `https://login.cachena.entrecode.de`
9. logoURI: `https://entrecode.de/de/assets/ec-logo.svg`
10. Callback URL: empty
11. config: `{ "signup": true, "defaultGroups": [], "requireInvite": true, "sendWelcomeMail": true }`

## Add .env file(s)

add `.env` file with

```plaintext
VITE_ENV=stage
VITE_CLIENT_ID=ec-editor-next-stage
VITE_AUTHORITY=https://login.cachena.entrecode.de/oidc
VITE_REDIRECT_URI=http://localhost:5174/authentication/callback
VITE_SILENT_REDIRECT_URI=http://localhost:5174/authentication/silent-callback
```

make sure `VITE_CLIENT_ID` matches `Client ID` and `VITE_REDIRECT_URI` matches `Redirect URIs` and `Post Logout Redirect URIs` of the client you've created earlier! Note that `VITE_REDIRECT_URI` has to be a sub-route!

## Install @axa-fr/react-oidc

```sh
npm i @axa-fr/react-oidc --save
```

copy service workers:

```sh
node ./node_modules/@axa-fr/react-oidc/bin/copy-service-worker-files.mjs public
```

If you're using npm workspaces, the `@axa-fr/react-oidc` might have been installed to the project root, so run:

```sh
node ../../node_modules/@axa-fr/react-oidc/bin/copy-service-worker-files.mjs public
```

add the same command as a postinstall script in your `package.json`!

edit `public/OidcTrustedDomains.js` to contain:

```js
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const trustedDomains = {
  default: [
    "https://login.cachena.entrecode.de/",
    "https://login.entrecode.de/",
    "https://datamanager.cachena.entrecode.de/",
    "https://datamanager.entrecode.de/",
    "https://accounts.cachena.entrecode.de/",
    "https://accounts.entrecode.de/",
  ],
};
```

Then, add this configuration to your `main.tsx`:

```tsx
import * as axaPackage from "@axa-fr/oidc-client/package.json";
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
```

Here's an example of how you can set up a react-router-dom:

```jsx
export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <OidcSecure>
        <Hello />
      </OidcSecure>
    ),
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
      <RouterProvider router={router} />
    </OidcProvider>
  </React.StrictMode>
);
```

Hello:

```jsx
import { useOidc } from "@axa-fr/react-oidc";

export function Hello() {
  const { logout } = useOidc();
  return <button onClick={() => logout("/")}>Logout</button>;
}
```

That's it!

## How it works

`@axa-fr/react-oidc` intercepts requests to any of the `trustedDomains` set up in `OidcTrustedDomains.js`, appending your token to the Authorization header! So you can just use `ec.fdk` or `ec.sdk` without setting a token!
