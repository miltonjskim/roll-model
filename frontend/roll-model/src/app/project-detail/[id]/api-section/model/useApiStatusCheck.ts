import { Endpoint, InputSchema } from '@/entities/project-detail/model/ApiTypes';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const checkApiStatus = async (endpoint: Endpoint, inputSchema: InputSchema) => {
  const startTime = Date.now();
  const queryParams = inputSchema.features.reduce(
    (params, feature) => {
      params[feature.name] = feature.example;
      return params;
    },
    {} as Record<string, any>,
  );
  try {
    console.log('이건 실행됨?');

    await axios.get(endpoint.url, { params: queryParams });
    const responseTime = Date.now() - startTime;
    return {
      isActive: true,
      responseTime,
    };
  } catch (e) {
    console.error('api호출 응 안돼', e);
    return {
      isActive: false,
      responseTime: 0,
    };
  }
};

export const useApiStatusCheck = (pipelineId: string, endpoint?: Endpoint, inputSchema?: InputSchema) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['apiStatus', pipelineId],
    queryFn: () => {
      if (!endpoint || !inputSchema) {
        throw new Error('API 정보가 없습니다');
      }
      return checkApiStatus(endpoint, inputSchema);
    },
    enabled: !!endpoint && !!inputSchema,
    staleTime: 1000 * 60 * 5, // 5분간 캐싱
    retry: 1, // 요청 실패 시 최대 1회 재시도
  });

  return {
    apiStatus: data,
    isStatusLoading: isLoading,
    isStatusError: isError,
    refreshStatus: refetch,
  };
};
