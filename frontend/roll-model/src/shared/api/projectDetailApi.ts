import { axiosInstance } from "../lib/axios/axiosInstance";
//data
import { ProjectDetailDataResponse } from "@/entities/project-detail/model/dataTypes";
import projectDetailDataMock from "@/shared/api/mocks/project-detail/projectDetailData.json";
//version
import { ProjectDetailVersionResponse } from "@/entities/project-detail/model/versionTypes";
import projectDetailVersionMock from "@/shared/api/mocks/project-detail/projectDetailVersion.json";

export const fetchProjectDetailData = async (pipelineId: string) => {
  try {
    // 나중에 api 완성 후에 활성화
    // const response = await axiosInstance.get(`/api/pipelines/${pipelineId}/dataset/info`)
    // return response.data

    // mock data
    await new Promise((resolve) => setTimeout(resolve, 300));
    return projectDetailDataMock as ProjectDetailDataResponse;
  } catch (error) {
    console.error("상세 데이터섹션 호출 실패", error);
    throw error;
  }
};

export const fetchProjectDetailVersion = async (pipelineId: string) => {
  try {
    // 나중에 api 완성 후에 활성화
    // const response = await axiosInstance.get(`/api/pipelines/${pipelineId}/versions`)
    // return response.data

    // mock data
    await new Promise((resolve) => setTimeout(resolve, 300));
    return projectDetailVersionMock as ProjectDetailVersionResponse;
  } catch (error) {
    console.error("상세 데이터섹션 호출 실패", error);
    throw error;
  }
};
