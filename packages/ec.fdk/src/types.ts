export type AssetFile = {
  url: string;
  size: number;
  resolution: Record<string, any>;
};

export type AssetResource = {
  assetID: string;
  created: Date;
  files: any[];
  tags: (string | any)[];
  title: string;
  type: string;
  mimetype: string;
  duplicates: number;
  file: AssetFile;
  fileVariants: AssetFile[];
  thumbnails?: any[];
};

export type EntryResource = Record<string, any> & {
  id: string;
  _created: Date;
  _creator: string;
  _embedded: any;
  _links: any;
  _modelTitle: string;
  _modelTitleField: string;
  _modified: Date;
  created: Date;
  modified: Date;
  [key: string]: any; // Dynamic properties
};

export type EntryFieldSchema = {
  default: any;
  description: string;
  readOnly: boolean;
  required: boolean;
  type: string;
  resource: string | null;
};

export type EntrySchema = Record<string, EntryFieldSchema>;

export type EntryList = {
  count: number;
  total: number;
  items: EntryResource[];
};

export type PublicApiRoot = any; // TODO

export type DatamanagerResource = {
  created: string;
  dataManagerID: string;
  defaultLocale: string;
  description: string;
  config: any;
  hexColor: string;
  locales: string[];
  rights: string[];
  publicAssetRights: string[];
  shortID: string;
  title: string;
  _links: any;
};

export type DatamanagerList = {
  count: number;
  total: number;
  items: DatamanagerResource[];
};

export type AssetList = {
  count: number;
  total: number;
  items: AssetResource[];
};

export type ResourceList = {
  count: number;
  total: number;
  items: any[];
};

export type ModelFieldConfig = {
  default: any;
  description: string;
  localizable: boolean;
  mutable: boolean;
  readOnly: boolean;
  required: boolean;
  unique: boolean;
  title: string;
  type: string;
  validation: string | null;
};

export type ModelResource = {
  config: any;
  created: string;
  description: string;
  fields: ModelFieldConfig[];
  hasEntries: boolean;
  hexColor: string;
  hooks: any[];
  lastSyncs: any[];
  locales: string[];
  modelID: string;
  modified: string;
  policies: any[];
  sync: any;
  title: string;
  titleField: string;
  _links: any;
};

export type ModelList = {
  count: number;
  total: number;
  items: ModelResource[];
};

/** see https://doc.entrecode.de/api-basics/#generic-list-resources */
export type GenericListOptions = {
  page?: number;
  size?: number;
  sort?: string;
};

/** see https://doc.entrecode.de/datamanager/resources/asset/#relations_1 */
export type AssetCreateOptions = {
  preserveFilenames?: boolean;
  includeAssetIDInPath?: boolean;
  defaultVariants?: string;
  ignoreDuplicates?: boolean;
  deduplicate?: boolean;
};

export type StorageAdapter = {
  get: (key: string) => string;
  set: (key: string, token: string) => void;
  remove: (key: string) => void;
};

export type TemplateResource = {
  templateID: string;
  name: string;
  version: string;
  dataSchema: any;
  template: any;
  collection: any;
  [key: string]: any;
};

export type TemplateList = {
  count: number;
  total: number;
  items: TemplateResource[];
};

export type AssetGroupResource = {
  assetGroupID: string;
  dataManagerID: string;
  public: boolean;
  settings: any;
  [key: string]: any;
};

export type RoleResource = {
  roleID: string;
  name: string;
  label: string;
  accounts: string[];
  addRegistered: boolean;
  addUnregistered: boolean;
  [key: string]: any;
};

export type ClientResource = {
  clientID: string;
  callbackURL: string;
  tokenMethod: string;
  disableStrategies: string[];
  [key: string]: any;
};

export type GroupResource = {
  groupID: string;
  name: string;
  permissions: any[];
  [key: string]: any;
};

export type InviteResource = {
  inviteID: string;
  email: string;
  groups: string[];
  permissions: any[];
  [key: string]: any;
};

export type AccountResource = {
  accountID: string;
  email: string;
  created: string;
  hasPassword: boolean;
  permissions: any[];
  groups: string[];
  [key: string]: any;
};

export type TokenResource = {
  accessTokenID: string;
  created: string;
  device: string;
  isCurrent: boolean;
  [key: string]: any;
};

export type FdkConfig = {
  storageAdapter?: StorageAdapter;
  [key: string]: any;
};

// --- Admin config types ---

export type AdminConfig = {
  env: string;
  token: string;
};

export type AdminListConfig = AdminConfig & {
  options?: Record<string, any>;
};

export type AdminDmConfig = AdminConfig & {
  dmID: string;
};

export type AdminDmListConfig = AdminDmConfig & {
  options?: Record<string, any>;
};

export type AdminResourceListConfig = AdminListConfig & {
  resource: string;
  subdomain?: string;
};

export type AdminCreateConfig<T = Record<string, any>> = AdminConfig & {
  value: T;
};

export type AdminDmCreateConfig<T = Record<string, any>> = AdminDmConfig & {
  value: T;
};

export type AdminEditConfig<K extends string, T = Record<string, any>> = AdminConfig & {
  value: T;
} & { [P in K]: string };

export type AdminDeleteConfig<K extends string> = AdminConfig & { [P in K]: string };

// --- List types ---

export type AssetGroupList = {
  count: number;
  total: number;
  items: AssetGroupResource[];
};

export type RoleList = {
  count: number;
  total: number;
  items: RoleResource[];
};

export type ClientList = {
  count: number;
  total: number;
  items: ClientResource[];
};

export type DmAccountList = {
  count: number;
  total: number;
  items: AccountResource[];
};

export type GroupList = {
  count: number;
  total: number;
  items: GroupResource[];
};

export type InviteList = {
  count: number;
  total: number;
  items: InviteResource[];
};

export type AccountList = {
  count: number;
  total: number;
  items: AccountResource[];
};

export type TokenList = {
  count: number;
  total: number;
  items: TokenResource[];
};
