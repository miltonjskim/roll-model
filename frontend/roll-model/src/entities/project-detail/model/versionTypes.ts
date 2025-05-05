import { ApiProjectDomain } from "@/shared/lib/utils/domainMapping";

// 프로젝트 기본정보
export interface ProjectInfo {
  title: string;
  category: "CLASSIFICATION" | "REGRESSION";
  domain: ApiProjectDomain;
  version: number;
  ownerYn: boolean;
}
// 버전 리스트
export interface VersionHistory {
  version: number;
  updatedAt: string;
  publicYn: boolean;
  deletedYn: boolean;
  parent: number;
}
//버전 상세 리스트
export interface Pipelines {
  pipelineId: string;
  version: number;
  accuracy: number;
  dataCount: number;
  target: string;
  runnungDuration: number;
  likeCount: number;
  downloadCount: number;
  updatedAt: string;
}
// 전체
export interface ProjectDetailVersionResponse {
  status: number;
  message: string;
  data: {
    projectInfo: ProjectInfo;
    versionHistory: VersionHistory[];
    pipelines: Pipelines[];
  };
  error: null | any;
}
