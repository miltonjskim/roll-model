import { atom } from 'jotai';

export const globalLoadingAtom = atom<boolean>(false);
export const globalLoadingMessageAtom = atom<string | null>(null);
