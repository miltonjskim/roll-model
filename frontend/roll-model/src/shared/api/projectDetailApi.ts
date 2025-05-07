//data
import { ProjectDetailDataResponse } from '@/entities/project-detail/model/dataTypes';
import projectDetailDataMock from '@/shared/api/mocks/project-detail/projectDetailData.json';
//version
import { ProjectDetailVersionResponse } from '@/entities/project-detail/model/versionTypes';
import projectDetailVersionMock from '@/shared/api/mocks/project-detail/projectDetailVersion.json';
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { baseAxiosInstance } from '@/shared/lib/axios/baseAxiosInstance';

// 데이터섹션
export const fetchProjectDetailData = async (pipelineId: string) => {
  try {
    // 나중에 api 완성 후에 활성화
    // const response = await axiosInstance.get(`/api/v1/pipelines/${pipelineId}/dataset/info`)
    // return response.data

    // mock data
    return projectDetailDataMock as ProjectDetailDataResponse;
  } catch (error) {
    console.error('상세 데이터섹션 호출 실패', error);
    throw error;
  }
};

// 버전섹션
export const fetchProjectDetailVersion = async (pipelineId: string) => {
  try {
    // 나중에 api 완성 후에 활성화
    // const response = await axiosInstance.get(`/api/v1/pipelines/${pipelineId}/versions`)
    // return response.data

    // mock data
    // 시간차 어택 제거
    return projectDetailVersionMock as ProjectDetailVersionResponse;
  } catch (error) {
    console.error('상세 데이터섹션 호출 실패', error);
    throw error;
  }
};

// 파이프라인 삭제
export const deletePipeline = async (pipelineId: string) => {
  try {
    const response = await axiosInstance.delete(`/api/v1/pipelines/${pipelineId}`);
    return response.data;
  } catch (error) {
    console.error('파이프라인 삭제 실패', error);
    throw error;
  }
};
