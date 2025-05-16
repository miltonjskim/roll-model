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
    // TODO: 로컬 개발 종료 후 해당 주석 해제 및 아래 코드 주석화
    // const token = sessionStorage.getItem('token');

    // TODO: 로컬 테스트용 토큰 추가
    const token = process.env.NEXT_PUBLIC_API_TEST_TOKEN;
    if (token) set(userToken, token);
  }
});

export const userAtom = atom<UserInfo | null>(null);
export const isLoggedInAtom = atom<boolean>(false);
