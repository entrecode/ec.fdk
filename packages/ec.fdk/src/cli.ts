import { parseArgs } from "node:util";
import { createRequire } from "node:module";
import { Fdk } from "./lib/api";
import { fileStorageAdapter } from "./lib/cli-storage";
import { prompt, promptPassword } from "./lib/cli-prompt";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const HELP = `ec.fdk <command> [options]

Commands:
  login                 Login with ec credentials (interactive prompt)

  Entry commands (require --dm, --model):
    entryList             List entries
    getEntry              Get a single entry (--id)
    createEntry           Create an entry (--data)
    editEntry             Edit an entry (--id, --data)
    deleteEntry           Delete an entry (--id)
    getSchema             Get model schema

  Admin list commands:
    dmList                List datamanagers
    modelList             List models (--id = DM UUID)
    getDatamanager        Get a datamanager (--id = DM UUID)
    resourceList          List resources (--resource, optional --subdomain)
    getStats              Get datamanager stats
    getHistory            Get dm-history entries

  Datamanager CRUD:
    createDatamanager     Create a datamanager (--data)
    editDatamanager       Edit a datamanager (--id, --data)
    deleteDatamanager     Delete a datamanager (--id)

  Model CRUD (--id = DM UUID):
    createModel           Create a model (--data)
    editModel             Edit a model (--rid, --data)
    deleteModel           Delete a model (--rid)

  Template CRUD:
    createTemplate        Create a template (--data)
    editTemplate          Edit a template (--rid, --data)
    deleteTemplate        Delete a template (--rid)

  Asset Group (--id = DM UUID):
    createAssetGroup      Create an asset group (--data)
    editAssetGroup        Edit an asset group (--rid, --data)

  Asset metadata:
    editAsset             Edit asset metadata (--dm, --assetgroup, --rid, --data)

  DM Client (--id = DM UUID):
    editDmClient          Edit a DM client (--rid, --data)

  Role CRUD (--id = DM UUID):
    createRole            Create a role (--data)
    editRole              Edit a role (--rid, --data)
    deleteRole            Delete a role (--rid)

  DM Account (--id = DM UUID):
    editDmAccount         Edit a DM account (--account-id, --data)
    deleteDmAccount       Delete a DM account (--account-id)

  Account Client:
    createAccountClient   Create an account client (--data)
    editAccountClient     Edit an account client (--rid, --data)
    deleteAccountClient   Delete an account client (--rid)

  Group:
    createGroup           Create a group (--data)
    editGroup             Edit a group (--rid, --data)
    deleteGroup           Delete a group (--rid)

  Invite:
    createInvite          Create an invite (--data)
    editInvite            Edit an invite (--rid, --data)
    deleteInvite          Delete an invite (--rid)

  Account:
    editAccount           Edit an account (--account-id, --data)

  Tokens:
    listTokens            List tokens (--account-id)
    createToken           Create a token (--account-id)
    deleteToken           Delete a token (--account-id, --rid)

Options:
  -e, --env <env>       Environment: stage|live (default: stage)
  -d, --dm <shortID>    DataManager short ID
  -m, --model <name>    Model name
  -i, --id <id>         Entry ID or DataManager UUID (context-dependent)
  --rid <id>            Resource ID (model, template, role, client, asset group, etc.)
  --account-id <id>     Account ID
  --assetgroup <name>   Asset group name (for editAsset)
  --resource <name>     Resource name (for resourceList)
  --subdomain <name>    Subdomain override (for resourceList)
  --data <json>         JSON data (for create/edit, or pipe via stdin)
  -s, --size <n>        Page size for list
  -p, --page <n>        Page number for list
  --sort <field>        Sort field for list
  -f, --filter <k=v>   Filter for list (repeatable, e.g. -f title~=hello -f ageFrom=5)
  --raw                 Include _links and _embedded in output
  --md                  Output entries as readable markdown
  -v, --version         Show version
  -h, --help            Show help`;

function parseFilters(filters: string[]): Record<string, string> {
  return Object.fromEntries(
    filters.map((f) => {
      const idx = f.indexOf("=");
      if (idx === -1) error(`Invalid filter: "${f}" (expected key=value)`);
      return [f.slice(0, idx), f.slice(idx + 1)];
    })
  );
}

function error(msg: string): never {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(2);
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk: string) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

async function getJsonData(dataArg?: string): Promise<object> {
  if (dataArg) {
    try {
      return JSON.parse(dataArg);
    } catch {
      error("--data must be valid JSON");
    }
  }
  if (!process.stdin.isTTY) {
    const raw = await readStdin();
    if (!raw.trim()) error("No data provided via stdin");
    try {
      return JSON.parse(raw);
    } catch {
      error("Stdin must be valid JSON");
    }
  }
  error("Provide --data or pipe JSON via stdin");
}

function cleanItem(item: any) {
  if (!item || typeof item !== "object") return item;
  const { _links, _embedded, ...rest } = item;
  return rest;
}

function cleanResult(result: any) {
  if (!result || typeof result !== "object") return result;
  if (Array.isArray(result.items)) {
    return { ...result, items: result.items.map(cleanItem) };
  }
  return cleanItem(result);
}

const MAX_CELL = 40;

function truncate(s: string): string {
  return s.length > MAX_CELL ? s.slice(0, MAX_CELL - 2) + ".." : s;
}

function cell(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return truncate(JSON.stringify(val));
  return truncate(String(val));
}

function entryKeys(entry: Record<string, any>): string[] {
  return Object.keys(entry).filter((k) => !k.startsWith("_"));
}

function padRow(cells: string[], widths: number[]): string {
  return "| " + cells.map((c, i) => c.padEnd(widths[i])).join(" | ") + " |";
}

function entryToMd(entry: Record<string, any>): string {
  const keys = entryKeys(entry);
  const vals = keys.map((k) => cell(entry[k]));
  const w0 = Math.max(5, ...keys.map((k) => k.length));
  const w1 = Math.max(5, ...vals.map((v) => v.length));
  const widths = [w0, w1];
  const header = padRow(["Field", "Value"], widths);
  const sep = "| " + widths.map((w) => "-".repeat(w)).join(" | ") + " |";
  const rows = keys.map((k, i) => padRow([k, vals[i]], widths));
  return `${header}\n${sep}\n${rows.join("\n")}`;
}

function entryListToMd(result: { count: number; total: number; items: any[] }): string {
  if (!result.items.length) return "No entries found.";
  const keys = entryKeys(result.items[0]);
  const grid = result.items.map((e) => keys.map((k) => cell(e[k])));
  const widths = keys.map((k, i) =>
    Math.max(k.length, ...grid.map((row) => row[i].length))
  );
  const header = padRow(keys, widths);
  const sep = "| " + widths.map((w) => "-".repeat(w)).join(" | ") + " |";
  const rows = grid.map((r) => padRow(r, widths));
  return `${header}\n${sep}\n${rows.join("\n")}\n\n${result.items.length} of ${result.total} entries`;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      env: { type: "string", short: "e", default: "stage" },
      dm: { type: "string", short: "d" },
      model: { type: "string", short: "m" },
      id: { type: "string", short: "i" },
      data: { type: "string" },
      size: { type: "string", short: "s" },
      page: { type: "string", short: "p" },
      sort: { type: "string" },
      filter: { type: "string", short: "f", multiple: true, default: [] },
      rid: { type: "string" },
      "account-id": { type: "string" },
      assetgroup: { type: "string" },
      resource: { type: "string" },
      subdomain: { type: "string" },
      raw: { type: "boolean", default: false },
      md: { type: "boolean", default: false },
      version: { type: "boolean", short: "v" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.version) {
    console.log(version);
    process.exit(0);
  }

  if (values.help || positionals.length === 0) {
    console.log(HELP);
    process.exit(0);
  }

  const command = positionals[0];
  const env = values.env as "stage" | "live";

  if (env !== "stage" && env !== "live") {
    error('--env must be "stage" or "live"');
  }

  const sdk = new Fdk({ env, storageAdapter: fileStorageAdapter });

  if (command === "login") {
    const email = await prompt("Email: ");
    const password = await promptPassword("Password: ");
    try {
      await sdk.loginEc({ email, password });
      process.stderr.write(`Logged in to ${env} successfully.\n`);
    } catch (e: any) {
      process.stderr.write(`Login failed: ${e.message}\n`);
      process.exit(1);
    }
    return;
  }

  try {
    let result: any;

    const listOpts = (): Record<string, any> => {
      const options: Record<string, any> = { ...parseFilters(values.filter as string[]) };
      if (values.size) options.size = Number(values.size);
      if (values.page) options.page = Number(values.page);
      if (values.sort) options.sort = [values.sort];
      return options;
    };

    switch (command) {
      // --- Admin list commands ---
      case "dmList": {
        result = await sdk.dmList(listOpts());
        if (!values.raw) result = cleanResult(result);
        break;
      }
      case "modelList": {
        if (!values.id) error("--id (datamanager UUID) is required for modelList");
        result = await sdk.dmID(values.id).modelList(listOpts());
        if (!values.raw) result = cleanResult(result);
        break;
      }
      case "getDatamanager": {
        if (!values.id) error("--id (datamanager UUID) is required for getDatamanager");
        result = await sdk.getDatamanager(values.id);
        if (!values.raw) result = cleanResult(result);
        break;
      }
      case "resourceList": {
        if (!values.resource) error("--resource is required for resourceList");
        let chain = sdk.resource(values.resource);
        if (values.subdomain) chain = chain.subdomain(values.subdomain);
        result = await chain.resourceList(listOpts());
        if (!values.raw) result = cleanResult(result);
        break;
      }
      case "getStats": {
        result = await sdk.getStats(listOpts());
        break;
      }
      case "getHistory": {
        result = await sdk.getHistory(listOpts());
        break;
      }

      // --- Entry commands ---
      case "entryList":
      case "getEntry":
      case "createEntry":
      case "editEntry":
      case "deleteEntry":
      case "getSchema": {
        if (!values.dm) error("--dm is required");
        if (!values.model) error("--model is required");
        const entryChain = sdk.dm(values.dm).model(values.model).clean(!values.raw);

        switch (command) {
          case "entryList": {
            result = await entryChain.entryList(listOpts());
            break;
          }
          case "getEntry": {
            if (!values.id) error("--id is required for getEntry");
            result = await entryChain.getEntry(values.id);
            break;
          }
          case "createEntry": {
            const data = await getJsonData(values.data);
            result = await entryChain.createEntry(data);
            break;
          }
          case "editEntry": {
            if (!values.id) error("--id is required for editEntry");
            const data = await getJsonData(values.data);
            result = await entryChain.editEntry(values.id, data);
            break;
          }
          case "deleteEntry": {
            if (!values.id) error("--id is required for deleteEntry");
            await entryChain.deleteEntry(values.id);
            process.stderr.write("Entry deleted.\n");
            return;
          }
          case "getSchema": {
            result = await entryChain.getSchema();
            break;
          }
        }
        break;
      }

      // --- Datamanager CRUD ---
      case "createDatamanager": {
        const data = await getJsonData(values.data);
        result = await sdk.createDatamanager(data);
        break;
      }
      case "editDatamanager": {
        if (!values.id) error("--id (datamanager UUID) is required for editDatamanager");
        const data = await getJsonData(values.data);
        result = await sdk.editDatamanager(values.id, data);
        break;
      }
      case "deleteDatamanager": {
        if (!values.id) error("--id (datamanager UUID) is required for deleteDatamanager");
        await sdk.deleteDatamanager(values.id);
        process.stderr.write("Datamanager deleted.\n");
        return;
      }

      // --- Model CRUD ---
      case "createModel": {
        if (!values.id) error("--id (datamanager UUID) is required for createModel");
        const data = await getJsonData(values.data);
        result = await sdk.dmID(values.id).createModel(data);
        break;
      }
      case "editModel": {
        if (!values.id) error("--id (datamanager UUID) is required for editModel");
        if (!values.rid) error("--rid (model ID) is required for editModel");
        const data = await getJsonData(values.data);
        result = await sdk.dmID(values.id).editModel(values.rid, data);
        break;
      }
      case "deleteModel": {
        if (!values.id) error("--id (datamanager UUID) is required for deleteModel");
        if (!values.rid) error("--rid (model ID) is required for deleteModel");
        await sdk.dmID(values.id).deleteModel(values.rid);
        process.stderr.write("Model deleted.\n");
        return;
      }

      // --- Template CRUD ---
      case "createTemplate": {
        const data = await getJsonData(values.data);
        result = await sdk.createTemplate(data);
        break;
      }
      case "editTemplate": {
        if (!values.rid) error("--rid (template ID) is required for editTemplate");
        const data = await getJsonData(values.data);
        result = await sdk.editTemplate(values.rid, data);
        break;
      }
      case "deleteTemplate": {
        if (!values.rid) error("--rid (template ID) is required for deleteTemplate");
        await sdk.deleteTemplate(values.rid);
        process.stderr.write("Template deleted.\n");
        return;
      }

      // --- Asset Group ---
      case "createAssetGroup": {
        if (!values.id) error("--id (datamanager UUID) is required for createAssetGroup");
        const data = await getJsonData(values.data);
        result = await sdk.dmID(values.id).createAssetGroup(data);
        break;
      }
      case "editAssetGroup": {
        if (!values.id) error("--id (datamanager UUID) is required for editAssetGroup");
        if (!values.rid) error("--rid (asset group ID) is required for editAssetGroup");
        const data = await getJsonData(values.data);
        result = await sdk.dmID(values.id).editAssetGroup(values.rid, data);
        break;
      }

      // --- Asset metadata ---
      case "editAsset": {
        if (!values.dm) error("--dm (short ID) is required for editAsset");
        if (!values.assetgroup) error("--assetgroup is required for editAsset");
        if (!values.rid) error("--rid (asset ID) is required for editAsset");
        const data = await getJsonData(values.data);
        result = await sdk.dm(values.dm).assetGroup(values.assetgroup).editAsset(values.rid, data);
        break;
      }

      // --- DM Client ---
      case "editDmClient": {
        if (!values.id) error("--id (datamanager UUID) is required for editDmClient");
        if (!values.rid) error("--rid (client ID) is required for editDmClient");
        const data = await getJsonData(values.data);
        result = await sdk.dmID(values.id).editDmClient(values.rid, data);
        break;
      }

      // --- Role CRUD ---
      case "createRole": {
        if (!values.id) error("--id (datamanager UUID) is required for createRole");
        const data = await getJsonData(values.data);
        result = await sdk.dmID(values.id).createRole(data);
        break;
      }
      case "editRole": {
        if (!values.id) error("--id (datamanager UUID) is required for editRole");
        if (!values.rid) error("--rid (role ID) is required for editRole");
        const data = await getJsonData(values.data);
        result = await sdk.dmID(values.id).editRole(values.rid, data);
        break;
      }
      case "deleteRole": {
        if (!values.id) error("--id (datamanager UUID) is required for deleteRole");
        if (!values.rid) error("--rid (role ID) is required for deleteRole");
        await sdk.dmID(values.id).deleteRole(values.rid);
        process.stderr.write("Role deleted.\n");
        return;
      }

      // --- DM Account ---
      case "editDmAccount": {
        if (!values.id) error("--id (datamanager UUID) is required for editDmAccount");
        if (!values["account-id"]) error("--account-id is required for editDmAccount");
        const data = await getJsonData(values.data);
        result = await sdk.dmID(values.id).editDmAccount(values["account-id"], data);
        break;
      }
      case "deleteDmAccount": {
        if (!values.id) error("--id (datamanager UUID) is required for deleteDmAccount");
        if (!values["account-id"]) error("--account-id is required for deleteDmAccount");
        await sdk.dmID(values.id).deleteDmAccount(values["account-id"]);
        process.stderr.write("DM account deleted.\n");
        return;
      }

      // --- Account Client ---
      case "createAccountClient": {
        const data = await getJsonData(values.data);
        result = await sdk.createAccountClient(data);
        break;
      }
      case "editAccountClient": {
        if (!values.rid) error("--rid (client ID) is required for editAccountClient");
        const data = await getJsonData(values.data);
        result = await sdk.editAccountClient(values.rid, data);
        break;
      }
      case "deleteAccountClient": {
        if (!values.rid) error("--rid (client ID) is required for deleteAccountClient");
        await sdk.deleteAccountClient(values.rid);
        process.stderr.write("Account client deleted.\n");
        return;
      }

      // --- Group ---
      case "createGroup": {
        const data = await getJsonData(values.data);
        result = await sdk.createGroup(data);
        break;
      }
      case "editGroup": {
        if (!values.rid) error("--rid (group ID) is required for editGroup");
        const data = await getJsonData(values.data);
        result = await sdk.editGroup(values.rid, data);
        break;
      }
      case "deleteGroup": {
        if (!values.rid) error("--rid (group ID) is required for deleteGroup");
        await sdk.deleteGroup(values.rid);
        process.stderr.write("Group deleted.\n");
        return;
      }

      // --- Invite ---
      case "createInvite": {
        const data = await getJsonData(values.data);
        result = await sdk.createInvite(data);
        break;
      }
      case "editInvite": {
        if (!values.rid) error("--rid (invite ID) is required for editInvite");
        const data = await getJsonData(values.data);
        result = await sdk.editInvite(values.rid, data);
        break;
      }
      case "deleteInvite": {
        if (!values.rid) error("--rid (invite ID) is required for deleteInvite");
        await sdk.deleteInvite(values.rid);
        process.stderr.write("Invite deleted.\n");
        return;
      }

      // --- Account ---
      case "editAccount": {
        if (!values["account-id"]) error("--account-id is required for editAccount");
        const data = await getJsonData(values.data);
        result = await sdk.editAccount(values["account-id"], data);
        break;
      }

      // --- Tokens ---
      case "listTokens": {
        if (!values["account-id"]) error("--account-id is required for listTokens");
        result = await sdk.listTokens(values["account-id"]);
        break;
      }
      case "createToken": {
        if (!values["account-id"]) error("--account-id is required for createToken");
        result = await sdk.createToken(values["account-id"]);
        break;
      }
      case "deleteToken": {
        if (!values["account-id"]) error("--account-id is required for deleteToken");
        if (!values.rid) error("--rid (access token ID) is required for deleteToken");
        await sdk.deleteToken(values["account-id"], values.rid);
        process.stderr.write("Token deleted.\n");
        return;
      }

      default:
        error(`Unknown command: ${command}`);
    }

    if (values.md && result && typeof result === "object") {
      if (Array.isArray(result.items)) {
        process.stdout.write(entryListToMd(result) + "\n");
      } else {
        process.stdout.write(entryToMd(result) + "\n");
      }
    } else {
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    }
  } catch (e: any) {
    process.stderr.write(`${e.message}\n`);
    process.exit(1);
  }
}

main();
