# ec.fdk

Lightweight SDK for entrecode APIs.
Currently supports only most common PublicAPI functions.

## Install

```sh
npm i ec.fdk
```

## Publish

0. `cd packages/ec.fdk`
1. bump version in `packages/ec.fdk/package.json`
2. run `pnpm readme`
3. commit + push
4. run `pnpm publish`

## API

There are 2 ways to use ec.fdk:

- method chaining
- act

### Method Chaining

Start by calling `sdk` with your environment (`stage` | `live`), then method chain your way to success:

```js
import { sdk } from "ec.fdk";

sdk("stage") // choose stage environment
.dm("83cc6374") // select datamanager via short id
.model("muffin") // select model muffin
.entries() // load entry list
.then(list => {
  console.log(list);
})
```

You can also reuse parts of the chain with variables:

```js
// we want to do stuff with model muffin here
const muffin = sdk("stage").dm("83cc6374").model("muffin");
// load entry list
const { items } = await muffin.entries();
// edit first entry
await muffin.editEntry(items[0].id, { name: "edit!" });
// delete second entry
await muffin.deleteEntry(items[1].id);
// create a new muffin
await muffin.createEntry({ name: "new muffin" });
// edit third entry with safePut
await muffin.editEntrySafe(items[2].id, { _modified: items[2]._modified, name: "safePut!" });
```

### act

The act function converts a single object param into a fetch request:

```js
const muffins = await act({
  action: "entryList",
  env: "stage",
  dmShortID: "83cc6374",
  model: "muffin",
})
```

The object passed to `act` expects an `action` ([available actions](https://github.com/entrecode/ec.fdk/blob/main/packages/ec.fdk/src/lib/api.mjs)) 
+ additional keys that are required to perform the action. 
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

export function useSdk(config) {
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
  const { data: entryList } = useSdk({
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
await editEntry({ env, dmShortID, model, entryID, value });
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
const api = sdk(env).dm(shortID);
const entryList = await api.entryList(model);
const items = entryList.items; // <------- change
const first = entryList.items[0]; // <------- change
// or in one line:
const entryList = await sdk(env).dm(shortID).entryList(model);
```

### Entry List Filter Options

By default, the second param of ec.fdk `entryList` will just convert the object to url params:

```js
const entryList = await sdk("stage")
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
const entryList = await sdk("stage")
  .dm("83cc6374")
  .entryList(filterOptions({ created: { to: "2021-01-18T09:13:47.605Z" } }));
```


Now what follows is the autogenerated doc from source:

## API Reference

<a name="module_api.Sdk"></a>

### api.Sdk
<p>SDK</p>

**Kind**: static class of [<code>api</code>](#module_api)  

* [.Sdk](#module_api.Sdk)
    * [.entries([options])](#module_api.Sdk+entries) ⇒ [<code>Promise.&lt;EntryList&gt;</code>](#EntryList)
    * [.getEntry(entryID)](#module_api.Sdk+getEntry) ⇒ [<code>Promise.&lt;EntryResource&gt;</code>](#EntryResource)
    * [.editEntrySafe(entryID, value)](#module_api.Sdk+editEntrySafe) ⇒ [<code>Promise.&lt;EntryResource&gt;</code>](#EntryResource)
    * [.getSchema(entryID)](#module_api.Sdk+getSchema) ⇒ [<code>Promise.&lt;EntrySchema&gt;</code>](#EntrySchema)
    * [.assets([options])](#module_api.Sdk+assets) ⇒ [<code>Promise.&lt;AssetList&gt;</code>](#AssetList)
    * [.createAsset(options)](#module_api.Sdk+createAsset) ⇒ [<code>Promise.&lt;AssetResource&gt;</code>](#AssetResource)
    * [.deleteAsset(assetID)](#module_api.Sdk+deleteAsset) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.getAsset(assetID)](#module_api.Sdk+getAsset) ⇒ [<code>Promise.&lt;AssetResource&gt;</code>](#AssetResource)
    * [.createEntry(value)](#module_api.Sdk+createEntry) ⇒ [<code>Promise.&lt;EntryResource&gt;</code>](#EntryResource)
    * [.editEntry(entryID, value)](#module_api.Sdk+editEntry) ⇒ [<code>Promise.&lt;EntryResource&gt;</code>](#EntryResource)
    * [.deleteEntry(entryID)](#module_api.Sdk+deleteEntry) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.resourceList([options])](#module_api.Sdk+resourceList) ⇒ [<code>Promise.&lt;ResourceList&gt;</code>](#ResourceList)
    * [.raw([options], [fetchOptions])](#module_api.Sdk+raw) ⇒ <code>Promise.&lt;any&gt;</code>
    * [.model(model)](#module_api.Sdk+model) ⇒
    * [.token(token)](#module_api.Sdk+token) ⇒
    * [.dmShortID(dmShortID)](#module_api.Sdk+dmShortID) ⇒
    * [.dmID(dmID)](#module_api.Sdk+dmID) ⇒
    * [.dm(dmShortID)](#module_api.Sdk+dm) ⇒
    * [.assetGroup(assetGroup)](#module_api.Sdk+assetGroup) ⇒
    * [.assetgroup(assetGroup)](#module_api.Sdk+assetgroup) ⇒
    * [.subdomain(subdomain)](#module_api.Sdk+subdomain) ⇒
    * [.resource(resource)](#module_api.Sdk+resource) ⇒
    * [.route(route)](#module_api.Sdk+route) ⇒
    * [.publicApi()](#module_api.Sdk+publicApi) ⇒
    * [.getDatamanager()](#module_api.Sdk+getDatamanager) ⇒
    * [.dmList([options])](#module_api.Sdk+dmList) ⇒ [<code>Promise.&lt;DatamanagerList&gt;</code>](#DatamanagerList)
    * [.modelList([options])](#module_api.Sdk+modelList) ⇒ [<code>Promise.&lt;ModelList&gt;</code>](#ModelList)

<a name="module_api.Sdk+entries"></a>

#### sdk.entries([options]) ⇒ [<code>Promise.&lt;EntryList&gt;</code>](#EntryList)
<p>Loads entry list. Expects <code>dmShortID</code> / <code>model</code> to be set.
If the model is not public, you also need to provide a <code>token</code>.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> | <p>options for entry list request.</p> |

**Example**  
```js
// public model
const muffins = await sdk("stage").dm("83cc6374").model("muffin").entries()
```
**Example**  
```js
// non-public model
const secrets = await sdk("stage").token(token).dm("83cc6374").model("secret").entries()
```
<a name="module_api.Sdk+getEntry"></a>

#### sdk.getEntry(entryID) ⇒ [<code>Promise.&lt;EntryResource&gt;</code>](#EntryResource)
<p>Loads a single entry. Expects <code>dmShortID</code> / <code>model</code> to be set.
If the model is not public, you also need to provide a <code>token</code>.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  

| Param | Type |
| --- | --- |
| entryID | <code>string</code> | 

**Example**  
```js
const muffin = await sdk("stage").dm("83cc6374").model("muffin").getEntry("1gOtzWvrdq")
```
<a name="module_api.Sdk+editEntrySafe"></a>

#### sdk.editEntrySafe(entryID, value) ⇒ [<code>Promise.&lt;EntryResource&gt;</code>](#EntryResource)
<p>Edits an entry with safe put. Expects <code>dmShortID</code> / <code>model</code> to be set.
Expects a <code>_modified</code> field in the value. Will only update if the entry has not been changed since.
If model PUT is not public, you also need to provide a <code>token</code>.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  

| Param | Type | Description |
| --- | --- | --- |
| entryID | <code>string</code> | <p>id of entry to edit</p> |
| value | <code>object</code> | <p>values to set. undefined fields are ignored</p> |

**Example**  
```js
const entry = await sdk("stage")
 .dm("83cc6374")
 .model("muffin")
 .editEntrySafe("1gOtzWvrdq", { name: "test", _modified: "2020-01-01T00:00:00.000Z"})
```
<a name="module_api.Sdk+getSchema"></a>

#### sdk.getSchema(entryID) ⇒ [<code>Promise.&lt;EntrySchema&gt;</code>](#EntrySchema)
<p>Loads the schema of a model. Expects <code>dmShortID</code> / <code>model</code> to be set.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  

| Param | Type |
| --- | --- |
| entryID | <code>string</code> | 

**Example**  
```js
const muffin = await sdk("stage").dm("83cc6374").model("muffin").getSchema()
```
<a name="module_api.Sdk+assets"></a>

#### sdk.assets([options]) ⇒ [<code>Promise.&lt;AssetList&gt;</code>](#AssetList)
<p>Loads asset list. Expects <code>dmShortID</code> / <code>assetGroup</code> to be set.
If the assetGroup is not public, you also need to provide a <code>token</code>.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> | <p>options for entry list request.</p> |

**Example**  
```js
// public assetGroup
const files = await sdk("stage").dm("83cc6374").assetGroup("avatars").assets()
```
**Example**  
```js
// non-public assetGroup
const files = await sdk("stage").token(token).dm("83cc6374").assetGroup("avatars").assets()
```
<a name="module_api.Sdk+createAsset"></a>

#### sdk.createAsset(options) ⇒ [<code>Promise.&lt;AssetResource&gt;</code>](#AssetResource)
<p>Uploads an asset. Expects <code>dmShortID</code> / <code>assetGroup</code> / <code>file</code> to be set.
If the assetGroup is not public, you also need to provide a <code>token</code>.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | <p>options for entry list request.</p> |

**Example**  
```js
// browser example
document.getElementById("file").addEventListener("input", async (e) => {
  const [file] = e.target.files;
  const asset = await ecadmin.assetgroup("test").createAsset({ file })
});
```
**Example**  
```js
// node example
const buf = fs.readFileSync("venndiagram.png");
const file = new Blob([buf]);
const upload = await sdk("stage")
.dm("83cc6374")
.assetgroup("test")
.createAsset({ file, name: "venndiagram.png" });
```
<a name="module_api.Sdk+deleteAsset"></a>

#### sdk.deleteAsset(assetID) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Deletes an asset. Expects <code>dmShortID</code> / <code>assetGroup</code> / <code>assetID</code> to be set.
You probably also need to provide a <code>token</code>.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  

| Param | Type |
| --- | --- |
| assetID | <code>string</code> | 

**Example**  
```js
await ecadmin.assetgroup("test").deleteAsset('xxxx');
```
<a name="module_api.Sdk+getAsset"></a>

#### sdk.getAsset(assetID) ⇒ [<code>Promise.&lt;AssetResource&gt;</code>](#AssetResource)
<p>Loads a single asset. Expects <code>dmShortID</code> / <code>assetGroup</code> to be set.
If the asset group is not public, you also need to provide a <code>token</code>.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  

| Param | Type |
| --- | --- |
| assetID | <code>string</code> | 

**Example**  
```js
const asset = await sdk("stage").dm("83cc6374").assetgroup("test").getAsset("tP-ZxpZZTGmbPnET-wArAQ")
```
<a name="module_api.Sdk+createEntry"></a>

#### sdk.createEntry(value) ⇒ [<code>Promise.&lt;EntryResource&gt;</code>](#EntryResource)
<p>Creates a new entry. Expects <code>dmShortID</code> / <code>model</code> to be set.
If model POST is not public, you also need to provide a <code>token</code>.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>object</code> | <p>values to set.</p> |

**Example**  
```js
const entry = await sdk("stage").dm("83cc6374").model("muffin").createEntry({ name: 'test' })
```
<a name="module_api.Sdk+editEntry"></a>

#### sdk.editEntry(entryID, value) ⇒ [<code>Promise.&lt;EntryResource&gt;</code>](#EntryResource)
<p>Edits an entry. Expects <code>dmShortID</code> / <code>model</code> to be set.
If model PUT is not public, you also need to provide a <code>token</code>.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  

| Param | Type | Description |
| --- | --- | --- |
| entryID | <code>string</code> | <p>id of entry to edit</p> |
| value | <code>object</code> | <p>values to set. undefined fields are ignored</p> |

**Example**  
```js
const entry = await sdk("stage").dm("83cc6374").model("muffin").editEntry("1gOtzWvrdq", { name: "test" })
```
<a name="module_api.Sdk+deleteEntry"></a>

#### sdk.deleteEntry(entryID) ⇒ <code>Promise.&lt;void&gt;</code>
<p>Deletes an entry. Expects <code>dmShortID</code> / <code>model</code> to be set.
If model DELETE is not public, you also need to provide a <code>token</code>.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  

| Param | Type | Description |
| --- | --- | --- |
| entryID | <code>string</code> | <p>id of entry to delete</p> |

**Example**  
```js
await sdk("stage").dm("83cc6374").model("muffin").deleteEntry("1gOtzWvrdq")
```
<a name="module_api.Sdk+resourceList"></a>

#### sdk.resourceList([options]) ⇒ [<code>Promise.&lt;ResourceList&gt;</code>](#ResourceList)
<p>Fetches resource list. Expects <code>resource</code> to be set. <code>subdomain</code> defaults to &quot;datamanager&quot;.
Fetches <code>https://&lt;subdomain&gt;.entrecode.de/&lt;resource&gt;?_list=true&amp;size=&lt;options.size ?? 25&gt;</code></p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> | <p>options for list request.</p> |

**Example**  
```js
const res = await sdk("stage").resource("template").resourceList()
```
<a name="module_api.Sdk+raw"></a>

#### sdk.raw([options], [fetchOptions]) ⇒ <code>Promise.&lt;any&gt;</code>
<p>Fetches raw route. Expects <code>route</code> to be set. <code>subdomain</code> defaults to &quot;datamanager&quot;.
Fetches <code>https://&lt;subdomain&gt;.entrecode.de/&lt;route&gt;?&lt;options&gt;</code>
Use this when no other fdk method can give you your request.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> | <p>options for list request.</p> |
| [fetchOptions] | <code>object</code> | <p>(optional) options passed to fetch.</p> |

**Example**  
```js
const res = await sdk("stage").route("stats").raw()
```
<a name="module_api.Sdk+model"></a>

#### sdk.model(model) ⇒
<p>Sets the given model to use</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  
**Returns**: <p>Sdk</p>  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>string</code> | <p>name of the model</p> |

<a name="module_api.Sdk+token"></a>

#### sdk.token(token) ⇒
<p>Sets the token to use in requests</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  
**Returns**: <p>Sdk</p>  

| Param | Type |
| --- | --- |
| token | <code>string</code> | 

<a name="module_api.Sdk+dmShortID"></a>

#### sdk.dmShortID(dmShortID) ⇒
<p>Sets the short ID of the datamanager to use</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  
**Returns**: <p>Sdk</p>  

| Param | Type |
| --- | --- |
| dmShortID | <code>string</code> | 

<a name="module_api.Sdk+dmID"></a>

#### sdk.dmID(dmID) ⇒
<p>Sets the (long) ID of the datamanager to use</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  
**Returns**: <p>Sdk</p>  

| Param | Type |
| --- | --- |
| dmID | <code>string</code> | 

<a name="module_api.Sdk+dm"></a>

#### sdk.dm(dmShortID) ⇒
<p>Sets the short ID of the datamanager to use. Alias for <code>dmShortID</code></p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  
**Returns**: <p>Sdk</p>  

| Param | Type |
| --- | --- |
| dmShortID | <code>string</code> | 

<a name="module_api.Sdk+assetGroup"></a>

#### sdk.assetGroup(assetGroup) ⇒
<p>Sets the name of the asset group to use.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  
**Returns**: <p>Sdk</p>  

| Param | Type | Description |
| --- | --- | --- |
| assetGroup | <code>string</code> | <p>name of the asset group</p> |

<a name="module_api.Sdk+assetgroup"></a>

#### sdk.assetgroup(assetGroup) ⇒
<p>Sets the name of the asset group to use. Alias for <code>assetGroup</code></p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  
**Returns**: <p>Sdk</p>  

| Param | Type | Description |
| --- | --- | --- |
| assetGroup | <code>string</code> | <p>name of the asset group</p> |

<a name="module_api.Sdk+subdomain"></a>

#### sdk.subdomain(subdomain) ⇒
<p>Sets the subdomain to use.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  
**Returns**: <p>Sdk</p>  

| Param | Type | Description |
| --- | --- | --- |
| subdomain | <code>string</code> | <p>subdomain</p> |

<a name="module_api.Sdk+resource"></a>

#### sdk.resource(resource) ⇒
<p>Sets the name of the resource to use.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  
**Returns**: <p>Sdk</p>  

| Param | Type | Description |
| --- | --- | --- |
| resource | <code>string</code> | <p>name of the resource</p> |

<a name="module_api.Sdk+route"></a>

#### sdk.route(route) ⇒
<p>Sets the route to use.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  
**Returns**: <p>Sdk</p>  

| Param | Type | Description |
| --- | --- | --- |
| route | <code>string</code> | <p>route</p> |

<a name="module_api.Sdk+publicApi"></a>

#### sdk.publicApi() ⇒
<p>Returns the public api root endpoint. Expects dmShortID to be set.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  
**Returns**: <p>any</p>  
<a name="module_api.Sdk+getDatamanager"></a>

#### sdk.getDatamanager() ⇒
<p>Loads a DatamanagerResource by its long id. Requires token.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  
**Returns**: <p>any</p>  
<a name="module_api.Sdk+dmList"></a>

#### sdk.dmList([options]) ⇒ [<code>Promise.&lt;DatamanagerList&gt;</code>](#DatamanagerList)
<p>Loads datamanager list. Make sure to provide an ec.admin <code>token</code> intercept one.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> | <p>options for entry list request.</p> |

**Example**  
```js
const dms = await sdk("stage").dmList()
```
<a name="module_api.Sdk+modelList"></a>

#### sdk.modelList([options]) ⇒ [<code>Promise.&lt;ModelList&gt;</code>](#ModelList)
<p>Loads model list. Expects dmID to be set. Make sure to provide an ec.admin <code>token</code> intercept one.</p>

**Kind**: instance method of [<code>Sdk</code>](#module_api.Sdk)  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> | <p>options for entry list request.</p> |

**Example**  
```js
const models = await sdk("stage").dmID("254a03f1-cb76-4f1e-a52a-bbd4180ca10c").modelList()
```
