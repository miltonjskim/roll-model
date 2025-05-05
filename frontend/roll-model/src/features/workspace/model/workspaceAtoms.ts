import { atom } from "jotai";

export const selectedSampleDatasetAtom = atom<string | null>(null);
export const uploadedFileAtom = atom<File | null>(null);
