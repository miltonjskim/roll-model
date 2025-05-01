import { axiosInstance } from "@/shared/lib/axios/axiosInstance";
import { OpenSourceResponse } from "@/entities/open-source/model/types";
import openSourceMock from "@/shared/api/mocks/openSource.json";
import {
  ApiProjectDomain,
  getDomainDisplayName,
} from "../lib/utils/domainMapping";

// API 응답 변환 함수 - 프로젝트에 displayDomain 추가
const transformOpenSourceResponse = (
  response: OpenSourceResponse
): OpenSourceResponse => {
  if (!response.data || !response.data.projects) return response;

  return {
    ...response,
    data: {
      ...response.data,
      projects: response.data.projects.map((project) => ({
        ...project,
        displayDomain: getDomainDisplayName(project.domain as ApiProjectDomain),
      })),
    },
  };
};

// 실제 API 연동 시 사용할 함수
export const fetchOpenSourceData = async (page = 1, size = 10) => {
  try {
    // 실제 API 연동 시에는 아래 코드 활성화
    // const response = await axiosInstance.get(
    //   `/api/projects?page=${page}&size=${size}`
    // );
    // return transformOpenSourceResponse(response.data);

    // Mock 데이터 사용 (실제 API 연동 전까지)
    // API 지연 시뮬레이션 (500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));
    return transformOpenSourceResponse(openSourceMock as OpenSourceResponse);
  } catch (error) {
    console.error("오픈소스 데이터 로딩 실패:", error);
    throw error;
  }
};

// 프로젝트 필터링 및 정렬 함수
export const fetchFilteredOpenSourceProjects = async (
  category: string = "all",
  searchQuery: string = "",
  sortOption: string = "recent", // 기본값은 최신순
  page = 1,
  size = 10
) => {
  try {
    // 실제 API 연동 시에는 아래 코드 활성화
    // 카테고리 파라미터 준비
    // let typeParam = "";
    // if (category !== "all") {
    //   typeParam = `&type=${category.toLowerCase()}`; // API 요구사항에 맞게 소문자로 변환
    // }
    
    // const response = await axiosInstance.get(
    //   `/api/projects?sort=${sortOption}${typeParam}&keyword=${searchQuery}&page=${page}&size=${size}`
    // );
    // return transformOpenSourceResponse(response.data);

    // Mock 데이터 사용 (실제 API 연동 전까지)
    // API 지연 시뮬레이션 (300ms)
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockData = { ...openSourceMock } as OpenSourceResponse;

    // 클라이언트 측 필터링 (서버에서 필터링되어야 하지만 목업 데이터를 위해)
    let filtered = [...mockData.data!.projects];

    if (category !== "all") {
      filtered = filtered.filter((project) => project.category === category);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.target.toLowerCase().includes(query)
      );
    }

    // 클라이언트 측 정렬 (서버에서 정렬되어야 하지만 목업 데이터를 위해)
    if (sortOption === "popular") {
      filtered = filtered.sort((a, b) => b.likeCount - a.likeCount);
    } else if (sortOption === "recent") {
      filtered = filtered.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    // 필터링된 프로젝트로 새 응답 객체 생성
    const response = {
      ...mockData,
      data: {
        ...mockData.data!,
        projects: filtered,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
        currentPage: page,
        last: page * size >= filtered.length,
      },
    };

    return transformOpenSourceResponse(response);
  } catch (error) {
    console.error("프로젝트 필터링 실패:", error);
    throw error;
  }
};