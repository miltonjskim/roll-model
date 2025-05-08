export interface ImputedRow {
  [key: string]: string | number | null;
}

// 결측치 처리 api response
export interface PreprocessMissingValueResponse {
  pipelineId: number; // 파이프라인 ID
  success: boolean; // 처리 성공 여부
  message: string; // 처리 메시지
  originalMissingCount: number; // 원래 결측치 개수
  imputedCount: number; // 대체된 결측치 개수
  result: // 상세 처리 결과
  MissingValueImputationResult | MissingValueRemovalResult;
}

// 이상치 처리 api response
export interface PreprocessOutlierResponse {
  pipelineId: number; // 파이프라인 ID
  success: boolean; // 처리 성공 여부
  message: string; // 처리 메시지
  originalOutlierCount: number; // 원래 이상치 개수
  imputedCount: number; // 대체된 이상치 개수
  result: OutlierImputationResult | OutlierRemovalResult;
}

// 결측치 대체 결과 인터페이스
export interface MissingValueImputationResult {
  method: 'MEAN' | 'MEDIAN' | 'MODE' | string; // 적용된 대체 방법
  column: string; // 처리된 컬럼 이름
  fillValue: number | string; // 대체에 사용된 값
  changeIndices: number[]; // 변경된 행의 인덱스 목록
  originalRows: ImputedRow[]; // 원래 행의 데이터
  changedRows: ImputedRow[]; // 변경된 행의 데이터
  timestamp: string; // 처리 시간 (ISO 8601 형식)
}

// 결측치 제거 결과 인터페이스
export interface MissingValueRemovalResult {
  method: 'ROW_REMOVE' | 'COLUMN_REMOVE'; // 적용된 대체 방법
  changeIndices: number[]; // 변경된 행의 인덱스 목록
  imputedRows: ImputedRow[]; // 제거된 행의 데이터
  imputedColumns: string[]; // 제거된 컬럼 목록
  timestamp: string; // 처리 시간 (ISO 8601 형식)
}

// 이상치 대체 결과 인터페이스
export interface OutlierImputationResult {
  column: string; // 처리된 컬럼 이름
  method: 'MEAN' | 'MEDIAN' | 'MODE' | 'THRESHOLD'; // 적용된 대체 방법
  detection: 'ZSCORE'; // 이상치 탐지 방법
  minThreshold: number; // 하한 이상치 임계값
  maxThreshold: number; // 상한 이상치 임계값
  changedIndices: number[]; // 변경된 행의 인덱스 목록
  originalRows: ImputedRow[]; // 원래 행의 데이터
  changedRows: ImputedRow[]; // 변경된 행의 데이터
  timestamp: string; // 처리 시간 (ISO 8601 형식)
}

// 이상치 제거 결과 인터페이스
export interface OutlierRemovalResult {
  method: 'ROW_REMOVE' | 'COL_REMOVE';
  detection: 'ZSCORE' | 'IQR';
  changedIndices: number[]; // 변경된 행의 인덱스 목록
  imputedRows: ImputedRow[]; // 제거된 행의 데이터
  imputedColumns: string[]; // 제거된 컬럼 목록
  timestamp: string; // 처리 시간 (ISO 8601 형식)
}

// 이상치 탐지 결과 인터페이스
// export interface OutlierDetectionResult {}

// // 데이터 변환 결과 인터페이스
// export interface DataTransformationResult {}

// // 범주형 변수 인코딩 결과 인터페이스
// export interface CategoricalEncodingResult {}

// // 클래스 불균형 처리 결과 인터페이스
// export interface ClassImbalanceHandlingResult {}
