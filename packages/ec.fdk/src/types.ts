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

export type FdkConfig = {
  storageAdapter?: StorageAdapter;
  [key: string]: any;
};
