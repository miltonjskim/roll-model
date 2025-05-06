import { useQuery } from '@tanstack/react-query';
import { fetchProjectDetailVersion } from '@/shared/api/projectDetailApi';
import { useAtom } from 'jotai';
import { projectDetailAtom } from '@/shared/model/atoms/projectDetail.atoms';
import { useEffect } from 'react';

export const useProjectDetailVersion = (pipelineId: string) => {
  const [, setProjectDetail] = useAtom(projectDetailAtom);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['projectDetailVersion', pipelineId],
    queryFn: () => fetchProjectDetailVersion(pipelineId),
    enabled: !!pipelineId,
    staleTime: 1000 * 60 * 5, // 5분
  });

  // 프로젝트 정보가 업데이트되면 atom 업데이트
  // Maximum update depth exceeded 오류 발생 : 의존성배열에서 projectDetail제거
  // build eslint 경고발생
  // projectDetail값에 의존함 but projectDetail을 의존성 배열에 추가하면 무한루프
  // projectDetail을 빼버리고 prevstate로 처리하여 의존성 배열에서 projectDetail을 제거
  useEffect(() => {
    if (data?.data?.projectInfo) {
      setProjectDetail((prevState) => ({
        ...prevState,
        ...data.data.projectInfo,
        id: pipelineId,
      }));
    }
  }, [data, pipelineId, setProjectDetail]);

  return {
    projectDetailVersion: data?.data,
    isLoading,
    isError,
    error,
    refetch,
  };
};
