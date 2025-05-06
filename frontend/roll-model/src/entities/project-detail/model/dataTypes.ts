import { ApiProjectDomain } from '@/shared/lib/utils/domainMapping';

// 프로젝트 정보
export interface ProjectInfo {
  title: string;
  category: 'CLASSIFICATION' | 'REGRESSION';
  domain: ApiProjectDomain;
  version: number;
  ownerYn: boolean;
}

// 데이터 한눈에보기
export interface Dataset {
  id: string;
  recordCount: number;
  featureCount: number;
  targetVariable: string;
  missingRate: string;
}
// 전처리 파라미터 타입 정의
export type PreprocessingParameter = string | number | boolean | undefined; // undefined 전처리 파라미터 어떻게 날라올지 모름
// 전처리 빠이쁘라인
export interface PreprocessingStep {
  type: string;
  parameters: Record<string, PreprocessingParameter>;
  order: number;
  active: boolean;
}

// 데이터 분할정보
export interface DataSplit {
  method: string;
  trainRatio: number; // 학습비율
  testRatio: number; // 테스트비율
  validationRatio: number; // 검증?비율
}

// 주요변수 4개 받아오기
export interface Distribution {
  name: string;
  type: string;
  xAxis: {
    label: string;
    values: number[];
  };
  yAxis: {
    label: string;
    values: number[];
  };
}

// 상관관계 행렬
export interface CorrelationMatrix {
  featureNames: string[];
  matrix: number[][];
}

// 에러 응답 타입 정의
export interface ApiError {
  code: string;
  message: string;
}

// 전체응답
export interface ProjectDetailDataResponse {
  status: number;
  message: string;
  data: {
    projectInfo: ProjectInfo;
    dataset: Dataset;
    preprocessingSteps: PreprocessingStep[];
    dataSplit: DataSplit;
    distributions: Distribution[];
    correlationMatrix: CorrelationMatrix;
  };
  error: null | ApiError;
}
