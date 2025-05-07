import { atom } from 'jotai';

export interface UserInfo {
  memberId: number;
  nickname: string;
  email: string;
  provider: string;
  registeredAt: string;
  modifiedAt: string;
  isActive: boolean;
}

export const userAtom = atom<UserInfo | null>(null);
export const isLoggedInAtom = atom<boolean>(false);
