import { atom } from 'jotai';
import { projectCategory, projectDomain } from '@/entities/workspace/model/types';

export const projectTitleAtom = atom(''); // 프로젝트 제목
export const projectDescriptionAtom = atom(''); // 프로젝트 설명
export const projectDomainAtom = atom<projectDomain>('GENERAL'); // 프로젝트 도메인
export const projectCategoryAtom = atom<projectCategory>('REGRESSION'); // 프로젝트 카테고리
export const projectPublicAtom = atom(true); // 공개 여부
export const projectIdAtom = atom(''); // 프로젝트 아이디
