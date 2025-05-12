import { ApiProjectDomain } from '@/shared/lib/utils/domainMapping';

export type ProjectType = 'CLASSIFICATION' | 'REGRESSION';

export interface OpenSourceProject {
  id: string;
  title: string; // 제목
  version: string; // 버전
  writerId: number; // 작성자 ID
  status: string;
  writerNickname: string; // 작성자 닉네임
  category: ProjectType; // 분류 or 회귀
  domain: ApiProjectDomain; // 의료 금융 등
  displayDomain?: string; // 화면 표시용 한글 도메인
  accuracy: number | null; // 정확도
  rSquared: number | null; // 회귀일때의 정확도
  target: string; // 목표변수
  dataCount: number; // 데이터수
  runnungDuration: number; // 학습시간
  likeCount: number; // 좋아요
  downloadCount: number; // 다운로드
  likeYn: boolean; // 내가 좋아함?
  createdAt: string; // 생성
  updatedAt: string; // 수정
}

export interface OpenSourceData {
  currentPage: number; // 현재 페이지
  totalPages: number; // 총 페이지
  totalElements: number; // 총 프로젝트
  last: boolean; // 이게 마지막 페이지인지
  projects: OpenSourceProject[];
}

export interface OpenSourceResponse {
  status: number; // 200
  message: string; // Success
  data: OpenSourceData | null;
}
