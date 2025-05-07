//data
import { ProjectDetailDataResponse } from '@/entities/project-detail/model/dataTypes';
import projectDetailDataMock from '@/shared/api/mocks/project-detail/projectDetailData.json';
//version
import { ProjectDetailVersionResponse } from '@/entities/project-detail/model/versionTypes';
import projectDetailVersionMock from '@/shared/api/mocks/project-detail/projectDetailVersion.json';
import projectDetailModelClassification from '@/shared/api/mocks/project-detail/projectDetailModelClassification.json'; // 분류 mock data
import projectDetailModelClassificationTest from '@/shared/api/mocks/project-detail/projectDetailModelClassificationTest.json'; // 분류 mock data 테스트버전
import projectDetailModelRegression from '@/shared/api/mocks/project-detail/projectDetailModelRegression.json'; // 회귀 mock data
import projectDetailModelRegressionTest from '@/shared/api/mocks/project-detail/projectDetailModelRegressionTest.json'; // 회귀 mock data 테스트버전
import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { baseAxiosInstance } from '@/shared/lib/axios/baseAxiosInstance';
import { ProjectDetailModelResponse } from '@/entities/project-detail/model/ModelTypes';

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

// 모델섹션
export const fetchProjectDetailModel = async (pipelineId: string) => {
  try {
    // 나중에 api 완성 후에 활성화
    // const response = await axiosInstance.get(`/api/v1/pipelines/${pipelineId}/modelInfo`);
    // return response.data;

    // mock data 분류일때
    return projectDetailModelClassification as ProjectDetailModelResponse;
    // mock data 분류일때 테스트전용
    // return projectDetailModelClassificationTest as ProjectDetailModelResponse; // (혼동행렬 class 12개)화면박살남
    // mock data 회귀일때
    // return projectDetailModelRegression as ProjectDetailModelResponse;
    // mock data 회귀일때 테스트전용
    // return projectDetailModelRegressionTest as ProjectDetailModelResponse;
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

// 파이프라인 공개여부 변경
export const toggePublicPipeline = async (pipelineId: string) => {
  try {
    const response = await axiosInstance.post(`/api/v1/pipelines/${pipelineId}/visibility`);
    return response.data;
  } catch (error) {
    console.error('파이프라인 공개여부 변경 실패', error);
    throw error;
  }
};
