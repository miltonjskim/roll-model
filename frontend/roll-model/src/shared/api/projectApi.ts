import { axiosInstance } from "@/shared/lib/axios/axiosInstance";
import { DashboardResponse } from "@/entities/project/model/types";
import dashboardMock from "@/shared/api/mocks/dashboard.json";

// 실제 API 연동 시 사용할 함수
export const fetchDashboardData = async (page = 1, size = 10) => {
  try {
    // 실제 API 연동 시에는 아래 코드 활성화
    // const response = await axiosInstance.get<DashboardResponse>(
    //   `/api/projects/dashboard?page=${page}&size=${size}`
    // );
    // return response.data;

    // Mock 데이터 사용 (실제 API 연동 전까지)
    // API 지연 시뮬레이션 (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));
    return dashboardMock as DashboardResponse;
  } catch (error) {
    console.error("대시보드 데이터 로딩 실패:", error);
    throw error;
  }
};

// 프로젝트 필터링 함수
export const fetchFilteredProjects = async (
  category: string = "all",
  searchQuery: string = "",
  page = 1,
  size = 10
) => {
  try {
    // 실제 API 연동 시에는 아래 코드 활성화
    // const response = await axiosInstance.get<DashboardResponse>(
    //   `/api/projects/dashboard?category=${category}&search=${searchQuery}&page=${page}&size=${size}`
    // );
    // return response.data;

    // Mock 데이터 사용 (실제 API 연동 전까지)
    // API 지연 시뮬레이션 (300ms)
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockData = { ...dashboardMock } as DashboardResponse;
    
    // 클라이언트 측 필터링 (서버에서 필터링되어야 하지만 목업 데이터를 위해)
    let filtered = [...mockData.data!.projects];
    
    if (category !== "all") {
      filtered = filtered.filter(project => project.type === category);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(query) || 
        project.target.toLowerCase().includes(query)
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
        last: page * size >= filtered.length
      }
    };
    
    return response;
  } catch (error) {
    console.error("프로젝트 필터링 실패:", error);
    throw error;
  }
};