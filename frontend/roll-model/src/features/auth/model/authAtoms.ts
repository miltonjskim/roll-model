import { atom } from "jotai";

export interface UserInfo {
  id: number;
  nickname: string;
  email: string;
}

export const userAtom = atom<UserInfo | null>(null);
export const isLoggedInAtom = atom<boolean>(false);