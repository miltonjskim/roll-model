import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { ModelingApiRequest } from '@/entities/workspace/modeling-section/model/types';
import { ApiResponse } from '@/shared/model/types/apiResponse';
import { ForkTotalResponse } from '@/shared/model/types/modelingTypes';

// 모델 학습 시작 API 호출 함수
// api 형식 모름 == any
export const startModelTraining = async (
  pipelineId: string,
  data: {
    modelingInfo: {
      algorithm: string;
      dataSplit: {
        trainRatio: number;
        testRatio: number;
        validationRatio: number;
        randomSeed: number;
      };
      parameters: Record<string, string | number | null>;
      targetFeature: string;
    };
  },
): Promise<any> => {
  try {
    const response = await axiosInstance.post(`/api/v1/pipelines/${pipelineId}/modeling`, data);
    return response.data;
  } catch (error) {
    console.error('모델 학습 시작 API 호출 실패:', error);
    throw error;
  }
};

// 재학습 (모델링부터 시작하기)
export const YouHaveToAfterSchool = async (pipelineId: string): Promise<ApiResponse<ForkTotalResponse>> => {
  try {
    const { data } = await axiosInstance.post<ApiResponse<ForkTotalResponse>>(`/api/v2/pipelines/${pipelineId}/fork/total`);
    return data;
  } catch (error) {
    console.error('모델링 테스트 API 호출 실패:', error);
    throw error;
  }
};

// 재학습 (모델링부터 리~~~로딩)
export const YouHadBetterAfterSchool = async (pipelineId: string): Promise<ApiResponse<ForkTotalResponse>> => {
  try {
    const { data } = await axiosInstance.post<ApiResponse<ForkTotalResponse>>(`/api/v2/pipelines/${pipelineId}/reload/total`);
    return data;
  } catch (error) {
    console.error('모델링 테스트 API 호출 실패:', error);
    throw error;
  }
};
