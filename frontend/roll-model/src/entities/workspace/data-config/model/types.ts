// 컬럼 정보
export type ColumnConfig = {
  name: string;
  type: 'string' | 'datetime' | 'integer' | 'boolean' | 'double';
};

// 원본 데이터셋 업로드 요청값
export type UploadDatasetRequest = {
  delimiter: 'comma' | 'semicolon' | 'tab' | 'other';
  customDelimiter?: string;
  encoding: 'UTF-8' | 'CP949' | 'EUC-KR' | 'ISO-8859-1' | 'UTF-16';
  hasHeader: boolean;
  columns: ColumnConfig[];
};

// 원본 데이터셋 업로드 응답값의 원본 데이터셋 정보 내 데이터 타입
type CellValue = string | number | boolean | null;

// 원본 데이터셋 업로드 응답값의 원본 데이터셋 정보 타입
export interface OriginalDatasetType {
  columns: string[];
  data: Array<Record<string, CellValue>>;
}

// 원본 데이터셋 업로드 응답값
export interface UploadDatasetResponse {
  // 생성된 파이프라인 아이디
  pipelineId: string;

  // 데이터 요약
  summary: {
    totalRows: number;
    totalColumns: number;
    filename: string;
    encoding: string;
    delimiter: string;
    customDelimiter?: string;
  };

  // 결측치 데이터
  missingValues: {
    columns: string[];
    details: {
      [column: string]: {
        count: number;
        percentage: number;
        rowIndices: number[]; // 몇 번째 행이 결측치인지
      };
    };
  };

  // 원본 데이터셋 정보
  original_datasets: OriginalDatasetType;
}
