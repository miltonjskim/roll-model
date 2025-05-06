export type ColumnConfig = {
  name: string;
  type: 'string' | 'datetime' | 'integer' | 'boolean' | 'double';
};

export type UploadDatasetRequest = {
  delimiter: 'comma' | 'semicolon' | 'tab' | 'other';
  customDelimiter?: string;
  encoding: 'UTF-8' | 'CP949' | 'EUC-KR' | 'ISO-8859-1' | 'UTF-16';
  hasHeader: boolean;
  columns: ColumnConfig[];
};
