import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { DashboardResponse } from '@/entities/dashboard/model/types';
import dashboardMock from '@/shared/api/mocks/dashboard.json';
import { ApiProjectDomain, getDomainDisplayName } from '@/shared/lib/utils/domainMapping';

// API 응답 변환 함수 - 프로젝트에 displayDomain 추가
const transformDashboardResponse = (response: DashboardResponse): DashboardResponse => {
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
export const fetchDashboardData = async () => {
  try {
    const response = await axiosInstance.get<DashboardResponse>('/api/v1/projects/my');
    console.log(response.data);

    return transformDashboardResponse(response.data);

    // Mock 데이터 사용 (실제 API 연동 전까지)
    // return transformDashboardResponse(dashboardMock as DashboardResponse);
  } catch (error) {
    console.error('대시보드 데이터 로딩 실패:', error);
    throw error;
  }
};
