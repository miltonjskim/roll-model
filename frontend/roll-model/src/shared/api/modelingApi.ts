import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { ModelingApiRequest } from '@/entities/workspace/modeling-section/model/types';

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
      parameters: Record<string, any>;
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


