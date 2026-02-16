import typeDefinitions from "virtual:type-definitions";

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

export function describe(command?: string, short?: boolean): void {
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
}
