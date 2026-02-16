---
name: ec-fdk
description: Use when interacting with entrecode APIs, managing datamanagers, models, entries, assets, roles, accounts, or any ec.fdk CLI operations. Use when user mentions ec.fdk, entrecode, datamanager, shortID, or wants to open ec.editor4 URLs.
---

# ec.fdk CLI

Use the `ec.fdk` CLI + `jq` for all entrecode API interactions. Always pipe output through `jq` to minimize tokens in context.

## Entry Commands (require `--dm`, `--model`)

```sh
# List entries
ec.fdk entryList -d <shortID> -m <model> | jq '.items'

# List entries sorted by newest first
ec.fdk entryList -d <shortID> -m <model> --sort=-_created -s 1

# List entries with filters
ec.fdk entryList -d <shortID> -m <model> -f name~=chocolate -f createdFrom=2024-01-01

# List entries with only specific fields (reduces response size)
ec.fdk entryList -d <shortID> -m <model> --fields name,created,id

# Filter for null / not null
ec.fdk entryList -d <shortID> -m <model> -f "photo="    # photo is null/empty
ec.fdk entryList -d <shortID> -m <model> -f "photo!="   # photo is not null/empty

# Get a single entry
ec.fdk getEntry -d <shortID> -m <model> -i <entryID>

# Get model schema (returns field names as top-level keys)
ec.fdk getSchema -d <shortID> -m <model> | jq 'keys'

# Create an entry
ec.fdk createEntry -d <shortID> -m <model> --data '{"name":"new","value":10}'

# Create via stdin pipe
echo '{"name":"piped"}' | ec.fdk createEntry -d <shortID> -m <model>

# Edit an entry
ec.fdk editEntry -d <shortID> -m <model> -i <entryID> --data '{"name":"updated"}'

# Delete an entry
ec.fdk deleteEntry -d <shortID> -m <model> -i <entryID>
```

## Datamanager Commands

```sh
# Find a datamanager's shortID
ec.fdk dmList -f title=HO | jq '.items[0].shortID'

# Find a datamanager's UUID
ec.fdk dmList -f title=HO | jq '.items[0].dataManagerID'

# Get a single datamanager
ec.fdk getDatamanager --id <dataManagerID>

# Create a datamanager
ec.fdk createDatamanager --data '{"title":"My DM","config":{}}'

# editDatamanager is a full PUT — pass the complete resource, not just changed fields.
ec.fdk getDatamanager --id <dataManagerID> \
  | jq '.title = "New Title"' \
  | ec.fdk editDatamanager --id <dataManagerID>

# Delete a datamanager
ec.fdk deleteDatamanager --id <dataManagerID>

# Datamanager stats
ec.fdk getStats
```

## Model Commands (`--id` = DM UUID)

```sh
# List models of a datamanager
ec.fdk modelList --id <dataManagerID> | jq '[.items[].title]'

# Search models by name
ec.fdk modelList --id <dataManagerID> -f title~=muffin | jq '[.items[].title]'

# Create a model
ec.fdk createModel --id <dataManagerID> --data '{"title":"article","locales":[],"fields":[]}'

# Edit a model
ec.fdk editModel --id <dataManagerID> --rid <modelID> --data '{"title":"renamed","locales":[],"fields":[]}'

# Delete a model
ec.fdk deleteModel --id <dataManagerID> --rid <modelID>
```

## Generic Resource Commands

For any resource type not covered by specific commands, use `resource*`:

```sh
# List any resource type
ec.fdk resourceList --resource template -s 5
ec.fdk resourceList --resource client --subdomain accounts

# Get / edit / delete (use -f to identify the resource)
ec.fdk resourceGet --resource model -f dataManagerID=<dataManagerID> -f modelID=<modelID>
ec.fdk resourceGet --resource group --subdomain accounts -f groupID=<groupID>
ec.fdk resourceEdit --resource invite --subdomain accounts -f invite=<inviteID> --data '{"email":"user@example.com","permissions":["dm-read"],"groups":[]}'
ec.fdk resourceDelete --resource role -f dataManagerID=<dataManagerID> -f roleID=<roleID>
```

### `resourceList` Resource Types

| `--resource` | `--subdomain` | Typical filters |
| --- | --- | --- |
| `model` | — | `-f dataManagerID=<dataManagerID>` |
| `assetgroup` | — | `-f dataManagerID=<dataManagerID>` |
| `client` | — | `-f dataManagerID=<dataManagerID>` |
| `role` | — | `-f dataManagerID=<dataManagerID>` |
| `account` | — | `-f dataManagerID=<dataManagerID>` |
| `template` | — | — |
| `tag` | — | `-f dataManagerID=<dataManagerID>` |
| `account` | `accounts` | — |
| `client` | `accounts` | — |
| `group` | `accounts` | — |
| `invite` | `accounts` | — |
| `account/tokens` | `accounts` | `-f accountID=<accountID>` |

## Other Admin Commands

```sh
# Login via browser OIDC (stores token in ~/.ec-fdk/auth.json)
ec.fdk login -e stage

# Login via email/password prompt
ec.fdk login -e stage --password

# Logout (removes stored token)
ec.fdk logout -e stage

# Show current user
ec.fdk whoami -e stage

# dm-history (requires shortID filter)
ec.fdk getHistory -f shortID=<shortID> -s 10

# Template
ec.fdk createTemplate --data '{"name":"My Template","collection":{"id":"<collectionID>","name":"my-collection","order":[],"requests":[]}}'

# Asset group
ec.fdk createAssetGroup --id <dataManagerID> --data '{"assetGroupID":"photos"}'
ec.fdk editAssetGroup --id <dataManagerID> --rid <assetGroup> --data '{"public":true}'

# Assets (--dm = short ID, --assetgroup required)
ec.fdk assetList --dm <shortID> --assetgroup <assetGroup> | jq '.items'
ec.fdk getAsset --dm <shortID> --assetgroup <assetGroup> --rid <assetID>
ec.fdk createAsset --dm <shortID> --assetgroup <assetGroup> --file ./photo.jpg
ec.fdk createAsset --dm <shortID> --assetgroup <assetGroup> --file ./a.jpg --file ./b.png
ec.fdk editAsset --dm <shortID> --assetgroup <assetGroup> --rid <assetID> --data '{"title":"sunset"}'
ec.fdk deleteAsset --dm <shortID> --assetgroup <assetGroup> --rid <assetID>

# DM client
ec.fdk editDmClient --id <dataManagerID> --rid <clientID> --data '{"callbackURL":"https://example.com/cb"}'

# Role
ec.fdk createRole --id <dataManagerID> --data '{"name":"editor"}'
ec.fdk editRole --id <dataManagerID> --rid <roleID> --data '{"name":"admin"}'
ec.fdk deleteRole --id <dataManagerID> --rid <roleID>

# DM account
ec.fdk editDmAccount --id <dataManagerID> --account-id <accountID> --data '{"email":"user@example.com"}'
ec.fdk deleteDmAccount --id <dataManagerID> --account-id <accountID>

# Account client (editAccountClient is a full PUT — clientID is required in the body)
ec.fdk createAccountClient --data '{"clientID":"my-client","callbackURL":"https://example.com/cb"}'
ec.fdk deleteAccountClient --rid <clientID>

# Group
ec.fdk createGroup --data '{"name":"devs"}'
ec.fdk editGroup --rid <groupID> --data '{"name":"developers"}'
ec.fdk deleteGroup --rid <groupID>

# Invite (editInvite is a full PUT — pass the complete resource)
ec.fdk createInvite --data '{"email":"user@example.com"}'
ec.fdk editInvite --rid <inviteID> --data '{"email":"user@example.com","permissions":["dm-read"],"groups":[]}'
ec.fdk deleteInvite --rid <inviteID>

# Account
ec.fdk editAccount --account-id <accountID> --data '{"email":"user@example.com"}'

# Tokens
ec.fdk listTokens --account-id <accountID>
ec.fdk createToken --account-id <accountID>
ec.fdk deleteToken --account-id <accountID> --rid <tokenID>
```

## Quick Reference

| Command | Required flags |
| --- | --- |
| **Entry** (require `--dm`, `--model`) | |
| `entryList` | `--dm`, `--model` |
| `getEntry` | `--dm`, `--model`, `--id` |
| `createEntry` | `--dm`, `--model`, `--data` |
| `editEntry` | `--dm`, `--model`, `--id`, `--data` |
| `deleteEntry` | `--dm`, `--model`, `--id` |
| `getSchema` | `--dm`, `--model` |
| **Datamanager** (`--id` = DM UUID) | |
| `dmList` | — |
| `getDatamanager` | `--id` |
| `createDatamanager` | `--data` |
| `editDatamanager` | `--id`, `--data` (full PUT) |
| `deleteDatamanager` | `--id` |
| `getStats` | — |
| **Model** (`--id` = DM UUID) | |
| `modelList` | `--id` |
| `createModel` | `--id`, `--data` |
| `editModel` | `--id`, `--rid`, `--data` |
| `deleteModel` | `--id`, `--rid` |
| **Assets** (`--dm` = short ID) | |
| `assetList` | `--dm`, `--assetgroup` |
| `getAsset` | `--dm`, `--assetgroup`, `--rid` |
| `createAsset` | `--dm`, `--assetgroup`, `--file` (repeatable) |
| `editAsset` | `--dm`, `--assetgroup`, `--rid`, `--data` |
| `deleteAsset` | `--dm`, `--assetgroup`, `--rid` |
| **Generic resource** | |
| `resourceList` | `--resource` |
| `resourceGet` | `--resource`, `-f` filters |
| `resourceEdit` | `--resource`, `-f` filters, `--data` |
| `resourceDelete` | `--resource`, `-f` filters |
| **Auth** | |
| `login` | — (add `--password` for email/password prompt) |
| `logout` | — |
| `whoami` | — |
| `install-skill` | — (optional `--dir <path>`) |
| `update` | — |

## Options

| Option | Description |
| --- | --- |
| `-e, --env` | `stage` (default) or `live` |
| `-d, --dm` | DataManager short ID |
| `-m, --model` | Model name |
| `-i, --id` | Entry ID or DataManager UUID (context-dependent) |
| `--rid` | Resource ID (model, role, client, asset group, invite, token, etc.) |
| `--account-id` | Account ID |
| `--assetgroup` | Asset group name (for asset commands) |
| `--file` | File path for `createAsset` (repeatable for multiple files) |
| `--resource` | Resource name (for `resource*` commands) |
| `--subdomain` | Subdomain override (for `resource*` commands, default: `datamanager`) |
| `--data` | JSON data (via flag or stdin pipe) |
| `-s, --size` | Page size |
| `-p, --page` | Page number |
| `--sort` | Sort field (system fields: `_created`, `_modified`) |
| `--fields` | Only return specific fields (comma-separated) |
| `-f, --filter` | Repeatable filter (`key=value`) |
| `--password` | Use email/password login instead of browser OIDC |
| `--dir` | Target directory for `install-skill` (default: `~/.claude`) |
| `--raw` | Include `_links` and `_embedded` |
| `--md` | Output as markdown table |

## Filter Suffixes

Filters map to entrecode filter query params:

- `~` — search (contains): `-f name~=chocolate`
- `From` — greater than / after: `-f createdFrom=2024-01-01`
- `To` — less than / before: `-f createdTo=2025-01-01`
- (none) — exact match: `-f title=HO`
- `=` (empty value) — is null/empty: `-f "photo="`
- `!=` (empty value) — is not null/empty: `-f "photo!="`

## Common Mistakes

- **Using `--id` for entry commands** — entry commands need `--dm` (shortID) + `--model`, not `--id` for the DM
- **Partial PUT on editDatamanager/editAccountClient/editInvite** — these are full PUT operations, pass the complete resource
- **Forgetting `jq`** — always pipe through `jq` to keep output concise
- **Wrong ID type** — `--dm` takes shortID, `--id` takes UUID for datamanager commands
- **Using DM title as shortID** — when looking up a datamanager by title, always fetch both `shortID` and `dataManagerID` (UUID) in the first call, since entry commands need the shortID and model commands need the UUID. Example: `ec.fdk dmList -f title=HO | jq '.items[0] | {shortID, dataManagerID}'`
- **Filtering fields with `jq` instead of `--fields`** — always use `--fields` to limit returned fields server-side first. This prevents large nested JSON fields (e.g. JSON config fields) from being transferred at all. Only use `jq` afterwards to clean up the always-present system fields (`_id`, `_created`, `_modified`, etc.).

## ec.editor4 URLs

Base URLs:
- Stage: `https://e4.cachena.entrecode.de`
- Live: `https://e4.entrecode.de`

When the user asks to "open" a resource, output the full editor URL. Use `open <url>` via Bash to open it in the browser. Default to stage unless the user specifies live.

| Resource | URL pattern |
|---|---|
| Datamanager | `/d/{shortID}` |
| Model list | `/d/{shortID}/model` |
| Model entries | `/d/{shortID}/model/{model}/entry` |
| Model settings | `/d/{shortID}/model/{model}/settings` |
| Create entry | `/d/{shortID}/model/{model}/entry/create` |
| Entry | `/d/{shortID}/model/{model}/entry/{entryID}` |
| Entry history | `/d/{shortID}/model/{model}/entry/{entryID}/history` |
| Asset groups | `/d/{shortID}/assetgroup` |
| Asset group | `/d/{shortID}/assetgroup/{assetgroup}` |
| Asset | `/d/{shortID}/assetgroup/{assetgroup}/asset/{assetID}` |
| Roles | `/d/{shortID}/roles` |
| Role | `/d/{shortID}/roles/{roleID}` |
| Clients | `/d/{shortID}/clients` |
| DM Accounts | `/d/{shortID}/accounts` |
| DM Graph | `/d/{shortID}/graph` |
| DM Settings | `/d/{shortID}/settings` |
| Accounts | `/accounts` |
| Account | `/accounts/{accountID}` |
| Apps | `/apps` |

## Notes

- Prefer `--fields` over filtering fields with `jq` — `--fields` reduces the response on the server side
- Status/error messages go to stderr, data goes to stdout — piping always works cleanly
- `editDatamanager`, `editAccountClient`, and `editInvite` are full PUT operations — pass the complete resource
- `--data` accepts JSON via flag or stdin pipe (e.g. `echo '{}' | ec.fdk createEntry ...`)
- **Keeping skill files in sync** — when updating this skill file, always apply the same changes to the source copy at `~/entrecode/ec.fdk/packages/ec.fdk/skill/SKILL.md`
- **Publishing after updates** — after updating the skill file, prompt the user to run `cd ~/entrecode/ec.fdk/packages/ec.fdk && ./publish.sh` to publish the changes. Do not run this command yourself.
