import { ColumnConfig } from '@/entities/workspace/data-config/model/types';
import { projectCategory, projectDomain } from '@/entities/workspace/model/types';

export interface SampleDatasetResponse {
  samples: SampleDataset[];
}

export interface SampleDataset {
  id: number;
  name: string;
  description: string;
  category: projectCategory;
  domain: projectDomain;
  columns: ColumnConfig[];
  rowCount: number;
  columnCount: number;
}
