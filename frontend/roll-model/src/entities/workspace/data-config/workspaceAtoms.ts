import { CompleteDatasetResponse, UploadDatasetResponse } from '@/entities/workspace/data-config/model/types';
import { atom } from 'jotai';

export const selectedSampleDatasetAtom = atom<string | null>(null);
export const uploadedFileAtom = atom<File | null>(null);
export const uploadedDatasetAtom = atom<UploadDatasetResponse | null>(null);
export const completedDatasetAtom = atom<CompleteDatasetResponse | null>(null);
