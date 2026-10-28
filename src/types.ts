export interface DataFrame {
  columns: string[];
  rows: any[][];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  dataframe?: DataFrame;
  error?: string;
  usedModel?: string;
  timestamp: string;
}

export interface AppStatus {
  isKeyConfigured: boolean;
  activeModel: string;
  databaseName: string;
  tablesCount: number;
  totalRows: number;
  auditTrailEnabled: boolean;
  pythonEngine?: string;
}

export interface TableSummary {
  name: string;
  rowCount: number;
}

export interface ColumnDetail {
  name: string;
  type: string;
  pk: boolean;
  notnull: boolean;
}

export interface ForeignKeyDetail {
  from: string;
  toTable: string;
  toColumn: string;
}

export interface TableDetail {
  name: string;
  rowCount: number;
  columns: ColumnDetail[];
  foreignKeys: ForeignKeyDetail[];
}

export interface SchemaResponse {
  summary: string;
  tables?: TableDetail[];
}
