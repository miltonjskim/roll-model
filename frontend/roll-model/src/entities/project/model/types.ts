import { ApiProjectDomain } from "@/shared/lib/utils/domainMapping";

export type ProjectType = "CLASSIFICATION" | "REGRESSION";
export type ProjectStatus = "COMPLETED" | "PREPROCESSED";


export interface Project {
  id: number;
  title: string; // 제목
  version : string;
  category: ProjectType; // 분류 or 회귀
  status: ProjectStatus; // 성공 or 진행중==전처리만완료?
  domain: ApiProjectDomain; // 의료 금융 등
  displayDomain?: string;   // 화면 표시용 한글 도메인
  accuracy: number | null; // 정확도
  rmse: number | null; // 회귀일때의 정확도
  target: string; // 목표변수
  dataCount: number; // 데이터수
  runnungDuration: number; // 학습시간
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
  currentPage: number; // 현재 페이지 ?
  totalPages: number; // 총 페이지
  totalElements: number; // 총 프로젝트
  last: boolean; // 이게 마지막 페이지인지
  summary: DashboardSummary;
  projects: Project[];
}

export interface DashboardResponse {
  status: number; // 200
  message: string; // Success
  data: DashboardData | null;
}

// 버전 반영 x
//학습시간 화면 반영 x
// category status ProjectDomain 수정됨

