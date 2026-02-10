import { parseArgs } from "node:util";
import { Fdk } from "./lib/api";
import { fileStorageAdapter } from "./lib/cli-storage";
import { prompt, promptPassword } from "./lib/cli-prompt";

const HELP = `ec.fdk <command> [options]

Commands:
  login                 Login with ec credentials (interactive prompt)
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
  -i, --id <entryID>    Entry ID (for get/edit/delete)
  --data <json>         JSON data (for create/edit, or pipe via stdin)
  -s, --size <n>        Page size for list
  -p, --page <n>        Page number for list
  --sort <field>        Sort field for list
  --raw                 Include _links and _embedded in output
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
      help: { type: "boolean", short: "h" },
    },
  });

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

  // All other commands need --dm and --model
  if (!values.dm) error("--dm is required");
  if (!values.model && command !== "getSchema") {
    // getSchema also needs model, but let's keep the check uniform
  }
  if (!values.model) error("--model is required");

  const chain = sdk.dm(values.dm).model(values.model).clean(!values.raw);

  try {
    let result: any;

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
      default:
        error(`Unknown command: ${command}`);
    }

    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } catch (e: any) {
    process.stderr.write(`${e.message}\n`);
    process.exit(1);
  }
}

main();
