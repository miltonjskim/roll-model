import { ApiProjectDomain } from '@/shared/lib/utils/domainMapping';

// 프로젝트 기본정보
export interface ProjectInfo {
  title: string;
  category: 'CLASSIFICATION' | 'REGRESSION';
  domain: ApiProjectDomain;
  version: string;
  projectPublicYn: boolean;
  pipelinePublicYn: boolean;
  ownerYn: boolean;
}

// API 상태 정보
export interface ApiStatus {
  expiresAt: string; // ISO 8601 형식 날짜
  accuracy: number | null; // 분류 모델의 정확도
  rmse: number | null; // 회귀 모델의 RMSE
}

// API 엔드포인트 정보
export interface Endpoint {
  url: string;
  apiKey: string;
}

// 입력 스키마의 특성(feature) 정의
export interface InputFeature {
  name: string;
  type: 'number' | 'string' | 'enum' | 'boolean';
  required: boolean;
  example: 'number' | 'string' | 'boolean';
  options?: string[]; // enum 타입일 경우에만 사용
}

// 입력 스키마
export interface InputSchema {
  features: InputFeature[];
}

// 에러 응답 타입 정의
export interface ApiError {
  code: string;
  message: string;
}

// API 섹션 응답 전체
export interface ProjectDetailApiResponse {
  status: number;
  message: string;
  data: {
    projectInfo: ProjectInfo;
    apiStatus: ApiStatus;
    endpoint: Endpoint;
    inputSchema: InputSchema;
  };
  error: null | ApiError;
}
