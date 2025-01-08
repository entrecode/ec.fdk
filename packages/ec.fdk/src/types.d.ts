type AssetFile = {
  url: string;
  size: number;
  resolution: Record<string, any>;
};

type AssetResource = {
  assetID: string;
  created: Date;
  files: any[];
  tags: (string | any)[];
  title: string;
  type: string;
  mimetype: string;
  duplicates: number;
  file: AssetFile;
};

type EntryResource = Record<string, any> & {
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

type EntryFieldSchema = {
  default: any;
  description: string;
  readOnly: boolean;
  required: boolean;
  type: string;
  resource: string | null;
};

type EntrySchema = Record<string, EntryFieldSchema>;

type EntryList = {
  count: number;
  total: number;
  items: EntryResource[];
};

type DatamanagerResource = {
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

type DatamanagerList = {
  count: number;
  total: number;
  items: DatamanagerResource[];
};

type AssetList = {
  count: number;
  total: number;
  items: AssetResource[];
};

type ResourceList = {
  count: number;
  total: number;
  items: any[];
};

type ModelFieldConfig = {
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

type ModelResource = {
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

type ModelList = {
  count: number;
  total: number;
  items: ModelResource[];
};
