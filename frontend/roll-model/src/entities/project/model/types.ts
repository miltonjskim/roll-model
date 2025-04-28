// back 질문 필요함 (임시 enum)
export type ProjectType = "classification" | "regression";
export type ProjectStatus = "completed" | "progress";
export type ProjectDomain =
  | "common"
  | "finance"
  | "medical"
  | "marketing"
  | "education";

export interface Project {
  id: number;
  title: string; // 제목
  type: ProjectType; // 분류 or 회귀
  status: ProjectStatus; // 성공 or 진행중? or 전처리만완료?
  domain: ProjectDomain; // 의료 금융 등
  accuracy: number | null; // 정확도
  rmse: number | null; // 회귀일때의 정확도
  target: string; // 목표변수
  dataCount: number; // 데이터수
  runnung_duration: number; // 학습시간
  likeCount: number; // 좋아요
  downloadCount: number; // 다운로드
  visibility: boolean; // 공개여부
  createdAt: string; // 생성
  updatedAt: string; // 수정
}

export interface DashboardSummary {
  totalProjects: number; // 총 프로젝트
  completedProjectCount: number; // 완료 프로젝트
  inProgressProjectCount: number; // 전처리만 완료
  publicProjectCount: number; // 공개 프로젝트
}

export interface DashboardData {
  currentPage: number; // 현재 페이지
  totalPages: number; // 총 페이지
  totalElements: number; // ?
  last: boolean; // ?
  summary: DashboardSummary;
  projects: Project[];
}

export interface DashboardResponse {
  status: number; // 200
  message: string; // Success
  data: DashboardData | null;
}