# ec.fdk

## Install

```sh
pnpm i
```

## Use

```js
import { sdk } from "ec.fdk";

const muffins = await sdk("stage").dm("83cc6374").model("muffin").entries();
```

## API

The end-user API relies heavily on method chaining. Start with `sdk(env)`, then set any property in any order:

### Properties

- dmShortID | dm
- model
- token
- entryID | entry
- assetGroup
- assetID | asset

Example:

```js
const testdm = sdk("stage").dm("83cc6374");
const muffin = testdm.model("muffin");
const baker = testdm.model("baker");
```

### actions

After setting properties, you can fire a request by calling an action. Available actions:

- entries: load entry list
- assets: load asset list
- get: load resource
- del: delete resource
- create: create resource
- edit: edit resource
- loginPublic: login with a public user
- logoutPublic: logout the public user
- loginEc: login with an ec.user
- logoutEc: logout the ec.user

Each action expects certain properties to be set, for example `entries` expects `dmShortID` and `model`.
If you try to access a protected resource, you also have to set a `token`.

```js
const testdm = sdk("stage").dm("83cc6374");
const muffinList = await testdm.model("muffin").entries();
const assets = await testdm.assets();
```

## Examples

```sh
cd examples/vanilla && pnpm dev # vanilla js example
cd examples/react && pnpm dev # react js example
cd examples/node && pnpm start # node example, see package.json for more
```

[Codesandbox](https://codesandbox.io/s/ec-fdk-demo-lmzsl4?file=/src/index.mjs)
