import { ColumnConfig, CompleteDatasetResponse, UploadDatasetResponse, UploadDatasetResult } from '@/entities/workspace/data-config/model/types';
import { PreviousPreprocessingSteps, Step } from '@/entities/workspace/data-preprocess/model/types';
import { atom } from 'jotai';

export const selectedSampleDatasetAtom = atom<string | null>(null);
export const uploadedFileAtom = atom<File | null>(null);
export const uploadedDatasetAtom = atom<UploadDatasetResult | null>(null);
export const completedDatasetAtom = atom<CompleteDatasetResponse | null>(null);
export const pipelineIdAtom = atom<string>('');
export const preprocessingStepsAtom = atom<PreviousPreprocessingSteps | null>(null);
export const dataColumnsAtom = atom<Record<string, string>[]>([]);
export const aiRecommendedStepsAtom = atom<Step[]>([]);
