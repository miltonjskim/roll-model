import { ApiProjectDomain } from '@/shared/lib/utils/domainMapping';

// 프로젝트 정보 (공통) : layout
export interface ProjectInfo {
  title: string;
  category: 'CLASSIFICATION' | 'REGRESSION';
  domain: ApiProjectDomain;
  version: string;
  projectPublicYn: boolean;
  pipelinePublicYn: boolean;
  ownerYn: boolean;
}

// 모델 파라미터 (공통) : ModelOverview
export interface ModelParameter {
  parameterName: string;
  parameterValue: string;
  parameterKey: string;
}

// 타겟 정보 (공통) : ModelOverview
export interface TargetInfo {
  targetName?: string; // targetName이 있는 경우
  targetValue?: string; // targetValue가 있는 경우
  targetKey?: string; // targetKey가 있는 경우
  durationName?: string; // durationName이 있는 경우
  durationValue?: string; // durationValue가 있는 경우
  durationKey?: string; // durationKey가 있는 경우
}

// 성능 메트릭 (공통) : ModelOverview
export interface PerformanceMetric {
  metricName: string;
  metricValue: string;
  metricDesc: string;
  metricKey: string;
}

// 특성 중요도 (공통) : FeatureImportanceChart
export interface FeatureImportance {
  featureName: string;
  importanceValue: string;
  importanceKey: string;
}

// 혼동 행렬 (분류 모델 전용) : ClassificationEvaluation
export interface ConfusionMatrix {
  labels: string[];
  matrixData: number[][];
}

// 실제값 vs 예측값 데이터 (회귀 모델 전용) : 하위
export interface ActualVsPredictedData {
  actual: number;
  predicted: number;
  id: number;
}

// 실제값 vs 예측값 그래프 (회귀 모델 전용) : RegressionEvaluation
export interface ActualVsPredicted {
  data: ActualVsPredictedData[];
  xAxisLabel: string;
  yAxisLabel: string;
  perfectLinePoints: { x: number; y: number }[];
}

// 잔차 데이터 (회귀 모델 전용) : 하위
export interface ResidualData {
  predicted: number;
  residual: number;
  id: number;
}

// 잔차 분포 그래프 (회귀 모델 전용) : RegressionEvaluation
export interface ResidualPlot {
  data: ResidualData[];
  histogram: {
    bins: number[];
    frequencies: number[];
  };
  xAxisLabel: string;
  yAxisLabel: string;
  zeroLineY: number;
}

// 분류 모델 데이터 : algorithm은 ModelOverview에서 사용해야됨
export interface ClassificationModelData {
  projectInfo: ProjectInfo & { category: 'CLASSIFICATION' };
  algorithm: string;
  modelParameters: ModelParameter[];
  targetInfo: TargetInfo[];
  performanceMetrics: PerformanceMetric[];
  confusionMatrix: ConfusionMatrix;
  featureImportance: FeatureImportance[];
}

// 회귀 모델 데이터 : algorithm은 ModelOverview에서 사용해야됨
export interface RegressionModelData {
  projectInfo: ProjectInfo & { category: 'REGRESSION' };
  algorithm: string;
  modelParameters: ModelParameter[];
  targetInfo: TargetInfo[];
  performanceMetrics: PerformanceMetric[];
  actualVsPredicted: ActualVsPredicted;
  residualPlot: ResidualPlot;
  featureImportance: FeatureImportance[];
}

// 유니온 타입을 통한 모델 데이터 (분류 또는 회귀)
export type ModelData = ClassificationModelData | RegressionModelData;

// API 응답 에러 타입
export interface ApiError {
  code: string;
  message: string;
}

// API 응답 타입
export interface ProjectDetailModelResponse {
  status: number;
  message: string;
  data: ModelData;
  error: ApiError | null;
}

// 타입 가드 함수 - 분류 모델인지 확인
export function isClassificationModel(data: ModelData): data is ClassificationModelData {
  return data.projectInfo.category === 'CLASSIFICATION';
}

// 타입 가드 함수 - 회귀 모델인지 확인
export function isRegressionModel(data: ModelData): data is RegressionModelData {
  return data.projectInfo.category === 'REGRESSION';
}
