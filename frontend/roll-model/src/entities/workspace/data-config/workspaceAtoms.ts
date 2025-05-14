import { ColumnConfig, CompleteDatasetResponse, UploadDatasetResponse } from '@/entities/workspace/data-config/model/types';
import { PreviousPreprocessingSteps } from '@/entities/workspace/data-preprocess/model/types';
import { atom } from 'jotai';

export const selectedSampleDatasetAtom = atom<string | null>(null);
export const uploadedFileAtom = atom<File | null>(null);
export const uploadedDatasetAtom = atom<UploadDatasetResponse | null>(null);
export const completedDatasetAtom = atom<CompleteDatasetResponse | null>(null);
export const pipelineIdAtom = atom<string>('');
export const preprocessingSteps = atom<PreviousPreprocessingSteps | null>(null);
export const dataColumns = atom<Record<string, string>[]>([]);
