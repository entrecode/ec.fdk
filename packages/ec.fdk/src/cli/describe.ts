import typeDefinitions from "virtual:type-definitions";
import { getSchema } from "../lib/entries";
import { schemaTypeToTS } from "./schema-types";

const entryCommands = new Set(["entryList", "getEntry", "createEntry", "editEntry"]);
const resourceCommands = new Set(["resourceList", "resourceGet", "resourceEdit"]);

const resourceListTypeMap: Record<string, string> = {
  account: "AccountList",
  "dm-account": "DmAccountList",
  group: "GroupList",
  role: "RoleList",
  client: "ClientList",
  "dm-client": "DmClientList",
  invite: "InviteList",
  template: "TemplateList",
  assetgroup: "AssetGroupList",
  model: "ModelList",
  token: "TokenList",
};

const resourceItemTypeMap: Record<string, string> = {
  account: "AccountResource",
  "dm-account": "DmAccountResource",
  group: "GroupResource",
  role: "RoleResource",
  client: "ClientResource",
  "dm-client": "DmClientResource",
  invite: "InviteResource",
  template: "TemplateResource",
  assetgroup: "AssetGroupResource",
  model: "ModelResource",
  token: "TokenResource",
};

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
  publicApi: "PublicApiRoot",
  resourceList: "ResourceList",
  resourceGet: "any",
  resourceEdit: "any",
  resourceDelete: "void",
  createAssets: "AssetResource",
  mapEntries: "EntryResource",
  getStats: "any",
  getHistory: "HistoryList",
  raw: "any",
  loginEc: "any",
  loginPublic: "any",
  logoutEc: "void",
  logoutPublic: "void",
  getEcAuthKey: "any",
  getPublicAuthKey: "any",
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
  opts?: { dm?: string; model?: string; env?: string; resource?: string }
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

  let typeName = commandTypeMap[command];

  // Override type when --resource is provided for resource commands
  if (opts?.resource && resourceCommands.has(command)) {
    const map = command === "resourceList" ? resourceListTypeMap : resourceItemTypeMap;
    const resolved = map[opts.resource];
    if (resolved) {
      typeName = resolved;
    } else {
      process.stderr.write(`Unknown resource: ${opts.resource}. Known resources: ${Object.keys(map).join(", ")}\n`);
    }
  }

  if (typeName === "void") {
    process.stdout.write("This command returns no data.\n");
    return;
  }

  if (typeName === "any") {
    process.stdout.write("This command returns untyped data (any).\n");
    return;
  }

  let body = typeDefinitions[typeName];
  if (!body) {
    process.stderr.write(`Type definition not found for ${typeName}.\n`);
    process.exit(2);
  }

  // Fetch dynamic schema before printing, so we can transform the static types
  let dynamicBlock: string | undefined;
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
      dynamicBlock = `type ${modelName}Entry = EntryResourceBase & {\n${lines.join("\n")}\n}`;

      // Clean up EntryResource → EntryResourceBase: remove Record<string, any> & and [key: string]: any
      const entryBody = typeDefinitions["EntryResource"];
      if (entryBody) {
        let cleaned = entryBody
          .replace(/Record<string,\s*(?:any|unknown)>\s*&\s*/, "")
          .replace(/\s*\[key: string\]: (?:any|unknown);[^\n]*\n?/, "\n");
        typeDefinitions["EntryResourceBase"] = cleaned;
        delete typeDefinitions["EntryResource"];
        // Update body/typeName references if this command returns EntryResource directly
        if (typeName === "EntryResource") body = cleaned;
      }
      // Rewrite EntryList to reference the dynamic type
      if (typeName === "EntryList") {
        body = body.replace(/EntryResource/g, `${modelName}Entry`);
      }
    } catch (e: any) {
      process.stderr.write(
        `Warning: could not fetch schema for ${opts.model}: ${e.message}\n`
      );
    }
  }

  // Print return type first
  if (dynamicBlock && typeName === "EntryResource") {
    // The return type IS the dynamic type when command returns a single entry
    process.stdout.write(`${dynamicBlock}\n`);
    process.stdout.write(`\ntype EntryResourceBase = ${typeDefinitions["EntryResourceBase"]}\n`);
  } else {
    process.stdout.write(`type ${typeName} = ${body}\n`);
    if (dynamicBlock) {
      process.stdout.write(`\n${dynamicBlock}\n`);
      process.stdout.write(`\ntype EntryResourceBase = ${typeDefinitions["EntryResourceBase"]}\n`);
    }
  }

  if (!short) {
    const allNames = Object.keys(typeDefinitions);
    const printed = new Set<string>([typeName, "EntryResource", "EntryResourceBase"]);
    const queue: string[] = [];

    // find refs in the main type body
    for (const name of allNames) {
      if (!printed.has(name) && new RegExp(`\\b${name}\\b`).test(body)) {
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
}
