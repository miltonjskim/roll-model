import { atom } from 'jotai';
import { ApiProjectDomain } from '@/shared/lib/utils/domainMapping';

export interface ProjectDetailAtom {
  id: string; // pipelineId
  title: string;
  version: number | string | null;
  category: 'CLASSIFICATION' | 'REGRESSION';
  domain: ApiProjectDomain;
  projectPublicYn?: boolean;
  pipelinePublicYn?: boolean;
  ownerYn: boolean; // 기본값이 false이며, 프로젝트 상세페이지 api로 응답받은 정보 중 ownerYn 값이 true라면, ownerYn값 업데이트
}

const initialProjectDetail: ProjectDetailAtom = {
  id: '',
  title: '',
  version: '1.0',
  category: 'CLASSIFICATION',
  domain: 'HEALTHCARE',
  projectPublicYn: true,
  pipelinePublicYn: true,
  ownerYn: false,
};

export const projectDetailAtom = atom<ProjectDetailAtom>(initialProjectDetail);
