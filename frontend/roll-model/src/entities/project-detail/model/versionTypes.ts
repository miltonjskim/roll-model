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

// 파이프라인 정보 (기존 VersionHistory + Pipelines 합침)
export interface Pipeline {
  pipelineId: string;
  version: string;
  publicYn: boolean;
  deletedYn: boolean;
  parent: string;
  accuracy: number;
  dataCount: number;
  target: string;
  runnungDuration: number;
  likeCount: number;
  downloadCount: number;
  updatedAt: string;
  ownerYn: boolean;
}

// 에러 응답 타입 정의
export interface ApiError {
  code: string;
  message: string;
}

// 전체
export interface ProjectDetailVersionResponse {
  status: number;
  message: string;
  data: {
    projectInfo: ProjectInfo;
    pipelines: Pipeline[];
  };
  error: null | ApiError;
}
