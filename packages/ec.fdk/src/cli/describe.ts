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

export function describe(command?: string): void {
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
}
