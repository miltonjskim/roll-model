import { useQuery } from '@tanstack/react-query';
import { fetchProjectDetailData, fetchProjectDetailModel, fetchProjectDetailApi } from '@/shared/api/projectDetailApi';
import { useAtom } from 'jotai';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { useEffect } from 'react';
import { ProjectDetailModelResponse, isClassificationModel, isRegressionModel } from '@/entities/project-detail/model/ModelTypes';
import { Endpoint, InputSchema } from '@/entities/project-detail/model/ApiTypes';
import axios from 'axios';

export const useProjectDetailOverview = (pipelineId: string) => {
  const [, setProjectDetail] = useAtom(projectDetailAtom);

  // ★☆★☆★☆★☆★☆ 이제는 사용하지 않는 개요api ★☆★☆★☆★☆★☆★☆
  // 기존에는 개요페이지 전용api 사용했음. 하지만 수정함.
  // 개요페이지에서 다른페이지들(데이터,모델,api)의 정보를 프리페칭 하도록 수정했음
  // 프리페칭하며 쿼리에 저장할 데이터 일부를 조합하여 개요페이지를 구성함.
  // const { data, isLoading, isError, error, refetch } = useQuery({
  //   queryKey: ['projectDetailOverview', pipelineId],
  //   queryFn: () => fetchProjectDetailOverview(pipelineId),
  //   enabled: !!pipelineId,
  //   staleTime: 1000 * 60 * 5,
  // });

  // ====== Data 탭 데이터 요청 ======
  const {
    data: dataTabData,
    isLoading: isDataLoading,
    isError: isDataError,
    error: dataError,
    refetch: refetchData,
  } = useQuery({
    queryKey: ['projectDetailData', pipelineId],
    queryFn: () => fetchProjectDetailData(pipelineId),
    enabled: !!pipelineId,
    staleTime: 1000 * 60 * 5, // 5분 동안 캐싱
  });

  // ====== Model 탭 데이터 요청 ======
  const {
    data: modelTabData,
    isLoading: isModelLoading,
    isError: isModelError,
    error: modelError,
    refetch: refetchModel,
  } = useQuery<ProjectDetailModelResponse>({
    queryKey: ['projectDetailModel', pipelineId],
    queryFn: () => fetchProjectDetailModel(pipelineId),
    enabled: !!pipelineId,
    staleTime: 1000 * 60 * 5, // 5분 동안 캐싱
  });

  // ====== API 탭 데이터 요청 ======
  const {
    data: apiTabData,
    isLoading: isApiLoading,
    isError: isApiError,
    error: apiError,
    refetch: refetchApi,
  } = useQuery({
    queryKey: ['projectDetailApi', pipelineId],
    queryFn: () => fetchProjectDetailApi(pipelineId),
    enabled: !!pipelineId,
    staleTime: 1000 * 60 * 5, // 5분 동안 캐싱
  });

  // ====== API 상태 체크를 위한 데이터 준비 ======
  // API 데이터에서 엔드포인트와 인풋 스키마 추출
  const endpoint: Endpoint | undefined = apiTabData?.data?.endpoint;
  const inputSchema: InputSchema | undefined = apiTabData?.data?.inputSchema;

  // ====== API 상태 체크 요청 ======
  // API 데이터가 로드된 후에만 상태 체크 실행
  const {
    data: apiStatusData,
    isLoading: isApiStatusLoading,
    isError: isApiStatusError,
    refetch: refreshApiStatus,
  } = useQuery({
    queryKey: ['apiStatus', pipelineId],
    queryFn: async () => {
      if (!endpoint || !inputSchema) {
        throw new Error('API 정보가 없습니다');
      }

      // API 상태 체크 로직
      const startTime = Date.now();
      const queryParams = inputSchema.features.reduce(
        (params, feature) => {
          params[feature.name] = feature.example;
          return params;
        },
        {} as Record<string, any>,
      );

      try {
        // axios 사용 (기존 코드와 일관성 유지)
        await axios.get(endpoint.url, { params: queryParams });
        const responseTime = Date.now() - startTime;
        return {
          isActive: true,
          responseTime,
        };
      } catch (e) {
        console.error('API 호출 실패', e);
        return {
          isActive: false,
          responseTime: 0,
        };
      }
    },
    enabled: !!endpoint && !!inputSchema && !isApiLoading, // API 데이터가 로드된 후에만 실행
    staleTime: 1000 * 60 * 5,
    retry: 1, // 요청 실패 시 최대 1회 재시도
  });

  // ====== Jotai atom 업데이트 - 최적화 버전 ======
  // 모든 API 요청이 완료된 후 atom을 한 번만 업데이트
  useEffect(() => {
    // 적어도 하나의 API 응답에서 projectInfo를 찾아 업데이트
    const projectInfo = dataTabData?.data?.projectInfo || modelTabData?.data?.projectInfo || apiTabData?.data?.projectInfo;

    if (projectInfo) {
      setProjectDetail((prevState) => ({
        ...prevState,
        ...projectInfo,
        id: pipelineId,
      }));
    }
  }, [dataTabData?.data?.projectInfo, modelTabData?.data?.projectInfo, apiTabData?.data?.projectInfo, pipelineId, setProjectDetail]);

  // 모델 타입 확인 (분류 모델인지, 회귀 모델인지)
  const isClassification = modelTabData?.data ? isClassificationModel(modelTabData.data) : false;
  const isRegression = modelTabData?.data ? isRegressionModel(modelTabData.data) : false;

  // 전체 로딩 상태 - 모든 필수 데이터가 로딩 중인지 확인
  const isLoading = isDataLoading || isModelLoading || isApiLoading;

  // 전체 에러 상태 - 어느 하나라도 에러가 있는지 확인
  const isError = isDataError || isModelError || isApiError;

  // 모든 데이터 리프레시 함수
  const refetchAll = () => {
    refetchData();
    refetchModel();
    refetchApi();
    if (endpoint && inputSchema) {
      refreshApiStatus();
    }
  };

  return {
    // 각 탭의 데이터
    projectDetailData: dataTabData?.data,
    projectDetailModel: modelTabData?.data,
    projectDetailApi: apiTabData?.data,
    apiStatus: apiStatusData,

    // 모델 타입 플래그
    isClassification,
    isRegression,

    // 각 탭의 개별 로딩 상태
    isDataLoading,
    isModelLoading,
    isApiLoading,
    isApiStatusLoading,

    // 각 탭의 개별 에러 상태
    isDataError,
    isModelError,
    isApiError,
    isApiStatusError,

    // 각 탭의 개별 에러 객체
    dataError,
    modelError,
    apiError,

    // 통합 상태
    isLoading,
    isError,

    // 리프레시 함수
    refetchData,
    refetchModel,
    refetchApi,
    refreshApiStatus,
    refetchAll,
  };
};
