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

export const userToken = atom<string | null>(null);

// 클라이언트 진입 시 토큰 불러오는 파생 atom
export const initUserTokenAtom = atom(null, (get, set) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('token');
    if (token) set(userToken, token);
  }
});

export const userAtom = atom<UserInfo | null>(null);
export const isLoggedInAtom = atom<boolean>(false);
