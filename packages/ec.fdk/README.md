# ec.fdk

*F*eatherweight *D*evelopment *K*it for entrecode APIs.

[ec.fdk docs](https://entrecode.github.io/ec.fdk)

## Install

```sh
npm i ec.fdk
```

## Getting Started

There are 2 ways to use ec.fdk:

- method chaining
- act

### Method Chaining

Start by calling `fdk` with your environment (`stage` | `live`), then method chain your way to success:

```js
import { fdk } from "ec.fdk";

fdk("stage") // choose stage environment
  .dm("83cc6374") // select datamanager via short id
  .model("muffin") // select model muffin
  .entries() // load entry list
  .then((list) => {
    console.log(list);
  });
```

You can also reuse parts of the chain with variables:

```js
// we want to do stuff with model muffin here
const muffin = fdk("stage").dm("83cc6374").model("muffin");
// load entry list
const { items } = await muffin.entries();
// edit first entry
await muffin.editEntry(items[0].id, { name: "edit!" });
// delete second entry
await muffin.deleteEntry(items[1].id);
// create a new muffin
await muffin.createEntry({ name: "new muffin" });
// edit third entry with safePut
await muffin.editEntrySafe(items[2].id, {
  _modified: items[2]._modified,
  name: "safePut!",
});
```

### act

The act function converts a single object param into a fetch request:

```js
const muffins = await act({
  action: "entryList",
  env: "stage",
  dmShortID: "83cc6374",
  model: "muffin",
});
```

The object passed to `act` expects an `action` ([available actions](https://github.com/entrecode/ec.fdk/blob/main/packages/ec.fdk/src/lib/api.mjs))
and additional keys that are required to perform the action.
If you don't know the required keys for an action, either call `act` without additional keys or look it up in the source.
For example, this is how the `entryList` function looks:

```js
export async function entryList(config) {
  let { env, dmShortID, model, options = {} } = config;
  expect({ env, dmShortID, model });
  /* more stuff */
}
```

here you can clearly see the available params.

### Using act with swr / react-query

The act function is good to be used with swr or react-query:

```js
import { act } from "ec.fdk";
import useSWR from "swr";

export function useFdk(config) {
  const key = config ? JSON.stringify(config) : null;
  return useSWR([key], () => act(config));
}
```

Then use the hook:

```js
const config = {
  env: "stage",
  dmShortID: "83cc6374",
};

function App() {
  const { data: entryList } = useFdk({
    ...config,
    action: "entryList",
    model: "muffin",
  });
  /* more stuff */
}
```

## migration from ec.sdk

ec.fdk won't change / decorate data returned from ec APIs. For example, an entry returned from the datamanager will be returned as is.
Advantages:

- The network tab shows what goes into the frontend
- Resources have the same shape everywhere
- Resources are serializable

### Entry save

Instead of mutating an EntryResource and calling `.save()`, we now pass the new `value` directly:

```js
// this does not exist anymore:
await entry.save(); // <- DONT
// use this to update an entry:
await editEntryObject(entry, value); // <- DO
// alternatively:
await fdk.env(env).dm(dmShortID).model(model).updateEntry(entryID, value);
// or:
await act({ action: "editEntry", env, dmShortID, model, entryID, value });
```

### Entry delete

Similar to save:

```js
// this does not exist anymore:
await entry.del(); // <- DONT
// use this to delete an entry:
await deleteEntryObject(entry); // <- DO
// alternatively:
await fdk.dm("shortID").model("model").deleteEntry("entryID");
// or:
await act({ action: "deleteEntry", env, dmShortID, model, entryID });
```

### Entry Asset Fields

In ec.fdk, entry asset fields are plain ids:

```js
// assuming "photo" is an asset field:
entry.photo; // <-- this used to be an AssetResource. Now it's a plain id string.
// use this to get the embedded AssetResource:
getEntryAsset("photo", entry); // (no request goes out)
```

### Entry Date Fields

```js
// assuming "lastSeen" is a datetime field:
entry.lastSeen; // <-- this used to be an instance of Date. Now it's a date ISO string
// use this to get a Date instance:
new Date(entry.lastSeen);
```

### Entry List

```js
// ec.sdk
const api = new PublicAPI(shortID, env, true);
const entryList = await api.entryList(model);
const items = entryList.getAllItems();
const first = entryList.getFirstItem();
// ec.fdk
const api = fdk(env).dm(shortID);
const entryList = await api.entryList(model);
const items = entryList.items; // <------- change
const first = entryList.items[0]; // <------- change
// or in one line:
const entryList = await fdk(env).dm(shortID).entryList(model);
```

### Entry List Filter Options

By default, the second param of ec.fdk `entryList` will just convert the object to url params:

```js
const entryList = await fdk("stage")
  .dm("83cc6374")
  .entryList({ createdTo: "2021-01-18T09:13:47.605Z" });
/* 
https://datamanager.cachena.entrecode.de/api/83cc6374/muffin?
_list=true&
createdTo=2021-01-18T09:13:47.605Z&
page=1&
size=50
*/
```

Read more in the [entrecode filtering doc](https://doc.entrecode.de/api-basics/#filtering)

There is some syntax sugar you can use to get the same behavior as [ec.sdk filterOptions](https://entrecode.github.io/ec.sdk/#filteroptions):

```js
const entryList = await fdk("stage")
  .dm("83cc6374")
  .entryList(filterOptions({ created: { to: "2021-01-18T09:13:47.605Z" } }));
```

## Publish

0. `cd packages/ec.fdk`
1. bump version in `packages/ec.fdk/package.json`
2. run `pnpm docs` to regenerate docs folder
3. commit + push
4. run `pnpm publish`
