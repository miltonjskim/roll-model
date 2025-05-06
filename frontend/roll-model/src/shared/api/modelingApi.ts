import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { ModelingApiRequest } from '@/entities/workspace/modeling-section/model/types';

// 모델 학습 시작 API 호출 함수
// api 형식 모름 == any
export const startModelTraining = async (data: ModelingApiRequest & { dataSplit: number }): Promise<any> => {
  try {
    const response = await axiosInstance.post('/api/v1/test/modeling', data);
    return response.data;
  } catch (error) {
    console.error('모델 학습 시작 API 호출 실패:', error);
    throw error;
  }
};
