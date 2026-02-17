export type HalLink = { href: string; templated?: boolean; profile?: string; title?: string };
export type HalLinks = Record<string, HalLink | undefined> & {
  self?: HalLink;
  collection?: HalLink;
};
export type Thumbnail = { url: string; dimension: number };

export type AssetFile = {
  url: string;
  size: number;
  resolution: { width: number; height: number };
};

export type AssetResource = {
  assetID: string;
  created: Date;
  files: AssetFile[];
  tags: string[];
  title: string;
  type: string;
  mimetype: string;
  duplicates: number;
  file: AssetFile;
  fileVariants: AssetFile[];
  thumbnails?: Thumbnail[];
};

export type EntryResource = Record<string, unknown> & {
  id: string;
  _created: Date;
  _creator: string;
  _embedded?: Record<string, unknown>;
  _links?: HalLinks;
  _modelTitle: string;
  _modelTitleField: string;
  _modified: Date;
  created: Date;
  modified: Date;
  [key: string]: unknown; // Dynamic properties
};

export type EntryFieldSchema = {
  default: unknown;
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

export type PublicApiRoot = { _links: HalLinks; [key: string]: unknown };

export type DatamanagerResource = {
  created: string;
  dataManagerID: string;
  defaultLocale: string;
  description: string;
  config: Record<string, unknown>;
  hexColor: string;
  locales: string[];
  rights: string[];
  publicAssetRights: string[];
  shortID: string;
  title: string;
  _links?: HalLinks;
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
  items: unknown[];
};

export type ModelFieldConfig = {
  default: unknown;
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
  config: Record<string, unknown>;
  created: string;
  description: string;
  fields: ModelFieldConfig[];
  hasEntries: boolean;
  hexColor: string;
  hooks: unknown[];
  lastSyncs: unknown[];
  locales: string[];
  modelID: string;
  modified: string;
  policies: unknown[];
  sync: unknown;
  title: string;
  titleField: string;
  _links?: HalLinks;
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
  dataSchema: Record<string, unknown>;
  template: string;
  collection: string | null;
  [key: string]: unknown;
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
  settings: Record<string, unknown>;
  [key: string]: unknown;
};

export type RoleResource = {
  roleID: string;
  name: string;
  label: string;
  accountsCount: number;
  addRegistered: boolean;
  addUnregistered: boolean;
  [key: string]: unknown;
};

export type ClientResource = {
  clientID: string;
  callbackURL: string | null;
  tokenMethod: string[];
  disableStrategies: string[];
  [key: string]: unknown;
};

export type GroupResource = {
  groupID: string;
  name: string;
  permissions: string[];
  [key: string]: unknown;
};

export type InviteResource = {
  invite: string;
  email: string;
  groups: string[];
  permissions: string[];
  [key: string]: unknown;
};

export type AccountResource = {
  accountID: string;
  email: string | null;
  created: string | null;
  hasPassword: boolean;
  [key: string]: unknown;
};

export type TokenResource = {
  accessTokenID: string;
  issued: string;
  device: Record<string, unknown>;
  isCurrent: boolean;
  [key: string]: unknown;
};

export type FdkConfig = {
  storageAdapter?: StorageAdapter;
  [key: string]: unknown;
};

// --- Admin config types ---

export type AdminConfig = {
  env: string;
  token: string;
};

export type AdminListConfig = AdminConfig & {
  options?: Record<string, unknown>;
};

export type AdminDmConfig = AdminConfig & {
  dmID: string;
};

export type AdminDmListConfig = AdminDmConfig & {
  options?: Record<string, unknown>;
};

export type AdminResourceListConfig = AdminListConfig & {
  resource: string;
  subdomain?: string;
};

export type AdminCreateConfig<T = Record<string, unknown>> = AdminConfig & {
  value: T;
};

export type AdminDmCreateConfig<T = Record<string, unknown>> = AdminDmConfig & {
  value: T;
};

export type AdminEditConfig<K extends string, T = Record<string, unknown>> = AdminConfig & {
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
