import typeDefinitions from "virtual:type-definitions";
import { getSchema } from "../lib/entries";

const schemaTypeToTS: Record<string, string> = {
  text: "string",
  formattedText: "string",
  string: "string",
  url: "string",
  email: "string",
  phone: "string",
  number: "number",
  decimal: "number",
  boolean: "boolean",
  datetime: "Date",
  json: "Record<string, any>",
  object: "Record<string, any>",
  entry: "string",
  entries: "string[]",
  asset: "string",
  assets: "string[]",
  location: "{ latitude: number; longitude: number }",
  account: "string",
  role: "string",
  date: "string",
  period: "string",
};

const entryCommands = new Set(["entryList", "getEntry", "createEntry", "editEntry"]);

const commandTypeMap: Record<string, string> = {
  entryList: "EntryList",
  getEntry: "EntryResource",
  createEntry: "EntryResource",
  editEntry: "EntryResource",
  getSchema: "EntrySchema",
  assetList: "AssetList",
  getAsset: "AssetResource",
  createAsset: "AssetResource",
  editAsset: "AssetResource",
  deleteAsset: "void",
  dmList: "DatamanagerList",
  modelList: "ModelList",
  getDatamanager: "DatamanagerResource",
  createDatamanager: "DatamanagerResource",
  editDatamanager: "DatamanagerResource",
  createModel: "ModelResource",
  editModel: "ModelResource",
  createTemplate: "TemplateResource",
  createAssetGroup: "AssetGroupResource",
  editAssetGroup: "AssetGroupResource",
  editDmClient: "ClientResource",
  createRole: "RoleResource",
  editRole: "RoleResource",
  editDmAccount: "AccountResource",
  createAccountClient: "ClientResource",
  editAccountClient: "ClientResource",
  createGroup: "GroupResource",
  editGroup: "GroupResource",
  createInvite: "InviteResource",
  editInvite: "InviteResource",
  editAccount: "AccountResource",
  listTokens: "TokenList",
  createToken: "TokenResource",
  deleteEntry: "void",
  deleteDatamanager: "void",
  deleteModel: "void",
  deleteRole: "void",
  deleteDmAccount: "void",
  deleteAccountClient: "void",
  deleteGroup: "void",
  deleteInvite: "void",
  deleteToken: "void",
};

export async function describe(
  command?: string,
  short?: boolean,
  opts?: { dm?: string; model?: string; env?: string }
): Promise<void> {
  if (!command || !commandTypeMap[command]) {
    if (command) process.stderr.write(`Unknown command: ${command}\n\n`);
    process.stderr.write(`Available commands:\n`);
    const commands = Object.keys(commandTypeMap).sort();
    for (const cmd of commands) {
      process.stderr.write(`  ${cmd}\n`);
    }
    process.exit(command ? 2 : 0);
  }

  const typeName = commandTypeMap[command];

  if (typeName === "void") {
    process.stdout.write("This command returns no data.\n");
    return;
  }

  const body = typeDefinitions[typeName];
  if (!body) {
    process.stderr.write(`Type definition not found for ${typeName}.\n`);
    process.exit(2);
  }

  process.stdout.write(`type ${typeName} = ${body}\n`);

  if (!short) {
    const allNames = Object.keys(typeDefinitions);
    const printed = new Set<string>([typeName]);
    const queue: string[] = [];

    // find refs in the main type body
    for (const name of allNames) {
      if (name !== typeName && new RegExp(`\\b${name}\\b`).test(body)) {
        queue.push(name);
        printed.add(name);
      }
    }

    // process queue, collecting transitive refs
    for (let i = 0; i < queue.length; i++) {
      const refBody = typeDefinitions[queue[i]];
      if (!refBody) continue;
      for (const name of allNames) {
        if (!printed.has(name) && new RegExp(`\\b${name}\\b`).test(refBody)) {
          queue.push(name);
          printed.add(name);
        }
      }
    }

    for (const name of queue) {
      const refBody = typeDefinitions[name];
      if (refBody) {
        process.stdout.write(`\ntype ${name} = ${refBody}\n`);
      }
    }
  }

  // Dynamic entry type from schema
  if (opts?.dm && opts?.model && entryCommands.has(command)) {
    try {
      const props = await getSchema({
        env: opts.env || "stage",
        dmShortID: opts.dm,
        model: opts.model,
        withMetadata: false,
      });
      const modelName = opts.model.charAt(0).toUpperCase() + opts.model.slice(1);
      const lines: string[] = [];
      for (const [field, def] of Object.entries(props as Record<string, any>)) {
        const tsType = schemaTypeToTS[def.type] || "any";
        const nullable = def.required ? "" : " | null";
        lines.push(`    ${field}: ${tsType}${nullable};`);
      }
      process.stdout.write(`\n// Dynamic fields for model "${opts.model}":\n`);
      process.stdout.write(`type ${modelName}Entry = {\n${lines.join("\n")}\n}\n`);
    } catch (e: any) {
      process.stderr.write(
        `Warning: could not fetch schema for ${opts.model}: ${e.message}\n`
      );
    }
  }
}
