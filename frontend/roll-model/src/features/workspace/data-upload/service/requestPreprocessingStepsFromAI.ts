import { PreviousPreprocessingSteps, RecommendedAiSteps, Step } from '@/entities/workspace/data-preprocess/model/types';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { ApiResponse } from '@/shared/model/types/apiResponse';

/**
 * AI 추천 전처리 단계 요청 (파일만 보내는 요청)
 * @param file 업로드할 데이터셋 파일
 */
export const requestPreprocessingStepsFromAI = async (file: File, projectId: string): Promise<ApiResponse<RecommendedAiSteps>> => {
  const formData = new FormData();
  formData.append('dataFile', file);

  const response = await axiosInstance.post<ApiResponse<RecommendedAiSteps>>(`/api/v3/projects/${projectId}/ai/recommend`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
