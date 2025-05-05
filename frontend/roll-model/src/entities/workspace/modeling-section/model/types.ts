// 파라미터 타입 정의
export interface Parameter {
  id: string;
  name: string;
  type: string;
  required: boolean;
  defaultValue: any;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  sliderOptions?: {
    min: number;
    max: number;
    step: number;
    defaultValue: number;
  };
  conditionalShow?: {
    parameter: string;
    value: string;
  };
}

// 모델 타입 정의
export interface Model {
  id: string;
  name: string;
  description: string;
  parameters: Parameter[];
}

// 모델 카테고리 타입
export type ModelCategory = 'CLASSIFICATION' | 'REGRESSION';

// 학습 시작 API 요청 타입
export interface ModelingApiRequest {
  pipelineId: string;
  modelType: string;
  parameters: Record<string, any>;
  targetColumn: string;
}

// 파라미터 값을 저장할 상태 타입
export type ParameterValues = Record<string, any>;
