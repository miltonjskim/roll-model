import { axiosInstance } from '@/shared/lib/axios/axiosInstance';
import { OpenSourceResponse } from '@/entities/open-source/model/types';
import openSourceMock from '@/shared/api/mocks/openSource.json';
import { ApiProjectDomain, getDomainDisplayName } from '@/shared/lib/utils/domainMapping';

// API 응답 변환 함수 - 프로젝트에 displayDomain 추가
const transformOpenSourceResponse = (response: OpenSourceResponse): OpenSourceResponse => {
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

// 단일 API 함수로 통합
export const fetchOpenSourceData = async (
  category: string = 'all',
  searchQuery: string = '',
  sortOption: string = 'recent',
  page: number = 1,
  size: number = 6, // 하드코딩 요청대로 6으로 설정
) => {
  try {
    // 쿼리 파라미터 구성
    const params = new URLSearchParams();

    if (searchQuery) {
      params.append('keyword', searchQuery);
    }

    if (category !== 'all') {
      params.append('type', category.toLowerCase()); // 소문자로 변환
    }

    params.append('sort', sortOption);
    params.append('page', page.toString());
    params.append('size', size.toString());

    // 실제 API 연동 시에는 아래 코드 활성화
    const response = await axiosInstance.get<OpenSourceResponse>(`/api/v1/projects/opensource?${params.toString()}`);
    return transformOpenSourceResponse(response.data);

    //>>>>>>>>>>>>>>>>>>>>>>>>>>>> 아래 mock data 전용 코드 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    // // Mock 데이터 사용 (실제 API 연동 전까지)
    // const mockData = { ...openSourceMock } as OpenSourceResponse;
    // // 클라이언트 측 필터링 (서버에서 필터링되어야 하지만 목업 데이터를 위해)
    // let filtered = [...mockData.data!.projects];
    // if (category !== 'all') {
    //   filtered = filtered.filter((project) => project.category === category);
    // }
    // if (searchQuery) {
    //   const query = searchQuery.toLowerCase();
    //   filtered = filtered.filter((project) =>
    //     project.title.toLowerCase().includes(query) ||
    //     project.target.toLowerCase().includes(query)
    //   );
    // }
    // // 클라이언트 측 정렬 (서버에서 정렬되어야 하지만 목업 데이터를 위해)
    // if (sortOption === 'name') {
    //   filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
    // } else if (sortOption === 'recent') {
    //   filtered = filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    // }
    // // 필터링된 프로젝트로 새 응답 객체 생성
    // const response = {
    //   ...mockData,
    //   data: {
    //     ...mockData.data!,
    //     projects: filtered,
    //     totalElements: filtered.length,
    //     totalPages: Math.ceil(filtered.length / size),
    //     currentPage: page,
    //     last: page * size >= filtered.length,
    //   },
    // };
    // return transformOpenSourceResponse(response);
    // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  } catch (error) {
    console.error('오픈소스 데이터 로딩 실패:', error);
    throw error;
  }
};

// 좋아써
export const likeThisPipeline = async (pipelineId: string, likeYn:boolean) => {
  try {
    const response = await axiosInstance.post(`/api/v1/pipelines/${pipelineId}/likes`, { likeYn: likeYn });
    return response.data;
  } catch (error) {
    console.error('좋아요 변경 실패', error);
    throw error;
  }
};
