import { ApiProjectDomain } from '@/shared/lib/utils/domainMapping';

export type ProjectType = 'CLASSIFICATION' | 'REGRESSION';
export type ProjectStatus = 'COMPLETED' | 'PREPROCESSED' | 'LEARNING' | 'FAILED';

export interface Project {
  id: string;
  title: string; // 제목
  version: string | null; // 버전 (전처리만완료시 null)
  category: ProjectType; // 분류 or 회귀
  status: ProjectStatus; // 성공 or 진행중==전처리만완료?
  domain: ApiProjectDomain; // 의료 금융 등
  displayDomain?: string; // 화면 표시용 한글 도메인
  accuracy: number | null; // 정확도 (전처리만완료시 accuracy and rSquared null)
  rSquared: number | null; // 회귀일때의 정확도 (전처리만완료시 accuracy and rSquared null)
  target: string | null; // 목표변수 (전처리만완료시 null)
  dataCount: number; // 데이터수
  runningDuration: number | null; // 학습시간 (전처리만완료시 null)
  likeCount: number; // 좋아요
  downloadCount: number; // 다운로드
  publicYn: boolean; // 공개여부
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
