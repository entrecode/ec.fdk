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
  dmList                List datamanagers
  modelList             List models of a datamanager
  getDatamanager        Get a single datamanager
  entryList             List entries
  getEntry              Get a single entry
  createEntry           Create an entry
  editEntry             Edit an entry
  deleteEntry           Delete an entry
  getSchema             Get model schema

Options:
  -e, --env <env>       Environment: stage|live (default: stage)
  -d, --dm <shortID>    DataManager short ID
  -m, --model <name>    Model name
  -i, --id <id>         Entry ID or DataManager UUID (context-dependent)
  --data <json>         JSON data (for create/edit, or pipe via stdin)
  -s, --size <n>        Page size for list
  -p, --page <n>        Page number for list
  --sort <field>        Sort field for list
  --raw                 Include _links and _embedded in output
  --md                  Output entries as readable markdown
  -v, --version         Show version
  -h, --help            Show help`;

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

    switch (command) {
      case "dmList": {
        const options: Record<string, any> = {};
        if (values.size) options.size = Number(values.size);
        if (values.page) options.page = Number(values.page);
        result = await sdk.dmList(options);
        if (!values.raw) result = cleanResult(result);
        break;
      }
      case "modelList": {
        if (!values.id) error("--id (datamanager UUID) is required for modelList");
        const options: Record<string, any> = {};
        if (values.size) options.size = Number(values.size);
        if (values.page) options.page = Number(values.page);
        result = await sdk.dmID(values.id).modelList(options);
        if (!values.raw) result = cleanResult(result);
        break;
      }
      case "getDatamanager": {
        if (!values.id) error("--id (datamanager UUID) is required for getDatamanager");
        result = await sdk.getDatamanager(values.id);
        if (!values.raw) result = cleanResult(result);
        break;
      }
      case "entryList":
      case "getEntry":
      case "createEntry":
      case "editEntry":
      case "deleteEntry":
      case "getSchema": {
        if (!values.dm) error("--dm is required");
        if (!values.model) error("--model is required");
        const chain = sdk.dm(values.dm).model(values.model).clean(!values.raw);

        switch (command) {
          case "entryList": {
            const options: Record<string, any> = {};
            if (values.size) options.size = Number(values.size);
            if (values.page) options.page = Number(values.page);
            if (values.sort) options.sort = [values.sort];
            result = await chain.entryList(options);
            break;
          }
          case "getEntry": {
            if (!values.id) error("--id is required for getEntry");
            result = await chain.getEntry(values.id);
            break;
          }
          case "createEntry": {
            const data = await getJsonData(values.data);
            result = await chain.createEntry(data);
            break;
          }
          case "editEntry": {
            if (!values.id) error("--id is required for editEntry");
            const data = await getJsonData(values.data);
            result = await chain.editEntry(values.id, data);
            break;
          }
          case "deleteEntry": {
            if (!values.id) error("--id is required for deleteEntry");
            await chain.deleteEntry(values.id);
            process.stderr.write("Entry deleted.\n");
            return;
          }
          case "getSchema": {
            result = await chain.getSchema();
            break;
          }
        }
        break;
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
