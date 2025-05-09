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
    totalRows: number; // 총 행 수
    totalColumns: number; // 총 열 수
    filename: string; // 파일 이름
    encoding: string; // 인코딩 방식
    delimiter: string; // 구분자
    customDelimiter?: string; // 커스텀 구분자를 사용했는지
  };

  // 결측치 데이터
  missingValues: {
    columns: string[]; // 결측치가 존재하는 컬럼명 배열
    details: {
      [column: string]: {
        count: number; // 결측치 행 개수
        percentage: number; // 결측치 비율
        rowIndices: number[]; // 몇 번째 행이 결측치인지
      };
    };
  };

  // 원본 데이터셋 정보
  originalDatasets: OriginalDatasetType;
}
