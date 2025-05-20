import { UploadDatasetRequest } from '@/entities/workspace/data-config/model/types';

export const generateColumnPayload = (header: string[], columnTypes: string[]): UploadDatasetRequest['columns'] =>
  header.map((col, idx) => ({
    name: col.length > 0 ? col : `컬럼 ${idx + 1}`,
    type: columnTypes[idx] as UploadDatasetRequest['columns'][number]['type'],
  }));
