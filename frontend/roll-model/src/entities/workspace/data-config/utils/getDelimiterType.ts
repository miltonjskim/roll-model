import type { UploadDatasetRequest } from '@/entities/workspace/data-config/model/types';

export const getDelimiterType = (
  selected: string,
  custom: string,
): {
  delimiter: UploadDatasetRequest['delimiter'];
  customDelimiter?: string;
} => {
  const map: Record<string, UploadDatasetRequest['delimiter']> = {
    ',': 'comma',
    ';': 'semicolon',
    '\t': 'tab',
    '기타 입력': 'other',
  };

  const delimiter = map[selected] ?? 'other';

  return {
    delimiter,
    customDelimiter: selected === '기타 입력' ? custom : undefined,
  };
};
